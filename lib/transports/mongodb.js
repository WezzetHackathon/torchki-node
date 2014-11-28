var mongo = require('mongodb');
var cp = require('child_process');

/**
 * Транспорт MongoDB
 * @param logger
 * @constructor
 */
var MongoDB = function(logger)
{
    var _this = this;

    this.logger = logger;
    this.defaults = {
        host: 'localhost',
        port: 27017,
        dbname: 'test',
        useReplicaSet: false,
        rsName: 'default',
        rs: []
    };
    this.options = {};
    this.server;
    this.db;

    //возьмем значение hostname
    this.hostname;
    cp.exec('hostname', function (error, stdout, stderr) {
        if(!error) _this.hostname = stdout.replace(/^\s+|\s+$/gm,'');
        else _this.hostname = -1;
        _this.logger.info('Current hostname: ' + _this.hostname);
    });
};

/**
 *
 * @param options
 * @param cb
 */
MongoDB.prototype.init = function(options, cb)
{
    var _this = this;
    options = options || {};

    //проверим готовность hostname
    if(!this.hostname) {
        setTimeout(function(){
            _this.init(options, cb);
        }, 1000);
        return;
    }

    //миксуем параметры
    for(var k in this.defaults){
        this.options[k] = options[k] !== undefined ? options[k] : this.defaults[k];
    }

    //подключаемся
    if(this.options.useReplicaSet && this.options.rs && this.options.rsName) {
        var rs = [];
        for(var i in this.options.rs) {
            if(this.options.rs[i].port){
                var host = null;
                //параметры hostPattern/hostTemplate имеют более высокий приоритет
                if(this.options.rs[i].hostPattern && this.options.rs[i].hostTemplate && this.hostname) {
                    try{
                        var pattern = new RegExp(this.options.rs[i].hostPattern),
                            matches = pattern.exec(this.hostname);

                        if(!matches) throw new Error('Unmatched pattern: /' + this.options.rs[i].hostPattern + '/ with hostname "' + this.hostname + '"');
                        //делаем замену в шаблоне вида club01{1}.wplatform.net, где {1} заменяется на соответствующий элемент в matches
                        host = this.options.rs[i].hostTemplate.replace(/\{(\d+)\}/g, function(s, m){
                            m = parseInt(m); //строку преобразуем в число, нужен числовой индекс
                            return typeof matches[m] != 'undefined' ? matches[m] : ''; //если данного элемента нет, заменяем пустой строкой
                        });
                    }
                    catch(e){
                        this.logger.warn(e.stack);
                    }
                }

                //если не применено hostPattern/hostTemplate или возникла ошибка, пытаемся применить параметр host
                if(!host && this.options.rs[i].host) host = this.options.rs[i].host;

                //если все ок, включаем сервер в пул соединений
                if(host) {
                    rs.push(new mongo.Server(host, this.options.rs[i].port, {auto_reconnect: true}));
                    this.logger.info('MongoDB Server #' + i, host, this.options.rs[i].port);
                }
            }
        }

        if(rs.length) {
            this.server = new mongo.ReplSet(rs, {
                rs_name: this.options.rsName,
                readPreference: mongo.ReadPreference.SECONDARY_PREFERRED, //отдаем предпочтение SECONDARY серверу
                strategy: 'ping', //стратегия выбора сервера чтения - ping
                logger: this.logger //передаем свой логгер в драйвер
            });
            this.logger.info('MongoDB connected as Replica Set');
        } else this.options.useReplicaSet = false; //нет достаточных параметров, значит подключаемся к stand-alone серверу
    }
    // else не используем, т.к. данное действие может быть выполнено и после попытки подключиться к репликасет
    if(!this.options.useReplicaSet) {
        this.server = new mongo.Server(this.options.host, this.options.port, {auto_reconnect: true});
        this.logger.info('MongoDB connected to stand-alone server');
    }
    this.db = new mongo.Db(this.options.dbname, this.server);

    this.db.open(function(err) {
        if(!err)
        {
            (typeof cb == 'function') && cb();
        }
        else
        {
            _this.logger.error(err);
        }
    });
};

MongoDB.prototype.getInstance = function() {
    return this;
};

module.exports = MongoDB;
var util 			= require('util'),
    EventEmitter 	= require('events').EventEmitter,
    http            = require('http');

var rpcServer = function(logger)
{
    var _this = this;

    this.logger = logger;
    this.config = {};
    this.server = null;
    this.stack = {};
    this.defaults = {
        host: '127.0.0.1',
        port: 80
    };

    this.on('error', function(err){
        _this.logger.error('RPC Server error: ', err.stack);
    });

    this.on('response', function(id, result){
        var response = this.stack[id][1];
        var eventId = this.stack[id][0];
        response.end(JSON.stringify({
            jsonrpc: "2.0",
            result: result,
            id: eventId
        }));
        delete this.stack[id];
    }.bind(this));
};

util.inherits(rpcServer, EventEmitter);

rpcServer.prototype.init = function(options, cb)
{
    var _this = this, warn = [];
    options = options || {};
    for(var k in this.defaults) {
        this.config[k] = options[k] ? options[k] : this.defaults[k];
        if(this.defaults[k] && !options[k]) warn.push(k);
    }
    if(warn.length) this.logger.warn('RPC Server transport initialised with required fields by default values: ' + warn.join(', '));

    this.server = http.createServer(function(request, response){

        var data = [];
        request.on('data', function(chunk){
            data.push(chunk);
        });

        request.on('end', function(){
            try {
                data = JSON.parse(data.toString());
            } catch (e) {
                response.writeHead(400, {'Content-Type': 'applications/json'});
                response.end();
                return;
            }

            if (!data.id || !data.method) {
                response.writeHead(400, {'Content-Type': 'applications/json'});
                response.end();
                return;
            }

            var requestId = Date.now();
            _this.stack[requestId] = [data.id, response];

            _this.emit('message', requestId, {
                method: data.method,
                params: data.params,
                id: data.id
            });
        });

        request.on('error', function(e){
            _this.emit('error', e);
        });

        response.writeHead(200, {
            'Content-Type': 'applications/json',
            'Access-Control-Allow-Origin': '*'
        });

    }).listen(this.config.port, this.config.host);

    (typeof cb == 'function') && cb();
};

exports.driver = rpcServer;
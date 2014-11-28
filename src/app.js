var Server = require('./../lib/transports/jsonrpc_server').driver,
    logger = require('./../plugins/logger').plugin,
    Storage = require('./storage'),
    Handler = require('./handler'),
    mediator = require('./mediator');

var Application = function () {
    this.logger = logger;
    this.server = new Server(this.logger);
    this.storage = new Storage(this.logger);
    this.handler = new Handler(this.logger, this.storage);

    this.server.on('message', function(requestId, event) {
        this.logger.debug('JSON-RPC request: ', requestId, event.method, event.params);
        mediator.emit('server:request', requestId, event.method, event.params);
    }.bind(this));

    mediator.on('server:response', function(requestId, data) {
        this.logger.debug('JSON-RPC response: ', requestId, data);
        this.server.emit('response', requestId, data);
    }.bind(this));
};

Application.prototype.run = function () {

    process.on('uncaughtException', function(err) {
        this.logger.error(err.stack);
    }.bind(this));

    this.server.init({
        host: '127.0.0.1',
        port: 8082
    });

    this.storage.init({
        host: '195.225.131.214',
        port: 27017,
        dbname: 'torchki'
    });

    this.logger.debug('Transports instantiated');
};

exports.app = new Application();
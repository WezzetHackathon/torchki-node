var mediator = require('./mediator');

var Handler = function (logger, storage) {
    this.logger = logger;
    this.storage = storage;

    mediator.on('server:request', this.call.bind(this));
};

Handler.prototype.call = function (requestId, method, data) {

    try {
        this[method](data, function(err, result) {
            mediator.emit('server:response', requestId, result);
        });
    } catch (e) {
        console.log(e.stack);
        mediator.emit('server:response', requestId, null);
    }
};

Handler.prototype.addUser = function (data, callback) {
    this.storage.addUser(data, function(){
        callback(null, true);
    });
};

Handler.prototype.getUsersList = function (data, callback) {
    this.storage.getUsersList(callback);
};

Handler.prototype.addTransaction = function (data, callback) {
    this.storage.addTransaction(data, callback);
};

Handler.prototype.getTransactionsList = function (data, callback) {
    this.storage.getTransactionsList(data, callback);
};

Handler.prototype.changeTransactionState = function (data) {
    return [];
};

module.exports = Handler;
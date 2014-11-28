var Mongo = require('./../lib/transports/mongodb.js'),
    ObjectID = require('mongodb').ObjectID;

var Storage = function (logger) {
    this.logger = logger;
    this.storage = new Mongo(this.logger);
};

Storage.prototype.init = function (options) {
    this.storage.init({
        host: options.host,
        port: options.port,
        dbname: options.dbname
    });


};

Storage.prototype.addUser = function (data, callback) {
    this.storage.db.collection('users', function(err, users) {
        users.insert({
            name: data.name,
            email: data.email
        }, callback);
    }.bind(this));
};

Storage.prototype.addTransaction = function (data, callback) {
    this.storage.db.collection('transactions', function(err, transactions) {
        transactions.findAndModify(
            {},
            [],
            {
                from: data.from,
                to: data.to,
                amount: data.amount,
                createdAt: Date.now(),
                updatedAt: null,
                status: 'open'
            },
            {
                w: 1,
                new: true,
                upsert: true
            },
            callback
        );
    }.bind(this));
};

Storage.prototype.getUsersList = function (callback) {
    this.storage.db.collection('users').find().toArray(callback);
};

Storage.prototype.getTransactionsList = function (userId, callback) {
    var request = {
        "$or": [
            {"from": userId},
            {"to": userId}
        ]
    };

    this.storage.db.collection('transactions').find(request).toArray(callback);
};

Storage.prototype.changeTransactionState = function () {

};

module.exports = Storage;
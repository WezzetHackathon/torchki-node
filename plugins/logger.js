/**
 * Logger plugin
 */

var _ = require('underscore');
var util = require('util');
var events = require('events');

var logger = function() {
    this.level;
    this.defaultLevel = 'info';
    this.logger;
};

util.inherits(logger, events.EventEmitter);

logger.prototype.log = function(level, messages)
{
    var output = [];
    if (!_.isObject(messages)) {
        messages = {0: messages};
    }
    for (var i in messages) {
        if (!_.isString(messages[i])) {
            output.push(messages[i] instanceof Error ? messages[i].toString() : JSON.stringify(messages[i]));
        } else {
            output.push(messages[i]);
        }
    }

    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? '0' : '') + month;
    var day = date.getDate();
    day = (day < 10 ? '0': '') + day;
    var hour = date.getHours();
    hour = (hour < 10 ? '0' : '') + hour;
    var minutes = date.getMinutes();
    minutes = (minutes < 10 ? '0' : '') + minutes;
    var seconds = date.getSeconds();
    seconds = (seconds < 10 ? '0' : '') + seconds;
    var time = day + '.' + month + '.' + date.getFullYear() + ' ' + hour + ':' + minutes + ':' + seconds;

    var logMessage = '[' + time + ']  - ' + output.join(' ');

    console.log(level, logMessage);
};

/**
 * Short level methods
 */

logger.prototype.info = function()
{
    this.log('info', arguments);
};
logger.prototype.debug = function()
{
    this.log('debug', arguments);
};
logger.prototype.warn = function()
{
    this.log('warn', arguments);
};
logger.prototype.error = function()
{
    this.log('error', arguments);
};

exports.plugin = new logger();
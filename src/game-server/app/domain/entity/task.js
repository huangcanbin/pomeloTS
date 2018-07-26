
var util = require('util');
var MySelf = require('./myself');


var Task = function (opts) {
    MySelf.call(this, opts);

    this.taskId = opts.taskId;
    this.num = opts.num;
    this.status = opts.status || 0;
};

util.inherits(Task, MySelf);

module.exports = Task;

//extend methods.


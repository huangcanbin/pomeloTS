
var util = require('util');
var MySelf = require('./myself');


var Bag = function (opts) {
    MySelf.call(this, opts);

    this.itemId = opts.itemId;
    this.num = opts.num;
    this.isFull = opts.isFull || false;
    this.type = opts.type;
};

util.inherits(Bag, MySelf);

module.exports = Bag;

//extend methods.


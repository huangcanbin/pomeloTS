
var util = require('util');
var Entity = require('./entity');


var MySelf = function (opts) {
    Entity.call(this, opts);

    this.playerId = opts.playerId;
};

util.inherits(MySelf, Entity);

module.exports = MySelf;

//extend methods.


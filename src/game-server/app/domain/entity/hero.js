
var util = require('util');
var MySelf = require('./myself');

/**
 * Role entity object
 * 
 * @param {object} opts init opts.
 */
var Hero = function (opts) {
    MySelf.call(this, opts);

    this.heroId = opts.heroId;
    this.pos = opts.pos || 0;
};

util.inherits(Hero, MySelf);

module.exports = Hero;


var util = require('util');
var MySelf = require('./myself');

/**
 * 玩家式神图鉴
 * 
 * @param {object} opts init opts.
 */
var Illustrated = function (opts) {
    MySelf.call(this, opts);

    this.heroId = opts.heroId;  //式神编号
};

util.inherits(Illustrated, MySelf);

module.exports = Illustrated;


var util = require('util');
var MySelf = require('./myself');

/**
 * 式神阵位实体数据
 * 
 * @param {object} opts init opts.
 */
var Lineup = function (opts) {
    MySelf.call(this, opts);

    this.pos = opts.pos || 0;                   //阵位编号
    this.lv = opts.lv || 1;                     //等级
    this.starLv = opts.starLv || 0;             //星级
    this.propLv = opts.propLv || 0;             //宝具等级
    this.skillLv = opts.skillLv || 0;           //技能(进化)等级
};

util.inherits(Lineup, MySelf);

module.exports = Lineup;

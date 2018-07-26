var consts = require('../../util/consts');
var util = require('util');
/**
 * 百鬼类型实体数据
 * 
 * @param {*} opts 
 */
var Goblin = function (opts) {
    opts = opts || {};
    this.id = opts.id || 0;         //bossId
    this.get = opts.get || true;   //领取过奖励 true:已领取 false:未领取
    this.updateTime = Date.now();
};

module.exports = Goblin;

//extend methods.

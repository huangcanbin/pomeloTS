var consts = require('../../util/consts');
var util = require('util');
/**
 * 玩家每日实体数据
 * 
 * @param {*} opts 
 */
var Daily = function (opts) {
    opts = opts || {};
    this.useGoldFree = opts.useGoldFree || 0;
    this.costGoldCount = opts.costGoldCount || 0;
    this.useMoneyFree = opts.useMoneyFree || 0;
    this.xp = opts.xp || 0;  //玩家xp值(xp满可以免费抽奖)

    //保底出SSR式神剩余次数
    this.ssrRemain = opts.ssrRemain || consts.Vars.SSR_INIT_NUM;
    this.updateTime = Date.now();
};

module.exports = Daily;

//extend methods.

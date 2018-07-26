const playerDao = require('../../dao/playerDao');
const lineupDao = require('../../dao/lineupDao');
const playerTaskDao = require('../../dao/playerTaskDao');
const heroDao = require('../../dao/heroDao');
const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家充值奖励
 */
class Recharge extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.rechargeId = opts.rechargeId || 10001;     //充值奖励Id,默认首充
        this.status = opts.status || 0;                 //任务状态 0：未达成、1:已达成 2:已领取
        this.rechargeMoney = opts.rechargeMoney || 0;   //充值累积金额
        this.rechargeNum = opts.rechargeNum || 0;       //充值次数
        this.todayRechargeMoney = opts.todayRechargeMoney || 0; //当日充值累积金额
        this.rechargeNum = opts.rechargeNum || 0;       //充值次数
        this.onceStatus = opts.onceStatus || 0;         //一次充值25元的标志 0：没达到、1：一次充值25元
        this.todayTimes = opts.todayTimes || 0;         //当日充值次数
        this.lastRechargeTime = opts.lastRechargeTime || Date.now(); //充值时间
    }
}

module.exports = Recharge;
const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家签到奖励记录
 */
class SignAward extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.status = opts.status || 10;      //任务状态 10代表第一次没有签到，11代表第一次签到已领取
        this.accustatus = opts.accustatus || 0; //累计签到是否领取，用二进制来进行表示。
        this.createTime = opts.createTime || Date.now();
    }
}

module.exports = SignAward;
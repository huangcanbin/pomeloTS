const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家关卡奖励记录
 */
class PointAward extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.awardId = opts.awardId;//关卡奖励配置编号
        this.status = opts.status || 20;      //任务状态 0：未达成、1:已达成 2:已领取
        this.onceStatus = opts.onceStatus || 10;      //任务状态 0：未领取、1:已领取
    }
}

module.exports = PointAward;
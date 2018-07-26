const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家签到奖励记录
 */
class HeroPieceRain extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.status = opts.status || 0;      //任务状态 0代表可领奖，1代表第一次签到已领取
        this.num = opts.num;
        this.rnum = opts.rnum;
        this.srnum = opts.srnum;
        this.ssrnum = opts.ssrnum;
        this.rssrnum = opts.rssrnum;
    }
}

module.exports = HeroPieceRain;
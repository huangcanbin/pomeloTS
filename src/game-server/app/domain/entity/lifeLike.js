const LifeLikeTotal = require('./lifeLikeTotal');

/**
 * 玩家签到奖励记录
 */
class LifeLike extends LifeLikeTotal {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.level = opts.level;      //第几重
        this.ballid = opts.ballid; //第几颗球
    }
}

module.exports = LifeLike;
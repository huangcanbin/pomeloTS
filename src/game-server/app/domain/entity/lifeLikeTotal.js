const MySelf = require('./myself');

/**
 * 玩家签到奖励记录
 */
class LifeLikeTotal extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.hp = opts.hp || 0;      //生命值
        this.attack = opts.attack || 0;      //攻击
        this.hit = opts.hit || 0;      //命中
        this.dodge = opts.dodge || 0;      //闪避
        this.speed = opts.speed || 0;      //速度
    }
}

module.exports = LifeLikeTotal;
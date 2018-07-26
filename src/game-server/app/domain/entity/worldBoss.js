const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家签到奖励记录
 */
class WorldBoss extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.name = opts.name;      //玩家名字
        this.bossid = opts.bossid;      //bossid
        this.hp = opts.hp || 0; //伤害量
        this.updatetime = opts.updatetime || Date.now(); //记录更新时间
        this.times = opts.times || 1;  //挑战次数
    }
}

module.exports = WorldBoss;
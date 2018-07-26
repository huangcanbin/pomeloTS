const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家签到奖励记录
 * 玩家首日和七天功能领奖励记录
 */
class FirstOnlineAward extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.type = opts.type;   //用来代表类型
        this.status = opts.status || 10; //10:不可领取，20:可领取，30：已领取，40：补领
        this.typeid = opts.typeid;
    }
}

module.exports = FirstOnlineAward;
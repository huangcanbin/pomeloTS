const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家充值返利领奖记录
 */
class RechargeRebate extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.type = opts.type;                //
        this.typeid = opts.typeid;
        this.status = opts.status || 10;      //10:不可领取，20:可领取，30：已领取，40：补领
        this.times = opts.times;              //可领次数
        this.alrtimes = opts.alrtimes || 0;   //已领取次数
        this.rechargetime = opts.rechargetime || Date.now(); //这个记录充值时，可领取的时间，过期不能领取
        this.rebatetype = opts.rebatetype;
        this.awardtime = opts.awardtime || 0; //领取时间
    }
}

module.exports = RechargeRebate;
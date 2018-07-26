const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家关卡抽奖记录
 */
class PointLottery extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.pointId = opts.pointId;//关卡编号
        this.lv = opts.lv || 1;      //关卡抽奖等级
        this.lastTime = opts.lastTime || Date.now();      //上次重置时间
        this.times = opts.times || 0; //抽奖次数 cd过了会重置
        this.allTimes = opts.times || 0; //抽奖总次数
        this.items = opts.items || []; //抽奖得到的物品
        this.heros = opts.heros || []; //抽奖得到的式神
        this.firstRechargeStatus = opts.firstRechargeStatus || 0; //第一次抽奖是否选择升级奖励
    }
}

module.exports = PointLottery;
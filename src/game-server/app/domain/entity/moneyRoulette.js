const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家抽奖记录
 */
class MoneyRoulette extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.money = opts.money;      //玩家花费勾玉
        this.awardmoney = opts.awardmoney; //抽奖得到的勾玉
        this.nextmoney = opts.nextmoney;  //下一轮要花费的勾玉
    }
}

module.exports = MoneyRoulette;
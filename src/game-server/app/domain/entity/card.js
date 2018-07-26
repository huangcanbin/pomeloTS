const utils = require('../../util/utils');
const MySelf = require('./myself');

class Card extends MySelf {
    /**
     * 构造
     */
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.monBuyTime = opts.monBuyTime || 0;      //月卡最后购买时间
        this.monValTime = opts.monValTime || 0;      //月卡有效时间
        this.eteBuyTime = opts.eteBuyTime || 0;      //终身卡购买时间
        this.monEvydayAwardTime = opts.monEvydayAwardTime || 0;    //月卡每日奖励最,后领取时间
        this.eteEvydayAwardTime = opts.eteEvydayAwardTime || 0;    //终身卡每日奖励,最后领取时间
    }

    /**
     * 是否领取月卡今日的奖励 是否领取月卡今日的奖励 true:已领取 false:未领取
     */
    isGetMonEvydayAward() {
        if (this.monEvydayAwardTime > 0) {
            return utils.isSameDate(this.monEvydayAwardTime, Date.now());
        }

        return false;
    }

    /**
     * 是否领取终身卡今日的奖励 true:已领取 false:未领取
     */
    isGetEteEvydayAward() {
        if (this.eteEvydayAwardTime > 0) {
            return utils.isSameDate(this.eteEvydayAwardTime, Date.now());
        }

        return false;
    }

    /**
     * 是否购买终身卡
     */
    isBuyEte() {
        return this.eteBuyTime > 0;
    }
}

module.exports = Card;

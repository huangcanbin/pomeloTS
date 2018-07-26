const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家镇妖塔记录
 */
class Tower extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.nowId = opts.nowId || 1;           //当前挑战的塔层编号
        this.highestId = opts.highestId || 1;   //挑战过最高的塔层编号
        this.resetNum = opts.resetNum || 0;     //今日重置次数
        this.resetTime = opts.resetTime || 0;   //最后重置时间
        this.isSweep = opts.isSweep || false;   //是否可以扫荡
    }
}

module.exports = Tower;
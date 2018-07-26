
const utils = require('../../util/utils');
const consts = require('../../util/consts');
const MySelf = require('./myself');

/**
 * 玩家日常任务
 */
class PlayerDailyTask extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.type = opts.type || consts.Enums.dailyTaskType.DailyGoblin;  //任务类型
        this.completeTimes = opts.completeTimes || 0;  //任务完成次数
        this.finishTime = opts.finishTime || Date.now();      //任务完成时间戳
    }
}

module.exports = PlayerDailyTask;

const utils = require('../../util/utils');
const consts = require('../../util/consts');
const MySelf = require('./myself');

/**
 * 玩家成就任务
 */
class PlayerAchieveTask extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.type = opts.type || consts.Enums.achieveTaskType.AchieveLv;  //任务编号
        this.status = opts.status || consts.Enums.achieveTaskAwardStatus.Not;  //任务完成状况，0未完成 ,1完成，2已领奖励
        this.finishTime = opts.finishTime || 0;      //任务完成时间戳
    }
}

module.exports = PlayerAchieveTask;
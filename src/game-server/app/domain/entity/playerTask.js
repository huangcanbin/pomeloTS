
const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家当前任务
 */
class PlayerTask extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.taskId = opts.taskId || 10001;  //任务Id
        this.status = opts.status || 0;      //任务状态 0：未达成、1:已达成 2:已领取
    }
}

module.exports = PlayerTask;
const utils = require('../../util/utils');
const MySelf = require('./myself');

/**
 * 玩家挑战大关卡Boss数据
 */
class BossCombatDao extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.stageId = opts.stageId;
        this.createTime = opts.createTime || 0;
    }
}

module.exports = BossCombatDao;
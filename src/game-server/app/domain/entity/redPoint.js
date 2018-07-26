const consts = require('../../util/consts');
const MySelf = require('./myself');
/**
 * 推送到玩家红点状态数据
 */
class RedPoint extends MySelf {
    constructor(opts) {
        opts = opts || {};

        super(opts);
        this.type = opts.type || consts.Enums.redPointType.Mail;           //红点类型,代表不同功能
        this.id = opts.id || 0 //代表对应该类型的步骤，比如功能引导之类的。
        this.status = opts.status || 0;    //状态 0：取消红点，1：点亮红点
    }
}

module.exports = RedPoint;
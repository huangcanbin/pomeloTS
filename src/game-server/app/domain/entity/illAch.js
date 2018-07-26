const utils = require('../../util/utils');
const consts = require('../../util/consts');
const MySelf = require('./myself');

class IllAch extends MySelf {
    constructor(opts) {
        if (!opts) { opts = {}; }

        super(opts);
        this.achId = opts.achId || 0;      //成就编号
        this.status = opts.status || consts.Enums.illAchStatus.Not;    //成就状态
    }
}

module.exports = IllAch;
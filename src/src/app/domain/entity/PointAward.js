Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class PointAward extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._awardId = opts.awardId;
        this._status = opts.status || 20;
        this._onceStatus = opts.onceStatus || 10;
    }
    get awardId() {
        return this._awardId;
    }
    get status() {
        return this._status;
    }
    get onceStatus() {
        return this._onceStatus;
    }
}
exports.PointAward = PointAward;

Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
const consts = require("../../util/consts");
class IllAch extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._achId = opts.achId || 0;
        this._status = opts.status || consts.default.consts.Enums.illAchStatus.Not;
    }
    get achId() {
        return this._achId;
    }
    get status() {
        return this._status;
    }
}
exports.IllAch = IllAch;

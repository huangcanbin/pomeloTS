Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class FirstOnlineAward extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._type = opts.type;
        this._status = opts.status || 10;
        this._typeid = opts.typeid;
    }
    get type() {
        return this._type;
    }
    get status() {
        return this._status;
    }
    get typeid() {
        return this._typeid;
    }
}
exports.FirstOnlineAward = FirstOnlineAward;

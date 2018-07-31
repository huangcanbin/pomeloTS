Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class SignAward extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._status = opts.status || 10;
        this._accustatus = opts.accustatus || 0;
    }
    get status() {
        return this._status;
    }
    get accustatus() {
        return this._accustatus;
    }
    get time() {
        return this.createTime;
    }
}
exports.SignAward = SignAward;

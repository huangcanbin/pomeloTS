Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class OffEarRec extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._exp = opts.exp || 0;
        this._gold = opts.gold || 0;
        this._items = opts.items || 0;
        this._isTimes = opts.isTimes || true;
    }
    get exp() {
        return this._exp;
    }
    get gold() {
        return this._gold;
    }
    get items() {
        return this._items;
    }
    get isTimes() {
        return this._isTimes;
    }
}
exports.OffEarRec = OffEarRec;

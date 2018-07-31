Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
const consts = require("../../util/consts");
class Daily extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._useGoldFree = opts.useGoldFree || 0;
        this._costGoldCount = opts.costGoldCount || 0;
        this._useMoneyFree = opts.useMoneyFree || 0;
        this._xp = opts.xp || 0;
        this._ssrRemain = opts.ssrRemain || consts.default.consts.Vars.SSR_INIT_NUM;
        this._updateTime = Date.now();
    }
    get useGoldFree() {
        return this._useGoldFree;
    }
    get costGoldCount() {
        return this._costGoldCount;
    }
    get useMoneyFree() {
        return this._useMoneyFree;
    }
    get xp() {
        return this._xp;
    }
    get ssrRemain() {
        return this._ssrRemain;
    }
    get updateTime() {
        return this._updateTime;
    }
}
exports.Daily = Daily;

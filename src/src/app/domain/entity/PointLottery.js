Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class PointLottery extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._pointId = opts.pointId;
        this._lv = opts.lv || 1;
        this._lastTime = opts.lastTime || Date.now();
        this._times = opts.times || 0;
        this._allTimes = opts.times || 0;
        this._items = opts.items || [];
        this._heros = opts.heros || [];
        this._firstRechargeStatus = opts.firstRechargeStatus || 0;
    }
    get pointId() {
        return this._pointId;
    }
    get lv() {
        return this._lv;
    }
    get lastTime() {
        return this._lastTime;
    }
    get times() {
        return this._times;
    }
    get allTimes() {
        return this._allTimes;
    }
    get items() {
        return this._items;
    }
    get heros() {
        return this._heros;
    }
    get firstRechargeStatus() {
        return this._firstRechargeStatus;
    }
}
exports.PointLottery = PointLottery;

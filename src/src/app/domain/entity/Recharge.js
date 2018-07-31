Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class Recharge extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._rechargeId = opts.rechargeId || 10001;
        this._status = opts.status || 0;
        this._rechargeMoney = opts.rechargeMoney || 0;
        this._rechargeNum = opts.rechargeNum || 0;
        this._todayRechargeMoney = opts.todayRechargeMoney || 0;
        this._onceStatus = opts.onceStatus || 0;
        this._todayTimes = opts.todayTimes || 0;
        this._lastRechargeTime = opts.lastRechargeTime || Date.now();
    }
    get rechargeId() {
        return this._rechargeId;
    }
    get status() {
        return this._status;
    }
    get rechargeMoney() {
        return this._rechargeMoney;
    }
    get rechargeNum() {
        return this._rechargeNum;
    }
    get todayRechargeMoney() {
        return this._todayRechargeMoney;
    }
    get onceStatus() {
        return this._onceStatus;
    }
    get todayTimes() {
        return this._todayTimes;
    }
    get lastRechargeTime() {
        return this._lastRechargeTime;
    }
}
exports.Recharge = Recharge;

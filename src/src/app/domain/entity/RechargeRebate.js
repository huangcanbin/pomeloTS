Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class RechargeRebate extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._type = opts.type;
        this._typeid = opts.typeid;
        this._status = opts.status || 10;
        this._times = opts.times;
        this._alrtimes = opts.alrtimes || 0;
        this._rechargetime = opts.rechargetime || Date.now();
        this._rebatetype = opts.rebatetype;
        this._rebatetime = opts.awardtime || 0;
    }
    get type() {
        return this._type;
    }
    get typeid() {
        return this._typeid;
    }
    get status() {
        return this._status;
    }
    get times() {
        return this._times;
    }
    get alrtimes() {
        return this._alrtimes;
    }
    get rechargetime() {
        return this._rechargetime;
    }
    get rebatetype() {
        return this._rebatetype;
    }
    get rebatetime() {
        return this._rebatetime;
    }
}
exports.RechargeRebate = RechargeRebate;

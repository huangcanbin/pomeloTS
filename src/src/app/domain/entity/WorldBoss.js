Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class WorldBoss extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._name = opts.name;
        this._bossid = opts.bossid;
        this._hp = opts.hp || 0;
        this._updatetime = opts.updatetime || Date.now();
        this._times = opts.times || 1;
    }
    get name() {
        return this._name;
    }
    get bossid() {
        return this._bossid;
    }
    get hp() {
        return this._hp;
    }
    get updatetime() {
        return this._updatetime;
    }
    get times() {
        return this._times;
    }
}
exports.WorldBoss = WorldBoss;

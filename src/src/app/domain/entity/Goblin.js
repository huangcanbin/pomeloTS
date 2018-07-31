Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class Goblin extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._id = opts.id || 0;
        this._get = opts.get || true;
        this._updateTime = Date.now();
    }
    get id() {
        return this._id;
    }
    get get() {
        return this._get;
    }
    get updateTime() {
        return this._updateTime;
    }
}
exports.Goblin = Goblin;

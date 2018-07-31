Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class LifeLike extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._level = opts.level;
        this._ballid = opts.ballid;
    }
    get level() {
        return this._level;
    }
    get ballid() {
        return this._ballid;
    }
}
exports.LifeLike = LifeLike;

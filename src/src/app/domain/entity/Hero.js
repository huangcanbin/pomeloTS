Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class Hero extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._heroId = opts.heroId;
        this._pos = opts.pos || 0;
    }
    get heroId() {
        return this._heroId;
    }
    get pos() {
        return this._pos;
    }
}
exports.Hero = Hero;

Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class Illustrated extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._heroId = opts.heroId;
    }
    get heroId() {
        return this._heroId;
    }
}
exports.Illustrated = Illustrated;

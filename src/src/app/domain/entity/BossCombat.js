Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class BossCombat extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._stageId = opts.stageId;
    }
    get createTime() {
        return this.createTime || 0;
    }
    get stageId() {
        return this._stageId;
    }
}
exports.BossCombat = BossCombat;

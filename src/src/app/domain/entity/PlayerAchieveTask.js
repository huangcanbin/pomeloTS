Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
const consts = require("../../util/consts");
class PlayerAchieveTask extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._type = opts.type || consts.default.consts.Enums.achieveTaskType.AchieveLv;
        this._status = opts.status || consts.default.consts.Enums.achieveTaskAwardStatus.Not;
        this._finishTime = opts.finishTime || 0;
    }
    get type() {
        return this._type;
    }
    get status() {
        return this._status;
    }
    get finishTime() {
        return this._finishTime;
    }
}
exports.PlayerAchieveTask = PlayerAchieveTask;

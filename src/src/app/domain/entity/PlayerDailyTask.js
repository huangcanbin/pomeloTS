Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("../../util/consts");
const MySelf_1 = require("./MySelf");
class PlayerDailyTask extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._type = opts.type || consts.default.consts.Enums.dailyTaskType.DailyGoblin;
        this._completeTimes = opts.completeTimes || 0;
        this._finishTime = opts.finishTime || Date.now();
    }
    get type() {
        return this._type;
    }
    get completeTimes() {
        return this._completeTimes;
    }
    get finishTime() {
        return this._finishTime;
    }
}
exports.PlayerDailyTask = PlayerDailyTask;

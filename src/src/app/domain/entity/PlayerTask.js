Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class PlayerTask extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._taskId = opts.taskId || 10001;
        this._status = opts.status || 0;
    }
    get taskId() {
        return this._taskId;
    }
    get status() {
        return this._status;
    }
}
exports.PlayerTask = PlayerTask;

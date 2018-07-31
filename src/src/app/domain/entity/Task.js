Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class Task extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._taskId = opts.taskId;
        this._num = opts.num;
        this._status = opts.status || 0;
    }
    get taskId() {
        return this._taskId;
    }
    get num() {
        return this._num;
    }
    get status() {
        return this._status;
    }
}
exports.Task = Task;

Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class Tower extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._nowId = opts.nowId || 1;
        this._highestId = opts.highestId || 1;
        this._resetNum = opts.resetNum || 0;
        this._resetTime = opts.resetTime || 0;
        this._isSweep = opts.isSweep || false;
    }
    get nowId() {
        return this._nowId;
    }
    get highestId() {
        return this._highestId;
    }
    get resetNum() {
        return this._resetNum;
    }
    get resetTime() {
        return this._resetTime;
    }
    get isSweep() {
        return this._isSweep;
    }
}
exports.Tower = Tower;

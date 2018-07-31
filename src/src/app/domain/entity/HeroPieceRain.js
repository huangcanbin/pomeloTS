Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class HeroPieceRain extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._status = opts.status || 0;
        this._num = opts.num;
        this._rnum = opts.rnum;
        this._srnum = opts.srnum;
        this._ssrnum = opts.ssrnum;
        this._rssrnum = opts.rssrnum;
    }
    get status() {
        return this._status;
    }
    get num() {
        return this._num;
    }
    get rnum() {
        return this._rnum;
    }
    get srnum() {
        return this._srnum;
    }
    get ssrnum() {
        return this._ssrnum;
    }
    get rssrnum() {
        return this._rssrnum;
    }
}
exports.HeroPieceRain = HeroPieceRain;

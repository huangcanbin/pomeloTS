Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class Lineup extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._pos = opts.pos || 0;
        this._lv = opts.lv || 1;
        this._starLv = opts.starLv || 0;
        this._propLv = opts.propLv || 0;
        this._skillLv = opts.skillLv || 0;
    }
    get pos() {
        return this._pos;
    }
    get lv() {
        return this._lv;
    }
    get starLv() {
        return this._starLv;
    }
    get propLv() {
        return this._propLv;
    }
    get skillLv() {
        return this._skillLv;
    }
}
exports.Lineup = Lineup;

Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
const utils = require("../../util/utils");
class Card extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._monBuyTime = opts.monBuyTime || 0;
        this._monValTime = opts.monValTime || 0;
        this._eteBuyTime = opts.eteBuyTime || 0;
        this._monEvydayAwardTime = opts.monEvydayAwardTime || 0;
        this._eteEvydayAwardTime = opts.eteEvydayAwardTime || 0;
    }
    isGetMonEvydayAward() {
        if (this.monEvydayAwardTime > 0) {
            return utils.Utils.getInstance().isSameDate(this.monEvydayAwardTime, Date.now());
        }
        return false;
    }
    isGetEteEvydayAward() {
        if (this.eteEvydayAwardTime > 0) {
            return utils.Utils.getInstance().isSameDate(this.eteEvydayAwardTime, Date.now());
        }
        return false;
    }
    isBuyEte() {
        return this.eteBuyTime > 0;
    }
    get monBuyTime() {
        return this._monBuyTime;
    }
    get monValTime() {
        return this._monValTime;
    }
    get eteBuyTime() {
        return this._eteBuyTime;
    }
    get monEvydayAwardTime() {
        return this._monEvydayAwardTime;
    }
    get eteEvydayAwardTime() {
        return this._eteEvydayAwardTime;
    }
}
exports.Card = Card;

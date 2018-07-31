Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class MoneyRoulette extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._money = opts.money;
        this._awardmoney = opts.awardmoney;
        this._nextmoney = opts.nextmoney;
    }
    get money() {
        return this._money;
    }
    get awardmoney() {
        return this._awardmoney;
    }
    get nextmoney() {
        return this._nextmoney;
    }
}
exports.MoneyRoulette = MoneyRoulette;

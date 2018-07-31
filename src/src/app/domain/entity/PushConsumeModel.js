Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("../../util/consts");
const MySelf_1 = require("./MySelf");
class PushConsumeModel extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._ServerID = opts.serverID || 0;
        this._Type = opts.type || consts.default.consts.Enums.consumeType.buyItem;
        this._AccountID = opts.accountID || 0;
        this._UserID = opts.accountID || 0;
        this._Number = opts.number || 0;
        this._ItemType = opts.itemType || 0;
        this._Price = opts.price || 0;
        this._ItemCnt = opts.itemCnt || 1;
        this._MoneyType = opts.moneyType || consts.default.consts.Enums.consumeMoneyType.money;
    }
    get ServerID() {
        return this._ServerID;
    }
    get Type() {
        return this._Type;
    }
    get AccountID() {
        return this._AccountID;
    }
    get UserID() {
        return this._UserID;
    }
    get Number() {
        return this._Number;
    }
    get ItemType() {
        return this._ItemType;
    }
    get Price() {
        return this._Price;
    }
    get ItemCnt() {
        return this._ItemCnt;
    }
    get MoneyType() {
        return this._MoneyType;
    }
}
exports.PushConsumeModel = PushConsumeModel;

Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
class Bag extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        this._itemId = opts.itemId;
        this._num = opts.num;
        this._isFull = opts.isFull || false;
        this._type = opts.type;
    }
    get itemId() {
        return this._itemId;
    }
    get num() {
        return this._num;
    }
    get type() {
        return this._type;
    }
    get isFull() {
        return this._isFull;
    }
}
exports.Bag = Bag;

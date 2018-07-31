Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
const consts = require("../../util/consts");
class RedPoint extends MySelf_1.MySelf {
    constructor(opts) {
        if (!opts) {
            opts = {};
        }
        super(opts);
        this._type = opts.type || consts.default.consts.Enums.redPointType.Mail;
        this._id = opts.id || 0;
        this._status = opts.status || 0;
    }
    get type() {
        return this._type;
    }
    get id() {
        return this._id;
    }
    get status() {
        return this._status;
    }
}
exports.RedPoint = RedPoint;

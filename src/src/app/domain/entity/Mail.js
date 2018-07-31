Object.defineProperty(exports, "__esModule", { value: true });
const MySelf_1 = require("./MySelf");
const consts = require("../../util/consts");
const ConfigCache = require("../../cache/configCache");
class Mail extends MySelf_1.MySelf {
    constructor(opts) {
        super(opts);
        let mailtime = ConfigCache.ConfigCache.getInstance().getVarConst(consts.default.consts.Keys.MAIL_TIME) * 1000;
        this._isread = opts.isread || 0;
        this._items = opts.items || [];
        this._title = opts.title || "你好";
        this._content = opts.content || "欢迎来到百鬼游戏";
        this._deltime = opts.deltime || Date.now() + mailtime;
    }
    get isread() {
        return this._isread;
    }
    get items() {
        return this._items;
    }
    get title() {
        return this._title;
    }
    get content() {
        return this._content;
    }
    get deltime() {
        return this._deltime;
    }
}
exports.Mail = Mail;

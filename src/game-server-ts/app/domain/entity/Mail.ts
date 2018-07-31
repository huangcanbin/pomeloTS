import { MySelf } from "./MySelf";
import consts = require('../../util/consts');
import ConfigCache = require('../../cache/ConfigCache');

/**
 * 邮件实体数据模型
 * @author Andrew_Huang
 * @export
 * @class Mail
 * @extends {MySelf}
 */
export class Mail extends MySelf
{
    private _isread: number;    //0：未读，1：已读
    private _items: any;        //邮件奖励
    private _title: string;     //邮件标题
    private _content: string;   //邮件内容
    private _deltime: number;   //邮件删除时间

    public constructor(opts: any)
    {
        super(opts);
        let mailtime = ConfigCache.ConfigCache.getInstance().getVarConst(consts.default.consts.Keys.MAIL_TIME) * 1000;
        this._isread = opts.isread || 0;
        this._items = opts.items || [];
        this._title = opts.title || "你好";
        this._content = opts.content || "欢迎来到百鬼游戏";
        this._deltime = opts.deltime || Date.now() + mailtime;
    }

    public get isread(): number
    {
        return this._isread;
    }

    public get items(): any
    {
        return this._items;
    }

    public get title(): string
    {
        return this._title;
    }

    public get content(): string
    {
        return this._content;
    }

    public get deltime(): number
    {
        return this._deltime;
    }
}
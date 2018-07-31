import { MySelf } from "./MySelf";
import consts = require('../../util/consts');
/**
 * 推送到玩家红点状态数据
 * @author Andrew_Huang
 * @export
 * @class RedPoint
 * @extends {MySelf}
 */
export class RedPoint extends MySelf
{
    private _type: number;    //红点类型,代表不同功能
    private _id: number;      //代表对应该类型的步骤，比如功能引导之类的
    private _status: number;  //状态 0：取消红点，1：点亮红点

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._type = opts.type || consts.default.consts.Enums.redPointType.Mail;
        this._id = opts.id || 0;
        this._status = opts.status || 0;
    }

    public get type(): number
    {
        return this._type;
    }

    public get id(): number
    {
        return this._id;
    }

    public get status(): number
    {
        return this._status;
    }
}
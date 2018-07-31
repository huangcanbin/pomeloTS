import { MySelf } from "./MySelf";

/**
 * 玩家签到奖励记录
 * 玩家首日和七天功能领奖励记录
 * @author Andrew_Huang
 * @export
 * @class FirstOnlineAward
 * @extends {MySelf}
 */
export class FirstOnlineAward extends MySelf
{
    private _type: number;    //类型，1：首日在线，2：七天在线
    private _status: number;  //10:不可领取，20:可领取，30：已领取，40：补领
    private _typeid: number;  //对应档次

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._type = opts.type;
        this._status = opts.status || 10;
        this._typeid = opts.typeid;
    }

    public get type(): number
    {
        return this._type;
    }

    public get status(): number
    {
        return this._status;
    }

    public get typeid(): number
    {
        return this._typeid;
    }
}
import { MySelf } from "./MySelf";

/**
 * 玩家充值返利领奖记录实体数据模型 
 * @author Andrew_Huang
 * @export
 * @class RechargeRebate
 * @extends {MySelf}
 */
export class RechargeRebate extends MySelf
{
    private _type: number;         //充值类型
    private _typeid: number;       //对应档次
    private _status: number;       //10:不可领取，20:可领取，30：已领取，40：补领
    private _times: number;        //可领次数
    private _alrtimes: number;     //已领取次数
    private _rechargetime: number; //这个记录充值时，可领取的时间，过期不能领取
    private _rebatetype: number;   //返利类型
    private _rebatetime: number;   //领取时间

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._type = opts.type;
        this._typeid = opts.typeid;
        this._status = opts.status || 10;
        this._times = opts.times;
        this._alrtimes = opts.alrtimes || 0;
        this._rechargetime = opts.rechargetime || Date.now();
        this._rebatetype = opts.rebatetype;
        this._rebatetime = opts.awardtime || 0;
    }

    public get type(): number
    {
        return this._type;
    }

    public get typeid(): number
    {
        return this._typeid;
    }

    public get status(): number
    {
        return this._status;
    }

    public get times(): number
    {
        return this._times;
    }

    public get alrtimes(): number
    {
        return this._alrtimes;
    }

    public get rechargetime(): number
    {
        return this._rechargetime;
    }

    public get rebatetype(): number
    {
        return this._rebatetype;
    }

    public get rebatetime(): number
    {
        return this._rebatetime;
    }
}
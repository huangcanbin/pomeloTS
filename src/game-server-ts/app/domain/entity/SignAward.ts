import { MySelf } from "./MySelf";

/**
 * 玩家签到奖励记录实体数据模型
 * @author Andrew_Huang
 * @export
 * @class SignAward
 * @extends {MySelf}
 */
export class SignAward extends MySelf
{
    private _status: number;     //任务状态 10代表第一次没有签到，11代表第一次签到已领取
    private _accustatus: number; //累计签到是否领取，用二进制来进行表示

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._status = opts.status || 10;
        this._accustatus = opts.accustatus || 0;
    }

    public get status(): number
    {
        return this._status;
    }

    public get accustatus(): number
    {
        return this._accustatus;
    }

    /**
     * 创建时间
     * @readonly
     * @type {number}
     * @memberof SignAward
     */
    public get time(): number
    {
        return this.createTime;
    }
}
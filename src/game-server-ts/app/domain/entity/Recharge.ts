import { MySelf } from "./MySelf";

/**
 * 玩家充值奖励实体数据模型
 * @author Andrew_Huang
 * @export
 * @class Recharge
 * @extends {MySelf}
 */
export class Recharge extends MySelf
{
    private _rechargeId: number;         //充值奖励Id,默认首充
    private _status: number;             //任务状态 0：未达成、1:已达成 2:已领取
    private _rechargeMoney: number;      //充值累积金额
    private _rechargeNum: number;        //充值次数
    private _todayRechargeMoney: number; //当日充值累积金额
    private _onceStatus: number;         //一次充值25元的标志 0：没达到、1：一次充值25元
    private _todayTimes: number;         //当日充值次数
    private _lastRechargeTime: number;   //充值时间

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._rechargeId = opts.rechargeId || 10001;
        this._status = opts.status || 0;
        this._rechargeMoney = opts.rechargeMoney || 0;
        this._rechargeNum = opts.rechargeNum || 0;
        this._todayRechargeMoney = opts.todayRechargeMoney || 0;
        this._onceStatus = opts.onceStatus || 0;
        this._todayTimes = opts.todayTimes || 0;
        this._lastRechargeTime = opts.lastRechargeTime || Date.now();
    }

    public get rechargeId(): number
    {
        return this._rechargeId;
    }

    public get status(): number
    {
        return this._status;
    }

    public get rechargeMoney(): number
    {
        return this._rechargeMoney;
    }

    public get rechargeNum(): number
    {
        return this._rechargeNum;
    }

    public get todayRechargeMoney(): number
    {
        return this._todayRechargeMoney;
    }

    public get onceStatus(): number
    {
        return this._onceStatus;
    }

    public get todayTimes(): number
    {
        return this._todayTimes;
    }

    public get lastRechargeTime(): number
    {
        return this._lastRechargeTime;
    }
}
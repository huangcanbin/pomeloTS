import { MySelf } from "./MySelf";

/** 
 * 玩家关卡抽奖记录实体数据模型
 * @author Andrew_Huang
 * @export
 * @class PointLottery
 * @extends {MySelf}
 */
export class PointLottery extends MySelf
{
    private _pointId: number;              //关卡编号
    private _lv: number;                   //关卡抽奖等级
    private _lastTime: number;             //上次重置时间
    private _times: number;                //抽奖次数 cd过了会重置
    private _allTimes: number;             //抽奖总次数
    private _items: any;                   //抽奖得到的物品
    private _heros: any;                   //抽奖得到的式神
    private _firstRechargeStatus: number;  //第一次抽奖是否选择升级奖励

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._pointId = opts.pointId;
        this._lv = opts.lv || 1;
        this._lastTime = opts.lastTime || Date.now();
        this._times = opts.times || 0;
        this._allTimes = opts.times || 0;
        this._items = opts.items || [];
        this._heros = opts.heros || [];
        this._firstRechargeStatus = opts.firstRechargeStatus || 0;
    }

    public get pointId(): number
    {
        return this._pointId;
    }

    public get lv(): number
    {
        return this._lv;
    }

    public get lastTime(): number
    {
        return this._lastTime;
    }

    public get times(): number
    {
        return this._times;
    }

    public get allTimes(): number
    {
        return this._allTimes;
    }

    public get items(): any
    {
        return this._items;
    }

    public get heros(): any
    {
        return this._heros;
    }

    public get firstRechargeStatus(): number
    {
        return this._firstRechargeStatus;
    }
}
import { MySelf } from "./MySelf";
import consts = require('../../util/consts');

/**
 * 玩家日常实体数据
 * @author Andrew_Huang
 * @export
 * @class Daily
 * @extends {MySelf}
 */
export class Daily extends MySelf
{
    private _useGoldFree: number;   //金币抽已使用免费次数
    private _costGoldCount: number; //金币抽奖次数
    private _useMoneyFree: number;  //代币抽已使用免费次数
    private _xp: number;            //玩家xp值(xp满可以免费抽奖)
    private _ssrRemain: number;     //代币抽还差多少次必出SSR数
    private _updateTime: number;    //更新时间

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._useGoldFree = opts.useGoldFree || 0;
        this._costGoldCount = opts.costGoldCount || 0;
        this._useMoneyFree = opts.useMoneyFree || 0;
        this._xp = opts.xp || 0;
        this._ssrRemain = opts.ssrRemain || consts.default.consts.Vars.SSR_INIT_NUM;
        this._updateTime = Date.now();
    }

    public get useGoldFree(): number
    {
        return this._useGoldFree;
    }

    public get costGoldCount(): number
    {
        return this._costGoldCount;
    }

    public get useMoneyFree(): number
    {
        return this._useMoneyFree;
    }

    public get xp(): number
    {
        return this._xp;
    }

    public get ssrRemain(): number
    {
        return this._ssrRemain;
    }

    public get updateTime(): number
    {
        return this._updateTime;
    }
}
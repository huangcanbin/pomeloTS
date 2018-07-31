import { MySelf } from "./MySelf";
import utils = require('../../util/utils');

/**
 * 特权卡数据模型
 * @author Andrew_Huang
 * @export
 * @class Card
 * @extends {MySelf}
 */
export class Card extends MySelf
{
    private _monBuyTime: number;          //月卡最后购买时间
    private _monValTime: number;          //月卡有效时间
    private _eteBuyTime: number           //终身卡购买时间
    private _monEvydayAwardTime: number;  //月卡每日奖励最,后领取时间
    private _eteEvydayAwardTime: number;  //终身卡每日奖励,最后领取时间

    public constructor(opts: any)
    {
        super(opts);
        this._monBuyTime = opts.monBuyTime || 0;
        this._monValTime = opts.monValTime || 0;
        this._eteBuyTime = opts.eteBuyTime || 0;
        this._monEvydayAwardTime = opts.monEvydayAwardTime || 0;
        this._eteEvydayAwardTime = opts.eteEvydayAwardTime || 0;
    }

    /**
     * 是否领取月卡今日的奖励 是否领取月卡今日的奖励 true:已领取 false:未领取
     * @author Andrew_Huang
     * @returns {boolean}
     * @memberof Card
     */
    public isGetMonEvydayAward(): boolean
    {
        if (this.monEvydayAwardTime > 0)
        {
            return utils.Utils.getInstance().isSameDate(this.monEvydayAwardTime, Date.now());
        }

        return false;
    }

    /**
     * 是否领取终身卡今日的奖励 true:已领取 false:未领取
     * @author Andrew_Huang
     * @returns {boolean}
     * @memberof Card
     */
    public isGetEteEvydayAward(): boolean
    {
        if (this.eteEvydayAwardTime > 0)
        {
            return utils.Utils.getInstance().isSameDate(this.eteEvydayAwardTime, Date.now());
        }
        return false;
    }

    /**
     * 是否购买终身卡
     * @author Andrew_Huang
     * @returns {boolean}
     * @memberof Card
     */
    public isBuyEte(): boolean
    {
        return this.eteBuyTime > 0;
    }

    public get monBuyTime(): number
    {
        return this._monBuyTime;
    }

    public get monValTime(): number
    {
        return this._monValTime;
    }

    public get eteBuyTime(): number
    {
        return this._eteBuyTime;
    }

    public get monEvydayAwardTime(): number
    {
        return this._monEvydayAwardTime;
    }

    public get eteEvydayAwardTime(): number
    {
        return this._eteEvydayAwardTime;
    }
}
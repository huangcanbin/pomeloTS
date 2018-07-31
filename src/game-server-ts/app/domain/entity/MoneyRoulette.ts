import { MySelf } from "./MySelf";

/**
 * 玩家抽奖记录实体数据模型
 * @author Andrew_Huang
 * @export
 * @class MoneyRoulette
 * @extends {MySelf}
 */
export class MoneyRoulette extends MySelf
{
    private _money: number;       //玩家花费勾玉
    private _awardmoney: number;  //抽奖得到的勾玉
    private _nextmoney: number;   //下一轮要花费的勾玉

    public constructor(opts: any)
    {
        super(opts);
        this._money = opts.money;
        this._awardmoney = opts.awardmoney;
        this._nextmoney = opts.nextmoney;
    }

    public get money(): number
    {
        return this._money;
    }

    public get awardmoney(): number
    {
        return this._awardmoney;
    }

    public get nextmoney(): number
    {
        return this._nextmoney;
    }
}
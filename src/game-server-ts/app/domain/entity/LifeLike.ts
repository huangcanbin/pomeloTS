import { MySelf } from "./MySelf";

/**
 * 命格实体数据模型
 * @author Andrew_Huang
 * @export
 * @class LifeLike
 * @extends {MySelf}
 */
export class LifeLike extends MySelf
{
    private _level: number;    //层级编号
    private _ballid: number;   //对应某颗球

    public constructor(opts: any)
    {
        super(opts);
        this._level = opts.level;
        this._ballid = opts.ballid;
    }

    public get level(): number
    {
        return this._level;
    }

    public get ballid(): number
    {
        return this._ballid;
    }
}
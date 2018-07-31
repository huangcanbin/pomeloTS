import { MySelf } from "./MySelf";

/**
 * 百鬼类型实体数据模型
 * @author Andrew_Huang
 * @export
 * @class Goblin
 * @extends {MySelf}
 */
export class Goblin extends MySelf
{
    private _id: number;          //bossId
    private _get: boolean;        //领取过奖励 true:已领取 false:未领取
    private _updateTime: number;  //更新时间

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._id = opts.id || 0;
        this._get = opts.get || true;
        this._updateTime = Date.now();
    }

    public get id(): number
    {
        return this._id;
    }

    public get get(): boolean
    {
        return this._get;
    }

    public get updateTime(): number
    {
        return this._updateTime;
    }
}
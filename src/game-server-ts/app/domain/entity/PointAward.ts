import { MySelf } from "./MySelf";

/**
 *  玩家关卡奖励记录实体数据模型
 * @author Andrew_Huang
 * @export
 * @class PointAward
 * @extends {MySelf}
 */
export class PointAward extends MySelf
{
    private _awardId: number;    //关卡奖励配置编号
    private _status: number;     //任务状态 0：未达成、1:已达成 2:已领取
    private _onceStatus: number; //任务状态 0：未领取、1:已领取

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._awardId = opts.awardId;
        this._status = opts.status || 20;
        this._onceStatus = opts.onceStatus || 10;
    }

    public get awardId(): number
    {
        return this._awardId;
    }

    public get status(): number
    {
        return this._status;
    }

    public get onceStatus(): number
    {
        return this._onceStatus;
    }
}
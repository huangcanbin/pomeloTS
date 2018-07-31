import { MySelf } from "./MySelf";
import consts = require('../../util/consts');

/**
 * 玩家成就任务实体数据模型
 * @author Andrew_Huang
 * @export
 * @class PlayerAchieveTask
 * @extends {MySelf}
 */
export class PlayerAchieveTask extends MySelf
{
    private _type: number;      //任务编号
    private _status: number;    //任务完成状况，0未完成 ,1完成，2已领奖励
    private _finishTime: number;//任务完成时间戳

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._type = opts.type || consts.default.consts.Enums.achieveTaskType.AchieveLv;
        this._status = opts.status || consts.default.consts.Enums.achieveTaskAwardStatus.Not;
        this._finishTime = opts.finishTime || 0;
    }

    public get type(): number
    {
        return this._type;
    }

    public get status(): number
    {
        return this._status;
    }

    public get finishTime(): number
    {
        return this._finishTime;
    }
}
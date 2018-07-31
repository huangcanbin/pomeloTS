import consts = require('../../util/consts');
import { MySelf } from './MySelf';

/**
 * 玩家日常任务实体数据模型
 * @author Andrew_Huang
 * @export
 * @class PlayerDailyTask
 * @extends {MySelf}
 */
export class PlayerDailyTask extends MySelf
{
    private _type: number;             //任务类型
    private _completeTimes: number;    //任务完成次数
    private _finishTime: number;       //任务完成时间戳

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._type = opts.type || consts.default.consts.Enums.dailyTaskType.DailyGoblin;
        this._completeTimes = opts.completeTimes || 0;
        this._finishTime = opts.finishTime || Date.now();
    }

    public get type(): number
    {
        return this._type;
    }

    public get completeTimes(): number
    {
        return this._completeTimes;
    }

    public get finishTime(): number
    {
        return this._finishTime;
    }
}
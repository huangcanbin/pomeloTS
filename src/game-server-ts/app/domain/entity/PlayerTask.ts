import { MySelf } from "./MySelf";

/**
 * 玩家当前任务
 * @author Andrew_Huang
 * @export
 * @class PlayerTask
 * @extends {MySelf}
 */
export class PlayerTask extends MySelf
{
    private _taskId: number;    //任务Id
    private _status: number;    //任务状态 0：未达成、1:已达成 2:已领取

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._taskId = opts.taskId || 10001;
        this._status = opts.status || 0;
    }

    public get taskId(): number
    {
        return this._taskId;
    }

    public get status(): number
    {
        return this._status;
    }
}
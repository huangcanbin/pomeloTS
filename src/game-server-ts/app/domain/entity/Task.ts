import { MySelf } from "./MySelf";

/**
 * 任务实体数据模型
 * @author Andrew_Huang
 * @export
 * @class Task
 * @extends {MySelf}
 */
export class Task extends MySelf
{
    private _taskId: number;   //任务ID
    private _num: number;      //任务数量
    private _status: number;   //任务状态

    public constructor(opts: any)
    {
        super(opts);
        this._taskId = opts.taskId;
        this._num = opts.num;
        this._status = opts.status || 0;
    }

    public get taskId(): number
    {
        return this._taskId;
    }

    public get num(): number
    {
        return this._num;
    }

    public get status(): number
    {
        return this._status;
    }
}
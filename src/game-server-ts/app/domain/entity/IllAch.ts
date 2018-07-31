import { MySelf } from "./MySelf";
import consts = require('../../util/consts');

/**
 * 成就实体数据模型
 * @author Andrew_Huang
 * @export
 * @class IllAch
 * @extends {MySelf}
 */
export class IllAch extends MySelf
{
    private _achId: number;  //成就编号
    private _status: number; //成就状态

    public constructor(opts: any)
    {
        super(opts);
        this._achId = opts.achId || 0;
        this._status = opts.status || consts.default.consts.Enums.illAchStatus.Not;
    }

    public get achId(): number
    {
        return this._achId;
    }

    public get status(): number
    {
        return this._status;
    }
}
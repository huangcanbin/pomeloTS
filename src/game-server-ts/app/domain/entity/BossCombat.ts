import { MySelf } from "./MySelf";

/**
 * 玩家挑战大关卡Boss数据模型
 * @author Andrew_Huang
 * @export
 * @class BossCombat
 * @extends {MySelf}
 */
export class BossCombat extends MySelf
{
    private _stageId: number;   //大关卡ID

    public constructor(opts: any)
    {
        super(opts);
        this._stageId = opts.stageId;
    }

    public get createTime(): number
    {
        return this.createTime || 0;
    }

    public get stageId(): number
    {
        return this._stageId;
    }
}
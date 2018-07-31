import { MySelf } from "./MySelf";

/**
 * 式神实体数据模型
 * @author Andrew_Huang
 * @export
 * @class Hero
 * @extends {MySelf}
 */
export class Hero extends MySelf
{
    private _heroId: number;  //式神ID
    private _pos: number;     //出征位

    public constructor(opts: any)
    {
        super(opts);
        this._heroId = opts.heroId;
        this._pos = opts.pos || 0;
    }

    public get heroId(): number
    {
        return this._heroId;
    }

    public get pos(): number
    {
        return this._pos;
    }
}
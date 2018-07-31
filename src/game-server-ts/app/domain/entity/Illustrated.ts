import { MySelf } from "./MySelf";

/**
 * 玩家式神图鉴
 * @author Andrew_Huang
 * @export
 * @class Illustrated
 * @extends {MySelf}
 */
export class Illustrated extends MySelf
{
    private _heroId: number;  //式神编号

    public constructor(opts: any)
    {
        super(opts);
        this._heroId = opts.heroId;
    }

    public get heroId(): number
    {
        return this._heroId;
    }
}
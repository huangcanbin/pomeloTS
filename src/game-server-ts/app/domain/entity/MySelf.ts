import { Entity } from "./Entity";

/**
 * 实体基类
 * @author Andrew_Huang
 * @export
 * @class MySelf
 * @extends {Entity}
 */
export class MySelf extends Entity
{
    protected _playerId: string;
    public constructor(opts: any)
    {
        super(opts);
        this._playerId = opts.playerId;
    }

    public set playerId(value: string)
    {
        this.playerId = value;
    }
}
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
    protected playerId: string;
    public constructor(opts: any)
    {
        super(opts);
        this.playerId = opts.playerId;
    }
}
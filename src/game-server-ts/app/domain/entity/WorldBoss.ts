import { MySelf } from "./MySelf";

/**
 * 世界BOSS实体数据模型
 * @author Andrew_Huang
 * @export
 * @class WorldBoss
 * @extends {MySelf}
 */
export class WorldBoss extends MySelf
{
    private _name: string;        //玩家名字
    private _bossid: number;      //bossid
    private _hp: number;          //伤害量
    private _updatetime: number;  //记录更新时间
    private _times: number;       //挑战次数

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._name = opts.name;
        this._bossid = opts.bossid;
        this._hp = opts.hp || 0;
        this._updatetime = opts.updatetime || Date.now();
        this._times = opts.times || 1;
    }

    public get name(): string
    {
        return this._name;
    }

    public get bossid(): number
    {
        return this._bossid;
    }

    public get hp(): number
    {
        return this._hp;
    }

    public get updatetime(): number
    {
        return this._updatetime;
    }

    public get times(): number
    {
        return this._times;
    }
}
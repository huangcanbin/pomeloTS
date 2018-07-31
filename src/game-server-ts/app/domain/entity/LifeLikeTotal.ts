import { MySelf } from "./MySelf";

/**
 * 命格培养：培养总属性值实体数据模型
 * @author Andrew_Huang
 * @export
 * @class LifeLikeTotal
 * @extends {MySelf}
 */
export class LifeLikeTotal extends MySelf
{
    private _hp: number;     //伤害属性值
    private _attack: number; //攻击属性值
    private _hit: number;    //命中属性值
    private _dodge: number;  //闪避属性值
    private _speed: number;  //先攻属性值

    public constructor(opts: any)
    {
        super(opts);
        this._hp = opts.hp || 0;
        this._attack = opts.attack || 0;
        this._hit = opts.hit || 0;
        this._dodge = opts.dodge || 0;
        this._speed = opts.speed || 0;
    }

    public get hp(): number
    {
        return this._hp;
    }

    public get attack(): number
    {
        return this._attack;
    }

    public get hit(): number
    {
        return this._hit;
    }

    public get dodge(): number
    {
        return this._dodge;
    }

    public get speed(): number
    {
        return this._speed;
    }
}
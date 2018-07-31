import { MySelf } from "./MySelf";

/**
 * 式神阵位实体数据模型
 * @author Andrew_Huang
 * @export
 * @class Lineup
 * @extends {MySelf}
 */
export class Lineup extends MySelf
{
    private _pos: number;     //阵位编号
    private _lv: number;      //等级
    private _starLv: number;  //星级
    private _propLv: number;  //宝具等级
    private _skillLv: number; //技能(进化)等级

    public constructor(opts: any)
    {
        super(opts);
        this._pos = opts.pos || 0;
        this._lv = opts.lv || 1;
        this._starLv = opts.starLv || 0;
        this._propLv = opts.propLv || 0;
        this._skillLv = opts.skillLv || 0;
    }

    public get pos(): number
    {
        return this._pos;
    }

    public get lv(): number
    {
        return this._lv;
    }

    public get starLv(): number
    {
        return this._starLv;
    }

    public get propLv(): number
    {
        return this._propLv;
    }

    public get skillLv(): number
    {
        return this._skillLv;
    }
}
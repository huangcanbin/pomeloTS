import { MySelf } from "./MySelf";

/**
 * 玩家离线收益记录实体数据模型
 * @author Andrew_Huang
 * @export
 * @class OffEarRec
 * @extends {MySelf}
 */
export class OffEarRec extends MySelf
{
    private _exp: number;     //经验
    private _gold: number;    //金币
    private _items: any;      //物品列表 [{id: 40000, num: 1}]  
    private _isTimes: boolean;//收益已翻倍

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._exp = opts.exp || 0;
        this._gold = opts.gold || 0;
        this._items = opts.items || 0;
        this._isTimes = opts.isTimes || true;
    }

    public get exp(): number
    {
        return this._exp;
    }

    public get gold(): number
    {
        return this._gold;
    }

    public get items(): any
    {
        return this._items;
    }

    public get isTimes(): boolean
    {
        return this._isTimes;
    }
}
import { MySelf } from "./MySelf";

/**
 * 背包数据模型
 * @author Andrew_Huang
 * @export
 * @class Bag
 * @extends {MySelf}
 */
export class Bag extends MySelf
{
    private _itemId: number;  //道具编号
    private _num: number;     //道具数量
    private _type: number;    //0:道具 1:材料
    private _isFull: boolean; //物品已堆叠满

    public constructor(opts: any)
    {
        super(opts);
        this._itemId = opts.itemId;
        this._num = opts.num;
        this._isFull = opts.isFull || false;
        this._type = opts.type;
    }

    public get itemId(): number
    {
        return this._itemId;
    }

    public get num(): number
    {
        return this._num;
    }

    public get type(): number
    {
        return this._type;
    }

    public get isFull(): boolean
    {
        return this._isFull;
    }
}
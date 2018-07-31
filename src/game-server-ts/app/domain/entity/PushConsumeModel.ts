import consts = require('../../util/consts');
import { MySelf } from './MySelf';

/**
 * 推送到sd消费接口的实体数据
 * @author Andrew_Huang
 * @export
 * @class PushConsumeModel
 * @extends {MySelf}
 */
export class PushConsumeModel extends MySelf
{
    private _ServerID: number;       //服务器区号
    private _Type: number;           //消费类型(商店购买物品)
    private _AccountID: number;      //玩家全区唯一编号
    private _UserID: number;         //玩家全区唯一编号
    private _Number: number;         //消费点数 正数:玩家消费 负数:玩家获得奖励
    private _ItemType: number;       //道具ID, 功能消费可以填type
    private _Price: number;          //道具单价
    private _ItemCnt: number;        //道具数量
    private _MoneyType: number;      //货币类型(代币)

    public constructor(opts?: any)
    {
        if (!opts)
        {
            opts = {};
        }
        super(opts);
        this._ServerID = opts.serverID || 0;
        this._Type = opts.type || consts.default.consts.Enums.consumeType.buyItem;
        this._AccountID = opts.accountID || 0;
        this._UserID = opts.accountID || 0;
        this._Number = opts.number || 0;
        this._ItemType = opts.itemType || 0;
        this._Price = opts.price || 0;
        this._ItemCnt = opts.itemCnt || 1;
        this._MoneyType = opts.moneyType || consts.default.consts.Enums.consumeMoneyType.money;
    }

    public get ServerID(): number
    {
        return this._ServerID;
    }

    public get Type(): number
    {
        return this._Type;
    }

    public get AccountID(): number
    {
        return this._AccountID;
    }

    public get UserID(): number
    {
        return this._UserID;
    }

    public get Number(): number
    {
        return this._Number;
    }

    public get ItemType(): number
    {
        return this._ItemType;
    }

    public get Price(): number
    {
        return this._Price;
    }

    public get ItemCnt(): number
    {
        return this._ItemCnt;
    }

    public get MoneyType(): number
    {
        return this._MoneyType;
    }
}
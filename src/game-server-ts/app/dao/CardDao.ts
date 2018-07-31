import { BaseDao } from "./BaseDao";
import consts = require('../util/consts');
import card = require('../domain/entity/Card');
import mongoClient = require('mongodb');
/** 
 * 特权卡
 * @author Andrew_Huang
 * @export
 * @class CardDao
 * @extends {BaseDao}
 */
export class CardDao extends BaseDao
{
    public static instance: CardDao;
    public static getInstance(): CardDao
    {
        if (!this.instance)
        {
            this.instance = new CardDao();
        }
        return this.instance
    }

    public constructor()
    {
        super();
    }

    /**
     * 创建特权卡
     * @author Andrew_Huang
     * @param {*} card
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof CardDao
     */
    public create(card: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        client.connect("Card", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            card.playerId = playerId;
            let entity = new card.Card(card);
            col.insertOne(entity, (err: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err);
                    return;
                }
                close();
                callback.call(context, null);
            });
        });
    }

    /**
     * 修改特权卡
     * @author Andrew_Huang
     * @param {*} setter
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof CardDao
     */
    public setCard(setter: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Card", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            col.updateOne({ playerId: playerId }, setter, (err: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err);
                    return;
                }
                close();
                callback.call(context, null);
            });
        });
    }

    /**
     * 获取玩家特权卡信息
     * @author Andrew_Huang
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof CardDao
     */
    public get(playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Card", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId };
            col.findOne(entity, (err: any, res: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let entity = new card.Card(res);
                callback.call(context, null, entity);
            });
        });
    }
}
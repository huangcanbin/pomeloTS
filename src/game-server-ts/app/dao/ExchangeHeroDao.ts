import { BaseDao } from "./BaseDao";
import consts = require('../util/consts');
import mongoClient = require('mongodb');

/**
 * 式神兑换
 * @author Andrew_Huang
 * @export
 * @class ExchangeHeroDao
 * @extends {BaseDao}
 */
export class ExchangeHeroDao extends BaseDao
{
    public static instance: ExchangeHeroDao;
    public static getInstance(): ExchangeHeroDao
    {
        if (!this.instance)
        {
            this.instance = new ExchangeHeroDao();
        }
        return this.instance
    }

    public constructor()
    {
        super();
    }

    /**
     * 创建
     * @author Andrew_Huang
     * @param {*} exchangeHero
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @returns {void}
     * @memberof ExchangeHeroDao
     */
    public create(exchangeHero: any, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        client.connect("ExchangeHero", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            col.insertOne(exchangeHero, (err: any) =>
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
     * 根据玩家Id获取式神兑换数据
     * @author Andrew_Huang
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof ExchangeHeroDao
     */
    public getByPlayer(playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        client.connect("ExchangeHero", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            let filter = { playerId: playerId };
            col.findOne(filter, function (err, res)
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                callback.call(context, null, res);
            });
        });
    }

    /**
     * 更新
     * @author Andrew_Huang
     * @param {*} setter
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @returns {void}
     * @memberof ExchangeHeroDao
     */
    public set(setter: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        client.connect("ExchangeHero", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            col.findOneAndUpdate({ playerId: playerId }, setter, { upsert: true, returnOriginal: false }, (err: any, res: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                callback.call(context, null, res);
            });
        });
    }
}
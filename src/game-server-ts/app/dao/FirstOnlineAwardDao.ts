import dbDriver = require('../drive/DbDriver');
import consts = require('../util/consts');
import FirstOnlineAward = require('../domain/entity/FirstOnlineAward');
import mongoClient = require('mongodb');

/**
 * 玩家关卡奖励领取记录
 * @author Andrew_Huang
 * @export
 * @class FirstOnlineAwardDao
 */
export class FirstOnlineAwardDao
{
    public static instance: FirstOnlineAwardDao;
    public static getInstance(): FirstOnlineAwardDao
    {
        if (!this.instance)
        {
            this.instance = new FirstOnlineAwardDao();
        }
        return this.instance
    }

    private _dbDriver: dbDriver.DbDriver;

    public constructor()
    {
        this._dbDriver = dbDriver.DbDriver.getInstance();
    }

    /**
     * 创建记录
     * @author Andrew_Huang
     * @param {*} firstOnlineAward
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof FirstOnlineAwardDao
     */
    public create(firstOnlineAward: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            firstOnlineAward.playerId = playerId;
            let entity = new FirstOnlineAward.FirstOnlineAward(firstOnlineAward);
            col.insertOne(entity, (err: any, res: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                callback.call(context, null);
                console.log(res);
            });
        }, this);
    }

    /**
     * 根据玩家id获取领取记录
     * @author Andrew_Huang
     * @param {string} playerId
     * @param {number} type
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof FirstOnlineAwardDao
     */
    public getByPlayerId(playerId: string, type: number, areaId: number, callback: Function, context: Object): void
    {
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId, type: type };
            col.find(entity).toArray((err: any, res: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let result = res.select((t: any) => new FirstOnlineAward.FirstOnlineAward(t));
                callback.call(context, null, result);
            });
        }, this);
    }

    /**
     * 根据玩家id更新领奖记录
     * @author Andrew_Huang
     * @param {number} status
     * @param {number} type
     * @param {number} id
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof FirstOnlineAwardDao
     */
    public upStatusByPlayerId(status: number, type: number, id: number, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            let updateStr = {
                $set: {
                    status: status,
                }
            };
            col.updateOne({ playerId: playerId, typeid: id, type: type }, updateStr, (err: any, res: any) =>
            {
                close();
                if (!!err)
                {
                    callback.call(context, err);
                    return;
                }
                callback.call(context, null);
                console.log(res);
            });
        }, this);
    }
}
import consts = require('../util/consts');
import mongoClient = require('mongodb');
import { BaseDao } from './BaseDao';
import BossCombat = require('../domain/entity/BossCombat');

/**
 * BOSS挑战
 * @author Andrew_Huang
 * @export
 * @class BossCombatDao
 * @extends {BaseDao}
 */
export class BossCombatDao extends BaseDao
{
    public static instance: BossCombatDao;
    public static getInstance(): BossCombatDao
    {
        if (!this.instance)
        {
            this.instance = new BossCombatDao();
        }
        return this.instance
    }

    public constructor()
    {
        super();
    }

    /**
     * 创建记录
     * @author Andrew_Huang
     * @param {*} bossCombatDao
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BossCombatDao
     */
    public create(bossCombatDao: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            bossCombatDao.playerId = playerId;
            let entity = new BossCombat.BossCombat(bossCombatDao);
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
        });
    }

    /**
     * 根据玩家id获取玩家挑战记录
     * @author Andrew_Huang
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BossCombatDao
     */
    public getByPlayerId(playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId };
            col.find(entity).toArray(function (err, res)
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let bossCombatRecords: any = [];
                if (!!res && res.length > 0)
                {
                    for (let i: number = 0; i < res.length; i++)
                    {
                        let r: any = res[i];
                        bossCombatRecords.push({
                            stageId: r.stageId,
                            createTime: r.createTime,
                        });
                    }
                }
                callback.call(context, null, bossCombatRecords);
            });
        });
    }

    /**
     * 根据玩家ID和关卡ID获取挑战数据
     * @author Andrew_Huang
     * @param {string} playerId
     * @param {number} stageId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BossCombatDao
     */
    public getByPlayerIdAndStageID(playerId: string, stageId: number, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId, stageId: stageId };
            col.findOne(entity, (err, res) =>
            {
                close();
                if (!!err)
                {
                    callback.call(context, err, null);
                    return;
                }
                let entity;
                if (!!res)
                {
                    entity = new BossCombat.BossCombat(res);
                    //entity.createTime = res.createTime;
                }
                else
                {
                    entity = null
                }
                callback.call(context, null, entity);
            });
        });
    }

    public set(playerId: string, stageId: number, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            let setter = {
                $set: {
                    createTime: Date.now()
                }
            };
            col.updateOne({ playerId: playerId, stageId: stageId }, setter, (err: any, res: any) =>
            {
                close();
                if (!!err)
                {
                    callback.call(context, err, null);
                    return;
                }
                callback.call(context, null);
                console.log(res);
            });
        });
    }

    /**
     * 根据关卡id,获取玩家对应关卡boss挑战记录
     * @author Andrew_Huang
     * @param {*} bossCombatRecords
     * @param {number} stageId
     * @returns {*}
     * @memberof BossCombatDao
     */
    public getBossCombatRecord(bossCombatRecords: any, stageId: number): any
    {
        let bossCombatRecord;
        bossCombatRecords.forEach((el: any) =>
        {
            if (el.stageId === stageId)
            {
                bossCombatRecord = el;
                return;
            }
        });
        return bossCombatRecord;
    }
}
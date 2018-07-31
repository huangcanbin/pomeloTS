import consts = require('../util/consts');
import Illustrated = require('../domain/entity/Illustrated');
import { BaseDao } from './BaseDao';
import mongoClient = require('mongodb');

/**
 * 式神图鉴
 * @author Andrew_Huang
 * @export
 * @class IllustratedDao
 * @extends {BaseDao}
 */
export class IllustratedDao extends BaseDao
{
    public static instance: IllustratedDao;
    public static getInstance(): IllustratedDao
    {
        if (!this.instance)
        {
            this.instance = new IllustratedDao();
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
     * @param {*} hero
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @returns {void}
     * @memberof IllustratedDao
     */
    public create(hero: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        if (hero.heroId >= consts.default.consts.Enums.HeroType.Main)
        {
            callback.call(context, null);
            return;
        }
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Illustrated", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            col.findOne({ playerId: playerId, heroId: hero.heroId }, (err: any, fres: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                if (!!fres)
                {
                    close();
                    callback.call(context, null);
                    return;
                }
                hero.playerId = playerId;
                let entity = new Illustrated.Illustrated(hero);
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
                    console.log(res)
                });
            });
        });
    }

    /**
     * 创建多条数据对象
     * @author Andrew_Huang
     * @param {*} heros
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @returns {void}
     * @memberof IllustratedDao
     */
    public createMany(heros: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Illustrated", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err);
                return;
            }
            let entitys = heros.select((t: any) =>
            {
                t.playerId = playerId;
                return new Illustrated.Illustrated(t);
            });
            col.find({ playerId: playerId }).toArray((err: any, fres: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err);
                    return;
                }
                //获取玩家未拥有的图鉴
                let idsSet = new Set(fres.select((t: any) => { return t.heroId; }));
                entitys = entitys.where((t: any) =>
                {
                    let has = idsSet.has(t.heroId);
                    if (!has)
                    {
                        idsSet.add(t.heroId);
                    }
                    return !has;
                });
                if (!entitys || entitys.length == 0)
                {
                    close();
                    callback.call(context, null);
                    return;
                }
                col.insertMany(entitys, (err: any, res: any) =>
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
        });
    }

    /**
     * 根据玩家ID获取记录
     * @author Andrew_Huang
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @returns {void}
     * @memberof IllustratedDao
     */
    public getByPlayer(playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Illustrated", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId };
            col.find(entity).toArray((err: any, res: any) =>
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
import CommandMode = require("nbframe-storage");
import storage = require('../drive/CacheStorage');

/**
 * 排位赛redis Cache
 * @author Andrew_Huang
 * @export
 * @class RankedGameCache
 */
export default class RankedGameCache
{
    private _commandMode: any;
    private _syntax: string;
    private _storage: any;

    public static instance: RankedGameCache;
    public static getInstance(): RankedGameCache
    {
        if (!this.instance)
        {
            this.instance = new RankedGameCache();
        }
        return this.instance;
    }

    public constructor()
    {
        this._syntax = 'bgyx';
        this._commandMode = CommandMode.CommandMode;
        this._storage = storage.CacheStorage.getInstance();
    }

    /**
     * 获取玩家排名信息
     * @author Andrew_Huang
     * @param {string} key
     * @param {string} val
     * @param {Function} callback
     * @param {Object} context
     * @returns {*}
     * @memberof RankedGameCache
     */
    public getRank(key: string, val: string, callback: Function, context: Object): void
    {
        let commandOptions = {
            mode: this._commandMode.SortSet,
            filter: { id: val }
        }
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res: any) =>
        {
            callback.call(context, null, res);
        }
        ).catch((err: any) =>
        {
            callback.call(context, err, null);
        });
    }

    /**
     * 获取玩家分数信息
     * @author Andrew_Huang
     * @param {string} key
     * @param {string} val
     * @param {Function} callback
     * @param {Object} context
     * @returns {*}
     * @memberof RankedGameCache
     */
    public getScore(key: string, val: string, callback: Function, context: Object): void
    {
        let commandOptions = {
            mode: this._commandMode.SortSet,
            filter: { id: val, where: { withscores: true } }
        }
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res: any) =>
        {
            callback.call(context, null, res);
        }
        ).catch((err: any) =>
        {
            callback.call(context, err, null);
        });
    }

    /**
     * 根据玩家排名获取玩家id
     * @author Andrew_Huang
     * @param {string} key
     * @param {string} rankList
     * @param {Function} callback
     * @param {Object} context
     * @returns {*}
     * @memberof RankedGameCache
     */
    public getRankingIds(key: string, rankList: string, callback: Function, context: Object): void
    {
        let commandOptions = {
            mode: this._commandMode.SortSet,
            filter: { where: { withscores: true, min: rankList[0], max: rankList[2] }, offset: 0, limit: 2000 }
        }
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res: any) =>
        {
            callback.call(context, null, res);
        }
        ).catch((err: any) =>
        {
            callback.call(context, err, null);
        });
    }

    /**
     * 获取玩家redis信息
     * @author Andrew_Huang
     * @param {string} key
     * @param {Function} callback
     * @param {Object} context
     * @memberof RankedGameCache
     */
    public getPlayerByIds(key: string, callback: Function, context: Object): void
    {
        let commandOptions = {
            mode: this._commandMode.String,
        }
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res: any) =>
        {
            callback.call(context, null, res);
        }
        ).catch((err: any) =>
        {
            callback.call(context, err, null);
        });
    }

    /**
     * 设置玩家redis中排行
     * @author Andrew_Huang
     * @param {string} key
     * @param {string} val
     * @param {number} score
     * @param {Function} callback
     * @param {Object} context
     * @memberof RankedGameCache
     */
    public setRank(key: string, val: string, score: number, callback: Function, context: Object): void
    {
        let commandOptions = {
            upsert: [val],
            score: [score],
            mode: this._commandMode.SortSet,
        }
        let database = this._storage.storage.connect(this._syntax);
        database.setOrAdd(key, commandOptions).then((res: any) =>
        {
            callback.call(context, null, res);
        }
        ).catch((err: any) =>
        {
            callback.call(context, err, null);
        });
    }

    /**
     * 更新玩家redis中排位赛信息
     * @author Andrew_Huang
     * @param {string} key
     * @param {string} val
     * @param {*} expireSec
     * @param {Function} callback
     * @param {Object} context
     * @memberof RankedGameCache
     */
    public update(key: string, val: string, expireSec: any, callback: Function, context: Object): void
    {
        let commandOptions = {
            upsert: val,
            expired: expireSec,
            mode: this._commandMode.String,
        }
        let database = this._storage.storage.connect(this._syntax);
        database.setOrAdd(key, commandOptions).then((res: any) =>
        {
            callback.call(context, null, res);
        }
        ).catch((err: any) =>
        {
            callback.call(context, err, null);
        });
    }

    public getAll(key: string, callback: Function, context: Object): void
    {
        let commandOptions = {
            mode: this._commandMode.SortSet,
            filter: { where: { withscores: true, min: 0, max: 9000000000000 }, offset: 0, limit: 100000 } //max要覆盖所有时间戳
        }
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res: any) =>
        {
            callback.call(context, null, res);
        }
        ).catch((err: any) =>
        {
            callback.call(context, err, null);
        });
    }
}
import NbframeStorage, { Database, ConnectCallback } from "nbframe-storage";
import logger = require('pomelo-logger');
import system = require('system');
import redis = require("redis");
import accountConfig = require('../../../shared/config/account-reids.json');

/**
 * 定义一个静态的Storage实例，提供给当前项目全局使用
 * @author Andrew_Huang
 * @export
 * @class CacheStorage
 */
export class CacheStorage
{
    private _logger: logger.ILogger;
    private _storage: NbframeStorage;
    private _db: Database;

    public static instance: CacheStorage;
    public static getInstance(): CacheStorage
    {
        if (!this.instance)
        {
            this.instance = new CacheStorage();
        }
        return this.instance;
    }

    public constructor()
    {
        this._logger = logger.getLogger(system.__filename);
        let syntax = 'bgyx';
        this._storage = new NbframeStorage();
        this._storage.driveModule.redis = redis;
        var env = process.env.NODE_ENV || "production";
        var accountSetting = (<any>accountConfig)[env] || [];
        this._storage.connectError = <ConnectCallback>this.connectError;
        this._db = this._storage.configure(syntax, accountSetting);
        this._db.checkConnect();
    }

    public get storage(): NbframeStorage
    {
        return this._storage;
    }

    private connectError(err: any): void
    {
        this._logger.error('redis connect to accountdb fail:%j.', err);
    }
}
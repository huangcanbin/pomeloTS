import logger from '../util/logger';
import NbframeStorage, { Database, ConnectCallback } from "nbframe-storage";
import mongodb = require('mongodb');
import redis = require("redis");
import mysql = require('mysql');
import dbConfig from "./config";

/**
 * 定义一个静态的Storage实例，提供给当前项目全局使用
 * @author Andrew_Huang
 * @export
 * @class DbStorage
 */
export class DbStorage
{
    public static instance: DbStorage;
    public static getInstance(): DbStorage
    {
        if (!this.instance)
        {
            this.instance = new DbStorage();
        }
        return this.instance;
    }

    private _storage: NbframeStorage;
    private _mysqlDb: Database;
    private _redisDb: Database;

    public constructor()
    {
        this._storage = new NbframeStorage();
        this._storage.driveModule.mysql = mysql;
        this._storage.driveModule.mongodb = mongodb;
        this._storage.driveModule.redis = redis;
        this._storage.connectError = <ConnectCallback>this.connectError;
        this._mysqlDb = this._storage.configure("bgx-config", dbConfig.config);
        this._mysqlDb.checkConnect();
        this._redisDb = this._storage.configure("bgx-cache", dbConfig.cache);
        this._redisDb.checkConnect();
    }

    private connectError(err: any): void
    {
        logger.error('redis connect to accountdb fail:%j.', err);
    }

    public connectCache(): Database
    {
        return this._storage.connect("bgx-cache");
    }

    public connectConfig(): Database
    {
        return this._storage.connect("bgx-config");
    }
}
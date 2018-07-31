Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../util/logger");
const nbframe_storage_1 = require("nbframe-storage");
const mongodb = require("mongodb");
const redis = require("redis");
const mysql = require("mysql");
const config_1 = require("./config");
class DbStorage {
    static getInstance() {
        if (!this.instance) {
            this.instance = new DbStorage();
        }
        return this.instance;
    }
    constructor() {
        this._storage = new nbframe_storage_1.default();
        this._storage.driveModule.mysql = mysql;
        this._storage.driveModule.mongodb = mongodb;
        this._storage.driveModule.redis = redis;
        this._storage.connectError = this.connectError;
        this._mysqlDb = this._storage.configure("bgx-config", config_1.default.config);
        this._mysqlDb.checkConnect();
        this._redisDb = this._storage.configure("bgx-cache", config_1.default.cache);
        this._redisDb.checkConnect();
    }
    connectError(err) {
        logger_1.default.error('redis connect to accountdb fail:%j.', err);
    }
    connectCache() {
        return this._storage.connect("bgx-cache");
    }
    connectConfig() {
        return this._storage.connect("bgx-config");
    }
}
exports.DbStorage = DbStorage;

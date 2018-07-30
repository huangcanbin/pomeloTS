Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = require("../util/Logger");
const nbframe_storage_1 = require("nbframe-storage");
const mongodb = require("mongodb");
const redis = require("redis");
const mysql = require("mysql");
const _1 = require("./config/");
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
        this._mysqlDb = this._storage.configure("bgx-config", _1.default.config);
        this._mysqlDb.checkConnect();
        this._redisDb = this._storage.configure("bgx-cache", _1.default.cache);
        this._redisDb.checkConnect();
    }
    connectError(err) {
        Logger_1.default.error('redis connect to accountdb fail:%j.', err);
    }
    connectCache() {
        return this._storage.connect("bgx-cache");
    }
    connectConfig() {
        return this._storage.connect("bgx-config");
    }
}
exports.DbStorage = DbStorage;

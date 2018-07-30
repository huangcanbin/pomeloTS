Object.defineProperty(exports, "__esModule", { value: true });
const nbframe_storage_1 = require("nbframe-storage");
const logger = require("pomelo-logger");
const system = require("system");
const redis = require("redis");
let accountConfig = require("../../../shared/config/account-reids");
class CacheStorage {
    static getInstance() {
        if (!this.instance) {
            this.instance = new CacheStorage();
        }
        return this.instance;
    }
    constructor() {
        this._logger = logger.getLogger(system.__filename);
        let syntax = 'bgyx';
        this._storage = new nbframe_storage_1.default();
        this._storage.driveModule.redis = redis;
        var env = process.env.NODE_ENV || "production";
        var accountSetting = accountConfig[env] || [];
        this._storage.connectError = this.connectError;
        this._db = this._storage.configure(syntax, accountSetting);
        this._db.checkConnect();
    }
    get storage() {
        return this._storage;
    }
    connectError(err) {
        this._logger.error('redis connect to accountdb fail:%j.', err);
    }
}
exports.CacheStorage = CacheStorage;

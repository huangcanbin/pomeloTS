Object.defineProperty(exports, "__esModule", { value: true });
const CommandMode = require("nbframe-storage");
const storage = require("../drive/CacheStorage");
class RankedGameCache {
    static getInstance() {
        if (!this.instance) {
            this.instance = new RankedGameCache();
        }
        return this.instance;
    }
    constructor() {
        this._syntax = 'bgyx';
        this._commandMode = CommandMode.CommandMode;
        this._storage = storage.CacheStorage.getInstance();
    }
    getRank(key, val, callback, context) {
        let commandOptions = {
            mode: this._commandMode.SortSet,
            filter: { id: val }
        };
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res) => {
            callback.call(context, null, res);
        }).catch((err) => {
            callback.call(context, err, null);
        });
    }
    getScore(key, val, callback, context) {
        let commandOptions = {
            mode: this._commandMode.SortSet,
            filter: { id: val, where: { withscores: true } }
        };
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res) => {
            callback.call(context, null, res);
        }).catch((err) => {
            callback.call(context, err, null);
        });
    }
    getRankingIds(key, rankList, callback, context) {
        let commandOptions = {
            mode: this._commandMode.SortSet,
            filter: { where: { withscores: true, min: rankList[0], max: rankList[2] }, offset: 0, limit: 2000 }
        };
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res) => {
            callback.call(context, null, res);
        }).catch((err) => {
            callback.call(context, err, null);
        });
    }
    getPlayerByIds(key, callback, context) {
        let commandOptions = {
            mode: this._commandMode.String,
        };
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res) => {
            callback.call(context, null, res);
        }).catch((err) => {
            callback.call(context, err, null);
        });
    }
    setRank(key, val, score, callback, context) {
        let commandOptions = {
            upsert: [val],
            score: [score],
            mode: this._commandMode.SortSet,
        };
        let database = this._storage.storage.connect(this._syntax);
        database.setOrAdd(key, commandOptions).then((res) => {
            callback.call(context, null, res);
        }).catch((err) => {
            callback.call(context, err, null);
        });
    }
    update(key, val, expireSec, callback, context) {
        let commandOptions = {
            upsert: val,
            expired: expireSec,
            mode: this._commandMode.String,
        };
        let database = this._storage.storage.connect(this._syntax);
        database.setOrAdd(key, commandOptions).then((res) => {
            callback.call(context, null, res);
        }).catch((err) => {
            callback.call(context, err, null);
        });
    }
    getAll(key, callback, context) {
        let commandOptions = {
            mode: this._commandMode.SortSet,
            filter: { where: { withscores: true, min: 0, max: 9000000000000 }, offset: 0, limit: 100000 }
        };
        let database = this._storage.storage.connect(this._syntax);
        database.query(key, commandOptions).then((res) => {
            callback.call(context, null, res);
        }).catch((err) => {
            callback.call(context, err, null);
        });
    }
}
exports.default = RankedGameCache;

Object.defineProperty(exports, "__esModule", { value: true });
const pomelo = require("pomelo");
const system = require("system");
const logger = require("pomelo-logger");
const consts = require("../util/consts");
class DbLoader {
    static getInstance() {
        if (!this.instance) {
            this.instance = new DbLoader();
        }
        return this.instance;
    }
    constructor() {
        this._logger = logger.getLogger(system.__filename);
    }
    load(table, callback, context) {
        let sql = 'select * from ' + table;
        let args = [];
        pomelo.app.get(consts.default.consts.DB.Shared.name).query(sql, args, (err, res) => {
            if (err !== null) {
                this._logger.error('loader table:"' + table + '" failed! ' + err.stack);
                callback.call(context, err.message, []);
                return;
            }
            if (!!res && res.length > 0) {
                this._logger.info('loader table:"' + table + '"' + res.length + ' rows.');
                callback.call(context, null, res);
            }
            else {
                callback.call(context, null, []);
            }
        });
    }
    getConfig(table, callback, context) {
        let sql = 'select name,data,status,version from ' + table;
        let args = [];
        pomelo.app.get(consts.default.consts.DB.Shared.name).query(sql, args, (err, res) => {
            if (err !== null) {
                this._logger.error('loader table:"' + table + '" failed! ' + err.stack);
                callback.call(context, err.message, []);
                return;
            }
            if (!!res && res.length > 0) {
                this._logger.info('loader table:"' + table + '"' + res.length + ' rows.');
                callback.call(context, null, res);
            }
            else {
                callback.call(context, null, []);
            }
        });
    }
}
exports.default = DbLoader;

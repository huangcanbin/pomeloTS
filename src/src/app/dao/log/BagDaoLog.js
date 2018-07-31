Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("../../util/consts");
const system = require("system");
const logger = require("pomelo-logger");
const utils = require("../../util/utils");
const dbDriver = require("../../drive/DbDriver");
class BagDaoLog {
    static getInstance() {
        if (!this.instance) {
            this.instance = new BagDaoLog();
        }
        return this.instance;
    }
    constructor() {
        this._logger = logger.getLogger(system.__filename);
        this._utils = utils.Utils.getInstance();
        this._dbDriver = dbDriver.DbDriver.getInstance();
    }
    write(items, from, playerId, areaId, callback, context) {
        if (items.length === 0) {
            callback.call(context);
            return;
        }
        let now = Date.now();
        let date = this._utils.toDateFormat(now);
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Log.name);
        if (!client || !client.insert) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        let sql = 'insert into log_player_bag(playerId, itemId, num, `from`, create_date, create_time) values';
        let args = [];
        let values = '';
        items.forEach((item) => {
            values += values === '' ? '(?,?,?,?,?,?)' : ',(?,?,?,?,?,?)';
            args.push(playerId, (item.id || 0), (item.num || 0), from, date, now);
        });
        sql += values;
        client.insert(sql, args, (err) => {
            if (err !== null) {
                this._logger.error('log write error:' + err.stack);
                callback.call(context, err.message);
                return;
            }
            callback.call(context);
        });
    }
}
exports.BagDaoLog = BagDaoLog;

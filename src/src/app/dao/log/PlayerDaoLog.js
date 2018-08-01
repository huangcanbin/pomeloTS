Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("../../util/consts");
const system = require("system");
const logger = require("pomelo-logger");
const utils = require("../../util/Utils");
const dbDriver = require("../../drive/DbDriver");
class PlayerDaoLog {
    static getInstance() {
        if (!this.instance) {
            this.instance = new PlayerDaoLog();
        }
        return this.instance;
    }
    constructor() {
        this._logger = logger.getLogger(system.__filename);
        this._utils = utils.Utils.getInstance();
        this._dbDriver = dbDriver.DbDriver.getInstance();
    }
    write(ops, from, playerId, areaId, callback, context) {
        let now = Date.now();
        let date = this._utils.toDateFormat(now);
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Log.name);
        if (!client || !client.insert) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        let sql = 'insert into log_player(playerId, lv, exp, exp_inc, gold, gold_inc, money, money_inc, energy, energy_inc, bean, bean_inc, `from`, create_date, create_time) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
        let args = [playerId,
            ops.lv || 0,
            ops.exp || 0,
            ops.incExp || 0,
            ops.gold || 0,
            ops.incGold || 0,
            ops.money || 0,
            ops.incMoney || 0,
            ops.energy || 0,
            ops.incEnergy || 0,
            ops.bean || 0,
            ops.incBean || 0,
            from, date, now];
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
exports.PlayerDaoLog = PlayerDaoLog;

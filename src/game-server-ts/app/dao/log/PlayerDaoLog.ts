import consts = require('../../util/consts');
import system = require('system');
import logger = require('pomelo-logger');
import utils = require('../../util/Utils');
import dbDriver = require('../../drive/DbDrive');

export class PlayerDaoLog
{
    public static instance: PlayerDaoLog;
    public static getInstance(): PlayerDaoLog
    {
        if (!this.instance)
        {
            this.instance = new PlayerDaoLog();
        }
        return this.instance;
    }

    private _logger: logger.ILogger;
    private _utils: utils.Utils;
    private _dbDriver: dbDriver.DbDrive;
    public constructor()
    {
        this._logger = logger.getLogger(system.__filename);
        this._utils = utils.Utils.getInstance();
        this._dbDriver = dbDriver.DbDrive.getInstance();
    }

    public write(ops: any, from: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let now = Date.now();
        let date = this._utils.toDateFormat(now);
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Log.name);
        if (!client || !client.insert)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        let sql: string = 'insert into log_player(playerId, lv, exp, exp_inc, gold, gold_inc, money, money_inc, energy, energy_inc, bean, bean_inc, `from`, create_date, create_time) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
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

        client.insert(sql, args, (err: any) =>
        {
            if (err !== null)
            {
                this._logger.error('log write error:' + err.stack);
                callback.call(context, err.message);
                return;
            }
            callback.call(context);
        });
    }
}
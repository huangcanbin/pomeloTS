
import consts = require('../../util/consts');
import system = require('system');
import logger = require('pomelo-logger');
import utils = require('../../util/Utils');
import dbDriver = require('../../drive/DbDriver');

export class BagDaoLog
{
    public static instance: BagDaoLog;
    public static getInstance(): BagDaoLog
    {
        if (!this.instance)
        {
            this.instance = new BagDaoLog();
        }
        return this.instance;
    }

    private _logger: logger.ILogger;
    private _utils: utils.Utils;
    private _dbDriver: dbDriver.DbDriver;
    public constructor()
    {
        this._logger = logger.getLogger(system.__filename);
        this._utils = utils.Utils.getInstance();
        this._dbDriver = dbDriver.DbDriver.getInstance();
    }

    public write(items: any, from: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        if (items.length === 0)
        {
            callback.call(context);
            return;
        }
        let now = Date.now();
        let date = this._utils.toDateFormat(now);
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Log.name);
        if (!client || !client.insert)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        let sql: string = 'insert into log_player_bag(playerId, itemId, num, `from`, create_date, create_time) values';
        let args: any = [];
        let values: string = '';
        items.forEach((item: any) =>
        {
            values += values === '' ? '(?,?,?,?,?,?)' : ',(?,?,?,?,?,?)';
            args.push(playerId, (item.id || 0), (item.num || 0), from, date, now);
        });
        sql += values;

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
import pomelo = require('pomelo');
import system = require('system');
import logger = require('pomelo-logger');
import consts = require('../util/consts');

/**
 * 数据库加载器
 * @author Andrew_Huang
 * @export
 * @class DbLoader
 */
export class DbLoader
{
    public static instance: DbLoader;
    public static getInstance(): DbLoader
    {
        if (!this.instance)
        {
            this.instance = new DbLoader();
        }
        return this.instance;
    }

    private _logger: logger.ILogger;

    public constructor()
    {
        this._logger = logger.getLogger(system.__filename);
    }

    /**
     * 加载数据库数据
     * @author Andrew_Huang
     * @param {string} table
     * @param {Function} callback
     * @param {Object} context
     * @memberof DbLoader
     */
    public load(table: string, callback: Function, context: Object): void
    {
        let sql: string = 'select * from ' + table;
        let args: any = [];
        pomelo.app.get(consts.default.consts.DB.Shared.name).query(sql, args, (err: any, res: any) =>
        {
            if (err !== null)
            {
                this._logger.error('loader table:"' + table + '" failed! ' + err.stack);
                callback.call(context, err.message, []);
                return;
            }

            if (!!res && res.length > 0)
            {
                this._logger.info('loader table:"' + table + '"' + res.length + ' rows.');
                callback.call(context, null, res);
            } else
            {
                callback.call(context, null, []);
            }
        });
    }

    /**
     * 获取配置总表config
     * @author Andrew_Huang
     * @param {string} table
     * @param {Function} callback
     * @param {Object} context
     * @memberof DbLoader
     */
    public getConfig(table: string, callback: Function, context: Object): void
    {
        let sql: string = 'select name,data,status,version from ' + table;
        let args: any = [];
        pomelo.app.get(consts.default.consts.DB.Shared.name).query(sql, args, (err: any, res: any) =>
        {
            if (err !== null)
            {
                this._logger.error('loader table:"' + table + '" failed! ' + err.stack);
                callback.call(context, err.message, []);
                return;
            }

            if (!!res && res.length > 0)
            {
                this._logger.info('loader table:"' + table + '"' + res.length + ' rows.');
                callback.call(context, null, res);
            } else
            {
                callback.call(context, null, []);
            }
        });
    }
}
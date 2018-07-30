import mysqlPool = require('./mysqlPool');
import logger = require('pomelo-logger');
import system = require('system');


export class Mysql
{
    private _logger: logger.ILogger;
    private _pool: any;

    public constructor(con: any)
    {
        this._logger = logger.getLogger(system.__filename);
        if (typeof (con) === "string")
        {
            con = JSON.parse(con);
        }
        this._pool = mysqlPool.MysqlPool.getInstance().createPool(con);
    }

    public shutdown(): void
    {
        this._pool.shutdown();
    }

    public query(sql: string, args: any, callback: Function, context: Object): void
    {
        this._pool.acquire().then((client: any) =>
        {
            client.query(sql, args, (err: any, res: any) =>
            {
                // return object back to pool
                this._pool.release(client);
                this._logger.debug('exe sql:' + sql);
                callback.call(context, err, res);
            });
        }).catch((err: any) =>
        {
            // handle error - this is generally a timeout or maxWaitingClients 
            // error        
            if (!!err)
            {
                this._logger.error('[sqlqueryErr: %s] %s', sql, err.stack);
                return;
            }
        });
    }

    public insert(sql: string, args: any, callback: Function, context: Object): void
    {
        this.query(sql, args, callback, context);
    }

    public update(sql: string, args: any, callback: Function, context: Object): void
    {
        this.query(sql, args, callback, context);
    }

    public delete(sql: string, args: any, callback: Function, context: Object): void
    {
        this.query(sql, args, callback, context);
    }

    public clear(): void
    {
        this._pool.drain().then(() =>
        {
            this._pool.clear();
        });
    }
}
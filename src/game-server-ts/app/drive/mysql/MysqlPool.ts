import pools = require('generic-pool');
import mysql = require('mysql');

/**
 * Mysql对象池
 * @author Andrew_Huang
 * @export
 * @class MysqlPool
 */
export class MysqlPool
{
    public static instance: MysqlPool;
    public static getInstance(): MysqlPool
    {
        if (!this.instance)
        {
            this.instance = new MysqlPool();
        }
        return this.instance;
    }

    public constructor()
    {

    }

    public createPool(con: any): any
    {
        let opts = {
            name: 'mysql',
            max: 10, // maximum size of the pool
            min: 2, // minimum size of the pool,
            idleTimeoutMillis: 30000,
            log: true
        };
        let create = () =>
        {
            let client = mysql.createPool({//mysql.createConnection({
                host: con.host,
                user: con.user,
                port: con.port,
                password: con.password,
                database: con.database,
                //自定义字段类型转换
                typeCast: function (field: any, useDefaultTypeCasting: Function)
                {
                    if ((field.type === "BIT") && (field.length === 1))
                    {
                        var bytes = field.buffer();
                        return (bytes[0] === 1);
                    }
                    return (useDefaultTypeCasting());
                }
            });
            //这里若使用Promise对象，执行查询不会被触发
            //return client;
            return new Promise((resolve: Function) =>
            {
                resolve(client);
            })
        };
        let destroy = (client: any) =>
        {
            return client.end();
        };
        let factory = { create, destroy };
        return pools.createPool(factory, opts);
    }
}
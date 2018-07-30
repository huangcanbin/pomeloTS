import mysqlClient = require('./mysql/Mysql');
import mongodbClient = require('./mongodb/Mongodb');

/**
 * 数据库驱动器
 * @author Andrew_Huang
 * @export
 * @class DbDrive
 */
export class DbDrive
{
    public static instance: DbDrive;
    public static getInstance(): DbDrive
    {
        if (!this.instance)
        {
            this.instance = new DbDrive();
        }
        return this.instance;
    }

    private clientPool: any = {};

    public constructor()
    {

    }

    /**
     * 在app.ts中初始化全局db配置
     * @author Andrew_Huang
     * @param {Function} callback
     * @param {Object} context
     * @memberof DbDrive
     */
    public init(callback: Function, context: Object): void
    {
        let client: any = null;
        callback.call(context, (type: string, con: any, next: Function, cont: Object) =>
        {
            switch (type)
            {
                case 'mysql':
                    client = new mysqlClient.Mysql(con);
                    break;
                case 'mongodb':
                    client = new mongodbClient.Mongodb(con);
                    break;
                default:
                    break;
            }
            if (next && cont)
            {
                next(cont, client);
            }
        });
    }

    public set(areaId: number, name: string, client: any): void
    {
        let key = name + '|' + areaId;
        this.clientPool[key] = client;
    }

    public get(areaId: number, name: string): any
    {
        let key = name + '|' + areaId;
        return this.clientPool[key];
    }
}
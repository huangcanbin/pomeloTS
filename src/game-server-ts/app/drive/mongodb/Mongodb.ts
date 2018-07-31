import mongoClient = require('mongodb');

export class Mongodb
{
    private _config: any;

    public constructor(con: any)
    {
        this._config = {};
        if (typeof (con) === "string")
        {
            con = JSON.parse(con);
        }
        if (con && con.url)
        {
            this._config = { url: con.url, database: con.database, options: (con.options || {}) };
        }
    }

    /**
     * 连接数据库
     * @author Andrew_Huang
     * @param {*} table           表名
     * @param {Function} callback 成功回调
     * @param {Object} context    作用域
     * @memberof Mongodb
     */
    public connect(table: string, callback: Function, context: Object): void
    {
        mongoClient.MongoClient.connect(this._config.url, this._config.options || {}, (err: mongoClient.MongoError, db: mongoClient.MongoClient) =>
        {
            if (!!err)
            {
                callback.call(context, err, null, () => { });
                return;
            }
            let col: mongoClient.Collection = db.db(this._config.database).collection(table)
            callback.call(context, err, col, () =>
            {
                db.close();
            });
        });
    }
}
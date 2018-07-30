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
            this._config = { url: con.url, options: (con.options || {}) };
        }
    }

    public connect(table: any, callback: Function, context: Object): void
    {
        mongoClient.MongoClient.connect(this._config.url, this._config.options || {}, (err: mongoClient.MongoError, db: any) =>
        {
            if (!!err)
            {
                callback.call(context);
                return;
            }
            let col = db.collection(table);
            callback.call(context, col);
            db.close();
        });
    }
}
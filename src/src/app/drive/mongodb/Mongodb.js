Object.defineProperty(exports, "__esModule", { value: true });
const mongoClient = require("mongodb");
class Mongodb {
    constructor(con) {
        this._config = {};
        if (typeof (con) === "string") {
            con = JSON.parse(con);
        }
        if (con && con.url) {
            this._config = { url: con.url, database: con.database, options: (con.options || {}) };
        }
    }
    connect(table, callback, context) {
        mongoClient.MongoClient.connect(this._config.url, this._config.options || {}, (err, db) => {
            if (!!err) {
                callback.call(context, err, null, () => { });
                return;
            }
            let col = db.db(this._config.database).collection(table);
            callback.call(context, err, col, () => {
                db.close();
            });
        });
    }
}
exports.Mongodb = Mongodb;

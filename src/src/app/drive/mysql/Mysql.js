Object.defineProperty(exports, "__esModule", { value: true });
const mysqlPool = require("./mysqlPool");
const logger = require("pomelo-logger");
const system = require("system");
class Mysql {
    constructor(con) {
        this._logger = logger.getLogger(system.__filename);
        if (typeof (con) === "string") {
            con = JSON.parse(con);
        }
        this._pool = mysqlPool.MysqlPool.getInstance().createPool(con);
    }
    shutdown() {
        this._pool.shutdown();
    }
    query(sql, args, callback, context) {
        this._pool.acquire().then((client) => {
            client.query(sql, args, (err, res) => {
                this._pool.release(client);
                this._logger.debug('exe sql:' + sql);
                callback.call(context, err, res);
            });
        }).catch((err) => {
            if (!!err) {
                this._logger.error('[sqlqueryErr: %s] %s', sql, err.stack);
                return;
            }
        });
    }
    insert(sql, args, callback, context) {
        this.query(sql, args, callback, context);
    }
    update(sql, args, callback, context) {
        this.query(sql, args, callback, context);
    }
    delete(sql, args, callback, context) {
        this.query(sql, args, callback, context);
    }
    clear() {
        this._pool.drain().then(() => {
            this._pool.clear();
        });
    }
}
exports.Mysql = Mysql;

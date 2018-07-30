Object.defineProperty(exports, "__esModule", { value: true });
const pools = require("generic-pool");
const mysql = require("mysql");
class MysqlPool {
    static getInstance() {
        if (!this.instance) {
            this.instance = new MysqlPool();
        }
        return this.instance;
    }
    constructor() {
    }
    createPool(con) {
        let opts = {
            name: 'mysql',
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            log: true
        };
        let create = () => {
            let client = mysql.createPool({
                host: con.host,
                user: con.user,
                port: con.port,
                password: con.password,
                database: con.database,
                typeCast: function (field, useDefaultTypeCasting) {
                    if ((field.type === "BIT") && (field.length === 1)) {
                        var bytes = field.buffer();
                        return (bytes[0] === 1);
                    }
                    return (useDefaultTypeCasting());
                }
            });
            return new Promise((resolve) => {
                resolve(client);
            });
        };
        let destroy = (client) => {
            return client.end();
        };
        let factory = { create, destroy };
        return pools.createPool(factory, opts);
    }
}
exports.MysqlPool = MysqlPool;

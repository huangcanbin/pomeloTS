Object.defineProperty(exports, "__esModule", { value: true });
const mysqlClient = require("./mysql/Mysql");
const mongodbClient = require("./mongodb/Mongodb");
class DbDriver {
    constructor() {
        this.clientPool = {};
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new DbDriver();
        }
        return this.instance;
    }
    init(callback, context) {
        let client = null;
        callback.call(context, (type, con, next, cont) => {
            switch (type) {
                case 'mysql':
                    client = new mysqlClient.Mysql(con);
                    break;
                case 'mongodb':
                    client = new mongodbClient.Mongodb(con);
                    break;
                default:
                    break;
            }
            if (next && cont) {
                next(cont, client);
            }
        });
    }
    set(areaId, name, client) {
        let key = name + '|' + areaId;
        this.clientPool[key] = client;
    }
    get(areaId, name) {
        let key = name + '|' + areaId;
        return this.clientPool[key];
    }
}
exports.DbDriver = DbDriver;

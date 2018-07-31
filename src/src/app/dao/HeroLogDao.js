Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("../util/consts");
const BaseDao_1 = require("./BaseDao");
class HeroLogDao extends BaseDao_1.BaseDao {
    static getInstance() {
        if (!this.instance) {
            this.instance = new HeroLogDao();
        }
        return this.instance;
    }
    constructor() {
        super();
    }
    createMany(heros, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("HeroLog", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            col.insertMany(heros, (err) => {
                if (!!err) {
                    close();
                    callback.call(context, err);
                    return;
                }
                close();
                callback.call(context, null);
            });
        });
    }
}
exports.HeroLogDao = HeroLogDao;

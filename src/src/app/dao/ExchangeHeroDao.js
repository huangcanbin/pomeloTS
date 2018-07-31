Object.defineProperty(exports, "__esModule", { value: true });
const BaseDao_1 = require("./BaseDao");
const consts = require("../util/consts");
class ExchangeHeroDao extends BaseDao_1.BaseDao {
    static getInstance() {
        if (!this.instance) {
            this.instance = new ExchangeHeroDao();
        }
        return this.instance;
    }
    constructor() {
        super();
    }
    create(exchangeHero, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("ExchangeHero", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            col.insertOne(exchangeHero, (err) => {
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
    getByPlayer(playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("ExchangeHero", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            let filter = { playerId: playerId };
            col.findOne(filter, function (err, res) {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                callback.call(context, null, res);
            });
        });
    }
    set(setter, playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("ExchangeHero", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            col.findOneAndUpdate({ playerId: playerId }, setter, { upsert: true, returnOriginal: false }, (err, res) => {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                callback.call(context, null, res);
            });
        });
    }
}
exports.ExchangeHeroDao = ExchangeHeroDao;

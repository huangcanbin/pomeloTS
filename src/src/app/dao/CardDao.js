Object.defineProperty(exports, "__esModule", { value: true });
const BaseDao_1 = require("./BaseDao");
const consts = require("../util/consts");
const card = require("../domain/entity/Card");
class CardDao extends BaseDao_1.BaseDao {
    static getInstance() {
        if (!this.instance) {
            this.instance = new CardDao();
        }
        return this.instance;
    }
    constructor() {
        super();
    }
    create(card, playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Card", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            card.playerId = playerId;
            let entity = new card.Card(card);
            col.insertOne(entity, (err) => {
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
    setCard(setter, playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Card", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            col.updateOne({ playerId: playerId }, setter, (err) => {
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
    get(playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Card", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId };
            col.findOne(entity, (err, res) => {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let entity = new card.Card(res);
                callback.call(context, null, entity);
            });
        });
    }
}
exports.CardDao = CardDao;

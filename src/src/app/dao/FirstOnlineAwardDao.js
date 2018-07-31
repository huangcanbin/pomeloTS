Object.defineProperty(exports, "__esModule", { value: true });
const dbDriver = require("../drive/DbDriver");
const consts = require("../util/consts");
const FirstOnlineAward = require("../domain/entity/FirstOnlineAward");
class FirstOnlineAwardDao {
    static getInstance() {
        if (!this.instance) {
            this.instance = new FirstOnlineAwardDao();
        }
        return this.instance;
    }
    constructor() {
        this._dbDriver = dbDriver.DbDriver.getInstance();
    }
    create(firstOnlineAward, playerId, areaId, callback, context) {
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            firstOnlineAward.playerId = playerId;
            let entity = new FirstOnlineAward.FirstOnlineAward(firstOnlineAward);
            col.insertOne(entity, (err, res) => {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                callback.call(context, null);
                console.log(res);
            });
        }, this);
    }
    getByPlayerId(playerId, type, areaId, callback, context) {
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId, type: type };
            col.find(entity).toArray((err, res) => {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let result = res.select((t) => new FirstOnlineAward.FirstOnlineAward(t));
                callback.call(context, null, result);
            });
        }, this);
    }
    upStatusByPlayerId(status, type, id, playerId, areaId, callback, context) {
        let client = this._dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            let updateStr = {
                $set: {
                    status: status,
                }
            };
            col.updateOne({ playerId: playerId, typeid: id, type: type }, updateStr, (err, res) => {
                close();
                if (!!err) {
                    callback.call(context, err);
                    return;
                }
                callback.call(context, null);
                console.log(res);
            });
        }, this);
    }
}
exports.FirstOnlineAwardDao = FirstOnlineAwardDao;

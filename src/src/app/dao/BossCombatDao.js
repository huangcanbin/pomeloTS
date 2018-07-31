Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("../util/consts");
const BaseDao_1 = require("./BaseDao");
const BossCombat = require("../domain/entity/BossCombat");
class BossCombatDao extends BaseDao_1.BaseDao {
    static getInstance() {
        if (!this.instance) {
            this.instance = new BossCombatDao();
        }
        return this.instance;
    }
    constructor() {
        super();
    }
    create(bossCombatDao, playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            bossCombatDao.playerId = playerId;
            let entity = new BossCombat.BossCombat(bossCombatDao);
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
        });
    }
    getByPlayerId(playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId };
            col.find(entity).toArray(function (err, res) {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let bossCombatRecords = [];
                if (!!res && res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        let r = res[i];
                        bossCombatRecords.push({
                            stageId: r.stageId,
                            createTime: r.createTime,
                        });
                    }
                }
                callback.call(context, null, bossCombatRecords);
            });
        });
    }
    getByPlayerIdAndStageID(playerId, stageId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId, stageId: stageId };
            col.findOne(entity, (err, res) => {
                close();
                if (!!err) {
                    callback.call(context, err, null);
                    return;
                }
                let entity;
                if (!!res) {
                    entity = new BossCombat.BossCombat(res);
                }
                else {
                    entity = null;
                }
                callback.call(context, null, entity);
            });
        });
    }
    set(playerId, stageId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            let setter = {
                $set: {
                    createTime: Date.now()
                }
            };
            col.updateOne({ playerId: playerId, stageId: stageId }, setter, (err, res) => {
                close();
                if (!!err) {
                    callback.call(context, err, null);
                    return;
                }
                callback.call(context, null);
                console.log(res);
            });
        });
    }
    getBossCombatRecord(bossCombatRecords, stageId) {
        let bossCombatRecord;
        bossCombatRecords.forEach((el) => {
            if (el.stageId === stageId) {
                bossCombatRecord = el;
                return;
            }
        });
        return bossCombatRecord;
    }
}
exports.BossCombatDao = BossCombatDao;

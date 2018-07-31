Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("../util/consts");
const Illustrated = require("../domain/entity/Illustrated");
const BaseDao_1 = require("./BaseDao");
class IllustratedDao extends BaseDao_1.BaseDao {
    static getInstance() {
        if (!this.instance) {
            this.instance = new IllustratedDao();
        }
        return this.instance;
    }
    constructor() {
        super();
    }
    create(hero, playerId, areaId, callback, context) {
        if (hero.heroId >= consts.default.consts.Enums.HeroType.Main) {
            callback.call(context, null);
            return;
        }
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Illustrated", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            col.findOne({ playerId: playerId, heroId: hero.heroId }, (err, fres) => {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                if (!!fres) {
                    close();
                    callback.call(context, null);
                    return;
                }
                hero.playerId = playerId;
                let entity = new Illustrated.Illustrated(hero);
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
        });
    }
    createMany(heros, playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Illustrated", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err);
                return;
            }
            let entitys = heros.select((t) => {
                t.playerId = playerId;
                return new Illustrated.Illustrated(t);
            });
            col.find({ playerId: playerId }).toArray((err, fres) => {
                if (!!err) {
                    close();
                    callback.call(context, err);
                    return;
                }
                let idsSet = new Set(fres.select((t) => { return t.heroId; }));
                entitys = entitys.where((t) => {
                    let has = idsSet.has(t.heroId);
                    if (!has) {
                        idsSet.add(t.heroId);
                    }
                    return !has;
                });
                if (!entitys || entitys.length == 0) {
                    close();
                    callback.call(context, null);
                    return;
                }
                col.insertMany(entitys, (err, res) => {
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
        });
    }
    getByPlayer(playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Illustrated", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId };
            col.find(entity).toArray((err, res) => {
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
exports.IllustratedDao = IllustratedDao;

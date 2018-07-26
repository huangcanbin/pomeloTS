const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const Illustrated = require('../domain/entity/illustrated');
const async = require('async');

let handle = module.exports;

/**
 * create illustrated object
 */
handle.create = (hero, playerId, areaId, next) => {
    if (hero.heroId >= consts.Enums.HeroType.Main) {
        utils.invokeCallback(next, null);
        return;
    }

    let client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Illustrated", (err, col, close) => {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }

        col.findOne({ playerId: playerId, heroId: hero.heroId }, (err, fres) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            if (!!fres) {
                close();
                utils.invokeCallback(next, null);
                return;
            }

            hero.playerId = playerId;
            let entity = new Illustrated(hero);

            col.insertOne(entity, (err, ires) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
                close();

                utils.invokeCallback(next, null);
            });
        });
    });
};

/**
 * create illustrated object
 */
handle.createMany = (heros, playerId, areaId, next) => {
    let client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Illustrated", (err, col, close) => {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }

        let entitys = heros.select((t) => {
            t.playerId = playerId;
            return new Illustrated(t);
        });

        col.find({ playerId: playerId }).toArray((err, fres) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            //获取玩家未拥有的图鉴
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
                utils.invokeCallback(next, null);
                return;
            }

            col.insertMany(entitys, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
                close();
                utils.invokeCallback(next, null);
            });
        });
    });
};

/**
 * get illustrated list for player
 */
handle.getByPlayer = (playerId, areaId, next) => {
    let client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Illustrated", (err, col, close) => {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        let entity = { playerId: playerId };
        col.find(entity).toArray((err, res) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();

            utils.invokeCallback(next, null, res);
        });
    });
};
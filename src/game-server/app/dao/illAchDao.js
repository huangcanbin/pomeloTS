const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const consts = require('../util/consts');
const async = require('async');
const IllAch = require('../domain/entity/illAch');
const ConfigCache = require('../../app/cache/configCache');
const playerDao = require('./playerDao');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');

/**
 * 图鉴成就Dao
 */
class illAchDao {
    /**
     * insert many
     */
    static createMany(achs, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("IllAch", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let entitys = [];
            for (let i = 0; i < achs.length; i++) {
                let ach = Object.assign({ playerId: playerId }, achs[i]);
                entitys.push(new IllAch(ach));
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
    }
    /**
     * set status
     */
    static setStatus(status, achId, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("IllAch", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let setter = { $set: { status: status } };
            col.updateOne({ playerId: playerId, achId: achId }, setter, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
                close();
                utils.invokeCallback(next, null);
            });
        });
    }
    /**
     * get by palery
     */
    static getByPlayer(playerId, areaId, next) {
        find({ playerId: playerId }, areaId, next);
    }

    static getByAchId(achId, playerId, areaId, next) {
        findOne({ playerId: playerId, achId: achId }, areaId, next);
    }
}

function find(entity, areaId, next) {
    let client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("IllAch", (err, col, close) => {
        if (!!err) {
            close();
            utils.invokeCallback(next, err, null);
            return;
        }

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
}

function findOne(entity, areaId, next) {
    let client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("IllAch", (err, col, close) => {
        if (!!err) {
            close();
            utils.invokeCallback(next, err, null);
            return;
        }

        col.findOne(entity, (err, res) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();

            utils.invokeCallback(next, null, res);
        });
    });
}

/**
 * 图鉴成就Dao
 */
module.exports = illAchDao;
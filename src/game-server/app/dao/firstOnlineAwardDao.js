const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const FirstOnlineAward = require('../domain/entity/firstOnlineAward');
const ConfigCache = require('../../app/cache/configCache');
const playerDao = require('./playerDao');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');

/**
 * 玩家关卡奖励领取记录
 */
class firstOnlineAwardDao {
    /**
     * 创建记录
     */
    static create(firstOnlineAward, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            firstOnlineAward.playerId = playerId;
            let entity = new FirstOnlineAward(firstOnlineAward);

            col.insertOne(entity, (err, res) => {
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
     * 根据玩家id获取领取记录
     */
    static getByPlayerId(playerId, type, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId, type: type };
            col.find(entity).toArray(function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();

                var result = res.select((t) => new FirstOnlineAward(t));

                utils.invokeCallback(next, null, result);
            });
        });
    }

    /**
     * 根据玩家id更新领奖记录
     */
    static upStatusByPlayerId(status, type, id, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("FirstOnlineAward", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let setter = {
                $set: {
                    status: status,
                }
            };
            col.updateOne({ playerId: playerId, typeid: id, type: type }, setter, (err, res) => {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err);
                    return;
                }

                utils.invokeCallback(next, null);
            });
        });
    }
}

/**
 * 玩家关卡奖励领取记录
 */
module.exports = firstOnlineAwardDao;
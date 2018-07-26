const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const consts = require('../util/consts');
const async = require('async');
const Card = require('../domain/entity/card');
const ConfigCache = require('../../app/cache/configCache');

/**
 * 特权卡Dao
 */
let handle = module.exports;

/**
 * 创建特权卡
 */
handle.create = (card, playerId, areaId, next) => {
    let client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Card", (err, col, close) => {
        if (!!err) {
            close();
            utils.invokeCallback(next, err);
            return;
        }

        card.playerId = playerId;
        entity = new Card(card);

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
};

/**
 * 修改特权卡
 */
handle.setCard = (setter, playerId, areaId, next) => {
    let client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Card", (err, col, close) => {
        if (!!err) {
            close();
            utils.invokeCallback(next, err);
            return;
        }

        col.updateOne({ playerId: playerId }, setter, (err, res) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }
            close();
            utils.invokeCallback(next, null);
        });
    });
};

/**
 * 获取玩家特权卡信息
 */
handle.get = (playerId, areaId, next) => {
    let client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Card", (err, col, close) => {
        if (!!err) {
            close();
            utils.invokeCallback(next, err, null);
            return;
        }

        let entity = { playerId: playerId };
        col.findOne(entity, (err, res) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();

            let entity = new Card(res);

            utils.invokeCallback(next, null, entity);
        });
    });
};

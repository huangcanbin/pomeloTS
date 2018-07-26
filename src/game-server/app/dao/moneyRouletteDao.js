const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const MoneyRoulette = require('../domain/entity/moneyRoulette');
const ConfigCache = require('../../app/cache/configCache');
const playerDao = require('./playerDao');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');

/**
 * 玩家抽奖记录
 */
class moneyRouletteDao {
    /**
     * 创建记录
     */
    static create(signAward, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("MoneyRoulette", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            signAward.playerId = playerId;
            let entity = new MoneyRoulette(signAward);

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
     * 根据玩家id获取抽奖记录
     */
    static getByPlayerId( playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("MoneyRoulette", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId };
            col.findOne(entity, (err, res) => {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err, null);
                    return;
                }

                let entity;
                if(!!res){
                    entity = new MoneyRoulette(res);
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }

    /**
     * 根据玩家id更新抽奖记录
     */
    static upRecordByPlayerId(setter, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("MoneyRoulette", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.updateOne({ playerId: playerId }, setter, (err, res) => {
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
module.exports = moneyRouletteDao;
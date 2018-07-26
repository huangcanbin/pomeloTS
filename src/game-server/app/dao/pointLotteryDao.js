const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const PointLottery = require('../domain/entity/pointLottery');
const ConfigCache = require('../../app/cache/configCache');
const playerDao = require('./playerDao');


/**
 * 召唤界面玩家关卡抽奖记录
 */
class pointLotteryDao {
    /**
     * 创建记录
     */
    static create(pointLottery, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PointLottery", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            pointLottery.playerId = playerId;
            let entity = new PointLottery(pointLottery);

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
    static getByPlayerId(playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PointLottery", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId };
            col.find(entity).toArray(function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();

                var result = res.select((t) => new PointLottery(t));

                utils.invokeCallback(next, null, result);
            });
        });
    }

    /**
     * 根据奖励配置ID获取领奖记录
    */
    static getByPointId(pointId, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PointLottery", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId, pointId: pointId };
            col.findOne(entity, (err, res) => {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err, null);
                    return;
                }

                let entity;
                if(!!res){
                    entity = new PointLottery(res);
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }

    /**
     * 根据奖励关卡id更新抽奖记录
     */
    static upStatusByPointId(pointId, setter, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PointLottery", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.updateOne({ playerId: playerId, pointId: pointId }, setter, (err, res) => {
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
 * 玩家关卡抽奖记录
 */
module.exports = pointLotteryDao;
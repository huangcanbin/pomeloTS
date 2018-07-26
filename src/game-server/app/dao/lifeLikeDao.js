const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const LifeLike = require('../domain/entity/lifeLike');
const LifeLikeTotal = require('../domain/entity/lifeLikeTotal');
const ConfigCache = require('../../app/cache/configCache');

/**
 * 玩家命格属性值记录
 */
class lifeLikeDao {
    /**
     * 创建单球属性记录
     */
    static create(lifeLike, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("LifeLike", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            lifeLike.playerId = playerId;
            let entity = new LifeLike(lifeLike);

            col.insertOne(entity, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();
                let entity;
                if(!!res){
                    entity = new LifeLike(res);
                }
                else{
                    entity = null                    
                }
                utils.invokeCallback(next, null, entity);
            });
        });
    }
    /**
     * 创建玩家总属性记录
     */
    static createTotal(lifeLikeTotal, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("LifeLikeTotal", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            lifeLikeTotal.playerId = playerId;
            let entity = new LifeLikeTotal(lifeLikeTotal);

            col.insertOne(entity, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();
                let entity;
                if(!!res){
                    entity = new LifeLikeTotal(res);
                }
                else{
                    entity = null                    
                }
                utils.invokeCallback(next, null, entity);
            });
        });
    }

    /**
     * 根据单球属性记录
     */
    static updateBallByPlayerId(setter, level, ballid, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("LifeLike", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, false);
                return;
            }

            col.updateOne({ playerId: playerId, level:level, ballid:ballid }, setter, (err, res) => {
                close();

                if (!!err) {
                    utils.invokeCallback(next, err, false);
                    return;
                }

                utils.invokeCallback(next, null, true);
            });
        });
    }

    /**
     * 根据总属性记录
     */
    static updateTotalByPlayerId(setter, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("LifeLikeTotal", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, false);
                return;
            }

            col.updateOne({ playerId: playerId }, setter, (err, res) => {
                close();

                if (!!err) {
                    utils.invokeCallback(next, err, false);
                    return;
                }

                utils.invokeCallback(next, null, true);
            });
        });
    }
    /**
     * 根据玩家id每页记录
     */
    static getBallBylevel(level, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("LifeLike", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId,level: level };
            col.find(entity).toArray(function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();

                var result = res.select((t) => new LifeLike(t));

                utils.invokeCallback(next, null, result);
            });
        });
    }
    /**
     * 根据玩家id获取单球记录
     */
    static getBallByBallid(level, ballid, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("LifeLike", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId,level: level,ballid: ballid };
            col.findOne(entity, (err, res) => {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err, null);
                    return;
                }

                let entity;
                if(!!res){
                    entity = new LifeLike(res);
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }
    /**
     * 根据玩家id获取总属性
     */
    static getTotalByPlayerId( playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("LifeLikeTotal", (err, col, close) => {
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
                    entity = new LifeLikeTotal(res);
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }
}

/**
 * 玩家命格属性值记录
 */
module.exports = lifeLikeDao;
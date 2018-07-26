const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const HeroPieceRain = require('../domain/entity/heroPieceRain');
const playerDao = require('./playerDao');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');

/**
 * 式神碎片雨
 */
class heroPieceRainDao {
    /**
     * 创建记录
     */
    static create(heroPieceRain, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("HeroPieceRain", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            heroPieceRain.playerId = playerId;
            let entity = new HeroPieceRain(heroPieceRain);

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
     * 根据玩家id获取掉落数据
     */
    static getByPlayerId( playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("HeroPieceRain", (err, col, close) => {
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
                    entity = new HeroPieceRain(res);
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }

    /**
     * 根据玩家id更新可掉落式神碎片数量和状态
     */
    static upStatusAndNumByPlayerId(status,num,rnum,srnum,ssrnum,rssrnum, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("HeroPieceRain", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let setter = {
                $set: {
                    status: status,
                    rnum: rnum,
                    srnum: srnum,
                    ssrnum: ssrnum,
                    rssrnum: rssrnum,
                }
            };
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
    /**
     * 根据玩家id更新领奖记录
     */
    static upStatusByPlayerId(status, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("HeroPieceRain", (err, col, close) => {
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


module.exports = heroPieceRainDao;
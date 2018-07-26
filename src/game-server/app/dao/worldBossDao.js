const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const WorldBoss = require('../domain/entity/worldBoss');
const ConfigCache = require('../../app/cache/configCache');

/**
 * 创建玩家世界BOSS记录
 */
class worldBossDao {
    /**
     * 创建boss挑战记录
     */
    static create(worldBoss, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("WorldBoss", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            worldBoss.playerId = playerId;
            let entity = new WorldBoss(worldBoss);

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
     * 获取前20名玩家记录
     */
    static get(time, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        let zeroHour = utils.getZeroHour(time);
        client.connect("WorldBoss", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = {updatetime:{$gte:zeroHour,$lte:time}};
            col.find(entity).sort({hp:-1,updatetime:1}).limit(20).toArray(function (err, res) {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err, null);
                    return;
                }

                var RankInfo = [];
                if (!!res && res.length > 0) {
                    for (var i = 0; i < res.length; i++) {
                        var r = res[i];
                        RankInfo.push({
                            playerId: r.playerId,
                            name: r.name,
                            hp: r.hp
                        });
                    }
                }

                utils.invokeCallback(next, null, RankInfo);
            });
        });
    }
    /**
     * 获取玩家挑战BOSS记录
     */
    static getByPlayerIdAndBossId(playerId, bossId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("WorldBoss", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId, bossid: bossId};
            col.findOne(entity, (err, res) => {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err, null);
                    return;
                }

                let entity;
                if(!!res){
                    entity = new WorldBoss(res);
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }
    /**
     * 根据玩家id更新挑战BOSS记录
     */
    static upStatusByPlayerIdAndBossId(setter, bossId, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("WorldBoss", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.updateOne({ playerId: playerId, bossid: bossId }, setter, (err, res) => {
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
     * 创建发放邮件记录
     */
    static createWorldBossAward(weekDay,areaId, next) {
        var now = Date.now();
        var client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("WorldBossAward", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.insertOne({createTime: now, weekDay: weekDay,updateTime: now}, (err, res) => {
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
     * 获取发放邮件记录
     */
    static getWorldBossAward(weekDay, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("WorldBossAward", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = {weekDay: weekDay};
            col.findOne(entity, (err, res) => {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err, null);
                    return;
                }

                let entity;
                if(!!res){
                    entity = {weekDay: weekDay, updateTime: res.updateTime};
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }
    /**
     * 更新发放邮件记录
     */
    static updateWorldBossAward(weekDay, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("WorldBossAward", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }
            let setter = {
                $set: {
                    updateTime: Date.now()
                }
            }
            col.updateOne({ weekDay: weekDay }, setter, (err, res) => {
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

module.exports = worldBossDao;
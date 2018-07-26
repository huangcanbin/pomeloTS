const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const consts = require('../util/consts');
const BossCombat = require('../domain/entity/bossCombat');

/**
 * 玩家关卡奖励领取记录
 */
class bossCombatDao {
    /**
     * 创建记录
     */
    static create(bossCombatDao, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            bossCombatDao.playerId = playerId;
            let entity = new BossCombat(bossCombatDao);
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
     * 根据玩家id获取玩家挑战记录
     */
    static getByPlayerId( playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err, col, close) => {
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
                var bossCombatRecords = [];
                if (!!res && res.length > 0) {
                    for (var i = 0; i < res.length; i++) {
                        var r = res[i];
                        bossCombatRecords.push({
                            stageId: r.stageId,
                            createTime: r.createTime,
                        });
                    }
                }
                utils.invokeCallback(next, null, bossCombatRecords);
            });
        });
    }

    /**
     * 根据玩家id获取玩家挑战记录
     */
    static getByPlayerIdAndStageID( playerId, stageId ,areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId, stageId: stageId};
            col.findOne(entity, (err, res) => {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err, null);
                    return;
                }

                let entity;
                if(!!res){
                    entity = new BossCombat(res);
                    //entity.createTime = res.createTime;
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }

    /**
     * 根据玩家id更新领奖记录
     */
    static set(playerId,stageId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("BossCombat", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let setter = {
                $set: {
                    createTime: Date.now()
                }
            };
            col.updateOne({ playerId: playerId,stageId:stageId }, setter, (err, res) => {
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
    * 根据关卡id,获取玩家对应关卡boss挑战记录
    */
    static getBossCombatRecord(bossCombatRecords, stageId) {
        var bossCombatRecord;
        bossCombatRecords.forEach(function (el) {
            if (el.stageId === stageId) {
                bossCombatRecord = el;
                return;
            }
        });
        
        return bossCombatRecord;
    }
}

/**
 * 玩家关卡奖励领取记录
 */
module.exports = bossCombatDao;
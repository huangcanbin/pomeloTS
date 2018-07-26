const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const consts = require('../util/consts');
const async = require('async');
const PlayerTask = require('../domain/entity/playerTask');
const ConfigCache = require('../../app/cache/configCache');
const playerDao = require('./playerDao');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');
const towerDao = require('./towerDao');

/**
 * 玩家任务Dao
 */
class playerTaskDao {
    /**
     *
     */
    static create(task, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("PlayerTask", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            task.playerId = playerId;
            let entity = new PlayerTask(task);

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
     * 修改玩家任务
     */
    static set(setter, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("PlayerTask", (err, col, close) => {
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
    }
    /**
     * 修改玩家任务状态
     */
    static setStatus(status, playerId, areaId, next) {
        playerTaskDao.set({
            $set: {
                status: status
            }
        }, playerId, areaId, next);
    }
    /**
     * 获取玩家任务
     */
    static get(playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("PlayerTask", (err, col, close) => {
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

                let entity = new PlayerTask(res);

                utils.invokeCallback(next, null, entity);
            });
        });
    }

    /**
     * 获取任务并判断更新任务状态
     * @param {*} playerId 
     * @param {*} areaId 
     * @param {*} next 
     */
    static upTask(playerId, areaId, next) {
        playerTaskDao.get(playerId, areaId, (err, task) => {
            if (!!err) {
                utils.invokeCallback(next, err, null);
                return;
            }

            playerTaskDao.isCompleteTask(task.taskId, playerId, areaId, (err, complete) => {
                if (!task.playerId) {
                    task.status = !!complete ? 1 : 0;
                    playerTaskDao.create(task, playerId, areaId, () => {
                        utils.invokeCallback(next, null, task);
                    });
                }
                else {
                    //完成任务且未领取奖励                    
                    if (!!complete && task.status != 2) {
                        playerTaskDao.setStatus(1, playerId, areaId, () => {
                            task.status = 1;
                            utils.invokeCallback(next, null, task);
                        });
                    }
                    else {
                        utils.invokeCallback(next, null, task);
                    }
                }
            });
        });
    }

    /**
     * 是否完成任务
     * @param {*} taskId 
     * @param {*} playerId 
     * @param {*} areaId 
     * @param {*} next 
     */
    static isCompleteTask(taskId, playerId, areaId, next) {
        let taskCfg = ConfigCache.get.task(taskId);
        if (!taskCfg) {
            utils.invokeCallback(next, null, false);
            return;
        }

        let condition = taskCfg.condition;
        let condition2 = taskCfg.condition2;
        playerTaskDao.getTaskCondition(taskCfg.type, playerId, areaId, (err, condObj) => {
            if (!!err || !condObj) {
                utils.invokeCallback(next, err, null);
                return;
            }

            let conVal, lineups;
            switch (taskCfg.type) {
                case consts.Enums.TaskType.Checkpoint:
                    conVal = condObj.maxStage - 1;  //通关当前关卡以后,才算完成任务
                    break;
                case consts.Enums.TaskType.HeroLineup:
                    conVal = condObj;
                    break;
                case consts.Enums.TaskType.LineupLv:
                    lineups = condObj.where((t) => {
                        return t.lv >= condition2;
                    });
                    conVal = lineups.length;
                    break;
                case consts.Enums.TaskType.SkillLv:
                    lineups = condObj.where((t) => {
                        return t.skillLv >= condition2;
                    });
                    conVal = lineups.length;
                    break;
                case consts.Enums.TaskType.PropLv:
                    lineups = condObj.where((t) => {
                        return t.propLv >= condition2;
                    });
                    conVal = lineups.length;
                    break;
                case consts.Enums.TaskType.Power:
                    conVal = condObj.power;
                    break;
                case consts.Enums.TaskType.Goblin:
                    conVal = condObj.goblinFlag;
                    break;
                case consts.Enums.TaskType.Tower:
                    conVal = condObj.highestId;
                    break;
                case consts.Enums.TaskType.HeroPieceRain:
                    conVal = condObj.heroPieceRainNum;
                    break;
                default:
                    utils.invokeCallback(next, null, false);
                    return;
            }

            if (conVal >= condition) {
                utils.invokeCallback(next, null, true);
            }
            else {
                utils.invokeCallback(next, null, false);
            }
        });
    }

    /**
     * 根据任务类型获取任务条件数据
     */
    static getTaskCondition(taskType, playerId, areaId, next) {
        switch (taskType) {
            case consts.Enums.TaskType.Checkpoint:
            case consts.Enums.TaskType.Power:
            case consts.Enums.TaskType.Goblin:
                playerDao.getPlayer(playerId, areaId, next);
                break;
            case consts.Enums.TaskType.HeroLineup:
                heroDao.getMaxPos(playerId, areaId, next);
                break;
            case consts.Enums.TaskType.Tower:
                towerDao.get(playerId, areaId, next);
                break;
            case consts.Enums.TaskType.LineupLv:
            case consts.Enums.TaskType.SkillLv:
            case consts.Enums.TaskType.PropLv:
                lineupDao.getByPlayer(playerId, areaId, next);
                break;
            default:
                return utils.invokeCallback(next, null, null);
        }
    }
}

/**
 * 玩家任务Dao
 */
module.exports = playerTaskDao;
const async = require('async');
const consts = require('../../../util/consts');
const playerDao = require('../../../dao/playerDao');
const playerAchieveTaskDao = require('../../../dao/playerAchieveTaskDao');
const bagDao = require('../../../dao/bagDao');
const heroDao = require('../../../dao/heroDao');
const lineupDao = require('../../../dao/lineupDao');
const Response = require('../../../domain/entity/response');
const ConfigCache = require('../../../cache/configCache');
const ItemBuilder = require('../../../cache/itemBuilder');
const utils = require('../../../util/utils');
const arrayUtil = require('../../../util/arrayUtil');


module.exports = (app) => {
    return new taskHandel(app);
};

class taskHandel {
    constructor(app) {
        this.app = app;
    }

    /**
     * 查看成就任务
     */
    get(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let achieveTask; //用户成就任务列表
        let player,lineup;  
        let totalLv = 0, totalStarLv = 0, totalSkillLv = 0, heroNums,maxStage; 
        let statusSet = [];  //成就达成需要更新状态的
        let whereStr = {};
        let setter; 

        async.waterfall([
            (cb) => {
                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;
                maxStage = player.maxStage; //关卡挑战记录
                heroNums = player.heroNum;

                lineupDao.getByPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                lineup = res;
                lineup.forEach(el =>{
                    totalLv += el.lv;
                    totalStarLv += el.starLv;
                    totalSkillLv += el.skillLv;
                });

                playerAchieveTaskDao.getAll(playerId, areaId, cb); //获取玩家所有成就任务
            },
            (res, cb) => {
                achieveTask = res;

                achieveTask.forEach( el => {
                    //根据成就type，获取玩家对应的成就完成情况
                    switch(el.type)
                    {
                        case consts.Enums.achieveTaskType.AchieveLv:
                            el.scoreNow = totalLv; //式神位总等级   
                            break;
                        case consts.Enums.achieveTaskType.AchieveStarLv:
                            el.scoreNow = totalStarLv; //式神位宝具总星级
                            break;
                        case consts.Enums.achieveTaskType.AchieveSkillLv:
                            el.scoreNow = totalSkillLv; //式神位进化总等级
                            break;
                        case consts.Enums.achieveTaskType.AchieveLinupNum:
                            el.scoreNow = heroNums; //式神总数
                            break;
                        case consts.Enums.achieveTaskType.AchievePointNum:
                            el.scoreNow = maxStage; //关卡完成度
                            break;
                        default:
                            break;
                    }
                    //根据成就完成情况，判定未完成的成就状态是否需要更新为已完成
                    if (el.status == consts.Enums.achieveTaskAwardStatus.Not && el.scoreNow > el.score ) 
                    {
                        el.status = consts.Enums.achieveTaskAwardStatus.Can;
                        statusSet.push(el.id); //加入待更新
                    }
                });

                //是否有需要更新数据的
                if(statusSet.length > 0) {
                    setter = {
                        $set: {
                            status: consts.Enums.achieveTaskAwardStatus.Can
                        }
                    };

                    whereStr.playerId = playerId;
                    whereStr.type = {"$in": new Array()};
                    
                    statusSet.forEach(el => {
                        whereStr.type["$in"].push(el);  //构建更新条件
                    });

                    playerAchieveTaskDao.setMany(whereStr, setter, playerId, areaId, cb);
                }else {
                    utils.invokeCallback(cb, null, null);
                }
            },
            (res, cb) => {
                let data = [];
                //成就任务回参结构
                achieveTask.forEach(el => {
                    data.push({
                        taskId : el.id,
                        score : el.score,
                        scoreNow : el.scoreNow,
                        status : el.status,
                        items: el.items,
                        heros: el.heros
                    });
                });

                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    achieveTask: data
                }, next);
            }
        ], (err) => {
            if (!!err) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
                });
                return;
            }
        });
    }


    /**
     * 领取成就任务奖励
     */
    getAward(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let taskId = msg.taskId * 1;
        let player,lineup;  
        let totalLv = 0, totalStarLv = 0, totalSkillLv = 0, heroNums,maxStage; 
        let taskAward, taskAwardCfg, items = [], itemMap, heroIds = [], heros = [], scoreNow;
        let exp, gold, money;

        async.waterfall([
            (cb) => {
                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;
                maxStage = player.maxStage; //关卡挑战记录
                heroNums = player.heroNum;

                lineupDao.getByPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                lineup = res;
                lineup.forEach(el =>{
                    totalLv += el.lv;
                    totalStarLv += el.starLv;
                    totalSkillLv += el.skillLv;
                });

                playerAchieveTaskDao.getOne(taskId, playerId, areaId, cb);
            },
            (res, cb) => {
                taskAward = res;

                if (!taskAward) {
                    //数据不存在
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_DATA_NOT_EXIST
                    });
                    return;
                }

                taskAwardCfg = ConfigCache.get.achieveTask(taskAward.type);
                if (!taskAwardCfg) {
                    //配置错误
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_INTEN
                    });
                    return;
                }

                if (taskAward.status == consts.Enums.achieveTaskAwardStatus.Alr ) {
                    //奖励已领取
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TASK_AWARD
                    });
                    return;
                }

                //查看成就完成情况
                switch (taskAwardCfg.type)
                {
                    case consts.Enums.achieveTaskType.AchieveLv:
                        scoreNow = totalLv; //式神位总等级   
                        break;
                    case consts.Enums.achieveTaskType.AchieveStarLv:
                        scoreNow = totalStarLv; //式神位宝具总星级
                        break;
                    case consts.Enums.achieveTaskType.AchieveSkillLv:
                        scoreNow = totalSkillLv; //式神位进化总等级
                        break;
                    case consts.Enums.achieveTaskType.AchieveLinupNum:
                        scoreNow = heroNums; //式神总数
                        break;
                    case consts.Enums.achieveTaskType.AchievePointNum:
                        scoreNow = maxStage; //关卡完成度
                        break;
                    default:
                        break;
                }

                if(taskAward.status == consts.Enums.achieveTaskAwardStatus.Not || scoreNow < taskAwardCfg.score) {
                    //任务未完成
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TASK_NO_COMPLETE
                    });
                    return;
                }

                utils.invokeCallback(cb,null,null);
            },
            (res, cb) => {
                items = taskAwardCfg.items;
                itemMap = new ItemBuilder(items, ConfigCache.items());

                exp = itemMap.getExp();
                gold = itemMap.getGold();
                money = itemMap.getMoney();

                if (gold > 0 || exp > 0 || money > 0) {
                    playerDao.setPlayer({
                        $inc: {
                            gold: gold,
                            exp: exp,
                            money: money
                        }
                    }, playerId, areaId, cb);
                }
                else {
                    playerDao.getPlayer(playerId, areaId, cb);
                }
            },
            (res, cb) => {
                player = res;

                let itemArray = itemMap.getItem();
                if (!!itemArray && itemArray.length > 0) {
                    bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null);
                }
            },
            (cb) => {
                heroIds = taskAwardCfg.heroIds;

                if (!!heroIds && heroIds.length > 0) {
                    heros = heroIds.select((t) => {
                        return { hero: { id: t } };
                    });

                    heroDao.createMany(heros, player, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null, {});
                }
            },
            (res, cb) => {
                heros = res;

                //更新状态为已领取
                playerAchieveTaskDao.setMany({
                    playerId: playerId,
                    type: taskAwardCfg.id
                },{
                    $set: {
                        status: consts.Enums.achieveTaskAwardStatus.Alr,
                        finishTime: Date.now()
                    }
                }, playerId, areaId, cb);
            },
            (cb) => {
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    taskId: taskId,
                    items: items,
                    heros: heros
                }, next);
            }
        ], (err) => {
            if (!!err) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
                });
                return;
            }
        });
    }

}

const async = require('async');
const consts = require('../../../util/consts');
const playerDao = require('../../../dao/playerDao');
const playerDailyTaskDao = require('../../../dao/playerDailyTaskDao');
const bagDao = require('../../../dao/bagDao');
const heroDao = require('../../../dao/heroDao');
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
     * 查看日常任务
     */
    get(msg, session, next) {
        var self = this;
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let dailyTask = []; //用户日常任务列表
        let dailyTaskAwards = []; //日常任务奖励列表
        let player,totalActivity;  
        let hasRemedial = false;

        async.waterfall([
            (cb) => {
                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;

                //结算每日持续在线任务情况
                let inc;
                let limit = ConfigCache.get.dailyTask(consts.Enums.dailyTaskType.DailyOnline).limit;
                let onlineMinute = Math.floor( ( player.onlineTime + Date.now() - player.lastLogin ) / (60 * 1000) );
                inc = onlineMinute > limit ? limit : onlineMinute ;
                playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyOnline, inc, playerId, areaId); //每日持续在线时间的完成情况登记

                if(!player.isRemedial && player.remedialList.length > 0)   //判断是否有可补领的前日日常奖励
                {
                    hasRemedial = true;
                }

                playerDailyTaskDao.getAll(playerId, areaId, cb); //获取玩家所有日常任务和奖励领取情况
            },
            (res, cb) => {
                let dailyTaskArr = res['task'];
                let dailyTaskAwardsArr = res['award'];

                if (res['player'] && !res['player'].isRemedial && res['player'].remedialList.length > 0)    //重置后，判断是否有需要补领的奖励
                {
                    hasRemedial = true;
                }

                //计算总活跃值
                totalActivity = dailyTaskArr.sum((t) => {
                    let tmp = t.completeTimes * t.activity;
                    return tmp;
                });

                //日常任务
                dailyTaskArr.forEach(el => {
                    dailyTask.push({
                        taskId : el.id,
                        completeTimes : el.completeTimes,
                        limit : el.limit
                    });
                });

                //奖励领取情况
                dailyTaskAwardsArr.forEach(el => {
                    dailyTaskAwards.push({
                        awardId : el.id,
                        status : self.checkStatus(el.completeTimes, el.activity, totalActivity), //判断领取状态
                        activity : el.activity,
                        items: el.items,
                        heros: el.heros
                    });
                });

                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    dailyTask: dailyTask,
                    dailyTaskAwards: dailyTaskAwards,
                    totalActivity: totalActivity,
                    hasRemedial: hasRemedial,
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
     * 领取日常任务奖励
     */
    getAward(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let awardId = msg.awardId * 1;
        let taskAward, taskAwardCfg, items = [], itemMap, player, heroIds = [], heros = [];
        let exp, gold, money;
        let totalActivity;

        async.waterfall([
            (cb) => {
                playerDailyTaskDao.count( playerId, areaId, cb);    //统计总活跃值
            },
            (res, cb) => {
                totalActivity = res;
                playerDailyTaskDao.getOne(awardId, playerId, areaId, cb);
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

                if (taskAward.completeTimes > 0 ) {
                    //奖励已领取
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TASK_AWARD
                    });
                    return;
                }

                taskAwardCfg = ConfigCache.get.dailyTaskAward(awardId);

                if (totalActivity < taskAwardCfg.activity)
                {
                    //未达成
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TASK_NO_COMPLETE
                    });
                    return;
                }

                if (!taskAwardCfg) {
                    //配置错误
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_INTEN
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
                playerDailyTaskDao.set({
                    $set: {
                        completeTimes: 1,
                        finishTime: Date.now()
                    }
                }, playerId, awardId, areaId, cb);
            },
            (cb) => {
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    awardId: awardId,
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


    /**
     * 补领前日日常任务奖励
     */
    getLastAward(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let remedialType = msg.remedialType * 1;
        let awardId = [], taskAwardCfg = [], items = [], itemMap, player, heroIds = [], heros = [];
        let exp, gold, money;
        let costMoney = 0; //付费补领总开销

        async.waterfall([
            (cb) => {
                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;

                if (player.isRemedial)
                {
                    //已领取
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TASK_AWARD
                    });
                    return;
                }

                if (player.remedialList.length <= 0)
                {
                    //补领数据不存在
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_REMEDIAL_NOT_EXIST
                    });
                    return;
                }

                awardId = player.remedialList;
                awardId.forEach( el => {
                    if (ConfigCache.get.dailyTaskAward(el))
                    {
                        //根据领取方式筛选可领取的奖励
                        switch (remedialType)   
                        {
                            case consts.Enums.remedialType.Free:    //只要免费部分
                                if(ConfigCache.get.dailyTaskAward(el).remedialPrice == 0)
                                {
                                    taskAwardCfg.push(ConfigCache.get.dailyTaskAward(el));
                                }
                                break;    
                            case consts.Enums.remedialType.Pay:     //付费全领
                                taskAwardCfg.push(ConfigCache.get.dailyTaskAward(el));
                                costMoney += ConfigCache.get.dailyTaskAward(el).remedialPrice;  //计算开销
                                break; 
                            default:
                                break;
                        }
                    }
                });

                awardId = []; 
                taskAwardCfg.forEach( el => {
                    if (!el) {
                        //配置错误
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_INTEN
                        });
                        return;
                    }else{
                        awardId.push(el.id);    //重新分配id
                    }
                });

                if(costMoney && costMoney > player.money)
                {
                    //代币不足
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_MENOY
                    });
                    return;
                }

                utils.invokeCallback(cb,null,null);
            },
            (res, cb) => {
                taskAwardCfg.forEach(el => {
                    for(var i=0; i<el.items.length; i++)
                    {
                        items.push(el.items[i]);
                    }
                });

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
                taskAwardCfg.forEach(el => {
                    for(var i=0; i<el.heroIds.length; i++)
                    {
                        heroIds.push(el.heroIds[i]);
                    }
                });

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

                //清空补领列表，并置位补领标志位
                playerDao.setPlayer({
                    $set: {
                        isRemedial: true,
                        remedialList: []
                    },
                    $inc: {
                        money: -costMoney
                    }
                }, playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    awardId: awardId,
                    items: items,
                    heros: heros,
                    money: player.money
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


    //根据总活跃值判断领取状态
    checkStatus(isGet, needActivity, totalActivity) {
        let res = consts.Enums.dailyTaskAwardStatus.Not; //不可领取
        if(isGet) {
            res = consts.Enums.dailyTaskAwardStatus.Alr; //已领取
        }else if(needActivity <= totalActivity){
            res = consts.Enums.dailyTaskAwardStatus.Can; //可领取
        }
        return res;
    }
}

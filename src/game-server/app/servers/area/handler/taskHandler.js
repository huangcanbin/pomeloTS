const async = require('async');
const consts = require('../../../util/consts');
const playerDao = require('../../../dao/playerDao');
const playerTaskDao = require('../../../dao/playerTaskDao');
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
     * 查看任务
     */
    get(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let task;

        async.waterfall([
            (cb) => {
                //更新前任务状态
                playerTaskDao.upTask(playerId, areaId, cb);
            },
            (res, cb) => {
                task = res;

                let taskCfg = ConfigCache.get.task(task.taskId);

                if (!taskCfg) {
                    //配置错误
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_INTEN
                    });
                    return;
                }

                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    nowTaskId: task.taskId,
                    status: task.status,
                    type: taskCfg.type,
                    condition: taskCfg.condition,
                    condition2: taskCfg.condition2,
                    items: taskCfg.items,
                    heros: taskCfg.heros
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
     * 领取任务奖励
     */
    getAward(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let task, taskCfg, nextTaskCfg, items = [], itemMap, player, heroIds = [], heros = [];
        let exp, gold, money, nextStatus = 0;

        async.waterfall([
            (cb) => {
                playerTaskDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                task = res;

                if (task.status == 0) {
                    //任务未完成
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TASK_NO_COMPLETE
                    });
                    return;
                }
                else if (task.status == 2) {
                    //奖励已领取
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TASK_AWARD
                    });
                    return;
                }

                taskCfg = ConfigCache.get.task(task.taskId);
                if (!taskCfg) {
                    //配置错误
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_INTEN
                    });
                    return;
                }

                if (taskCfg.nextTaskId == 0) {
                    //最后一个任务,状态修改为已领取
                    playerTaskDao.setStatus(2, playerId, areaId, cb);
                }
                else {
                    playerTaskDao.set({
                        $set: {
                            taskId: taskCfg.nextTaskId,
                            status: 0
                        }
                    }, playerId, areaId, cb);
                }
            },
            (cb) => {
                items = taskCfg.items;
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
                heroIds = taskCfg.heroIds;

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

                nextTaskCfg = ConfigCache.get.task(taskCfg.nextTaskId);
                if (!!nextTaskCfg) {
                    playerTaskDao.isCompleteTask(taskCfg.nextTaskId, playerId, areaId, (err, res) => {
                        if (!!res) {
                            nextStatus = 1;
                            //更新任务状态
                            playerTaskDao.setStatus(nextStatus, playerId, areaId, cb);
                        }
                        else {
                            utils.invokeCallback(cb, null);
                        }
                    });
                }
                else {
                    nextTaskCfg = { type: 0, condition: 0, condition2: 0, items: [], heros: [] };
                    utils.invokeCallback(cb, null);
                }
            },
            (cb) => {
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    nextTask: {
                        id: nextTaskCfg.id,
                        status: nextStatus,
                        type: nextTaskCfg.type,
                        condition: nextTaskCfg.condition,
                        condition2: nextTaskCfg.condition2,
                        items: nextTaskCfg.items,
                        heros: nextTaskCfg.heros
                    },
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
     * 获取当前任务状态
     */
    getStatus(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');

        async.waterfall([
            (cb) => {
                playerTaskDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    nowTaskId: res.taskId,
                    status: res.status
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
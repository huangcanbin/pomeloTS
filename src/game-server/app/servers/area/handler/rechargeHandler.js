const async = require('async');
const consts = require('../../../util/consts');
const playerDao = require('../../../dao/playerDao');
const rechargeDao = require('../../../dao/rechargeDao');
const bagDao = require('../../../dao/bagDao');
const heroDao = require('../../../dao/heroDao');
const Response = require('../../../domain/entity/response');
const ConfigCache = require('../../../cache/configCache');
const ItemBuilder = require('../../../cache/itemBuilder');
const utils = require('../../../util/utils');
const arrayUtil = require('../../../util/arrayUtil');
const pointAwardDao = require('../../../dao/pointAwardDao');
const rechargeRebateDao = require('../../../dao/rechargeRebateDao');
const pointLotteryDao = require('../../../dao/pointLotteryDao');

module.exports = (app) => {
    return new rechargeHandler(app);
};

/**
 * 首充功能
 */
class rechargeHandler {
    constructor(app) {
        this.app = app;
    }

    /**
     * 查看充值奖励状态
     */
    getStatus(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');

        async.waterfall([
            (cb) => {
                rechargeDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
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

    /**
    * 查看充值奖励内容
    */
    get(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let recharge;

        async.waterfall([
            (cb) => {
                //更新前任务状态
                rechargeDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                recharge = res;

                let rechargeCfg = ConfigCache.get.recharge(recharge.rechargeId);

                if (!rechargeCfg) {
                    //配置错误
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_INTEN
                    });
                    return;
                }

                var isFirst = rechargeCfg.needMoney == 0;

                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    status: recharge.status,
                    isFirst: isFirst,
                    rechargeMoney: recharge.rechargeMoney,
                    needMoney: rechargeCfg.needMoney,
                    items: rechargeCfg.items,
                    heros: rechargeCfg.heros
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
    * 领取充值奖励
    */
    getAward(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let recharge, rechargeCfg, nextRechargeCfg, items = [], itemMap, player, heroIds = [], heros = [];
        let exp, gold, money, nextStatus = 0;

        async.waterfall([
            (cb) => {
                rechargeDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                recharge = res;

                if (recharge.status == 0) {
                    //未达到充值金额
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_RECHARGE_NO_COMPLETE
                    });
                    return;
                }
                else if (recharge.status == 2) {
                    //奖励已领取
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_AWARD
                    });
                    return;
                }

                rechargeCfg = ConfigCache.get.recharge(recharge.rechargeId);
                if (!rechargeCfg) {
                    //配置错误
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_INTEN
                    });
                    return;
                }

                if (rechargeCfg.nextId == 0) {
                    //最后一个任务,状态修改为已领取
                    rechargeDao.setStatus(2, playerId, areaId, cb);
                }
                else {
                    rechargeDao.set({
                        $set: {
                            rechargeId: rechargeCfg.nextId,
                            status: 0
                        }
                    }, playerId, areaId, cb);
                }
            },
            (cb) => {
                items = rechargeCfg.items;
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
                heroIds = rechargeCfg.heroIds;

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

                nextRechargeCfg = ConfigCache.get.recharge(rechargeCfg.nextId);
                if (!!nextRechargeCfg) {
                    if (!!rechargeDao.isCompleteRecharge(nextRechargeCfg, recharge.rechargeMoney)) {
                        nextStatus = 1;
                        //更新任务状态
                        rechargeDao.setStatus(nextStatus, playerId, areaId, cb);
                    }
                    else {
                        utils.invokeCallback(cb, null);
                    }
                }
                else {
                    nextRechargeCfg = { items: [], heros: [] };
                    utils.invokeCallback(cb, null);
                }
            },
            (cb) => {
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
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
     * 充值
     */
    recharge(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let recharge, rechargeCfg;
        let money = 1 * msg.money;
        let player,playerAwas;
        let cfgs = ConfigCache.getAll.pointAward();
        let cfgArr = arrayUtil.dictionaryToArray(cfgs);
        let oncestatus;
        let vipCfgs = ConfigCache.getAll.vipPrivilege();
        let vipCfgsArr = arrayUtil.dictionaryToArray(vipCfgs);
        let rechargemoney;
        let todayrechargemoney;
        let todaytimes;
        let lastrechargetime;
        let now = Date.now();
        let rechargeRebateAwards;
        let RebateCfgs = ConfigCache.getAll.rechargeRebateAward();
        let RebateCfgsArr = arrayUtil.dictionaryToArray(RebateCfgs);
        let rechargetype = msg.type * 1 || 0;
        let rechargetypeid = msg.id * 1 || 0;
        let todaymoney;
        let pointid = msg.pointid * 1;

        if (money <= 0) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
        }

        async.waterfall([
            (cb) => {
                rechargeDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                recharge = res;
                rechargeCfg = ConfigCache.get.recharge(recharge.rechargeId);

                if (!recharge.playerId) {
                    //首充
                    recharge.rechargeMoney = money;
                    recharge.todayRechargeMoney = money;
                    recharge.status = 1;
                    recharge.rechargeNum = 1;
                    rechargemoney = money;
                    if(money >= 250){
                        recharge.onceStatus = 1;
                    }
                    rechargeDao.create(recharge, playerId, areaId, cb);
                }
                else {
                    //累充
                    //更新充值金额/更新充值状态
                    rechargemoney = recharge.rechargeMoney + money;
                    oncestatus = recharge.onceStatus > 0 ? 1 : (money >= 250 ? 1 : 0);
                    if(!utils.isSameDate(recharge.lastRechargeTime,now)){
                        todaymoney = money - recharge.todayRechargeMoney;
                        todaytimes = 1 - recharge.todayTimes;
                        todayrechargemoney = money;
                    }else{
                        todaymoney = money;
                        todaytimes = 1;
                        todayrechargemoney = recharge.todayRechargeMoney + money
                    }
                    let setter = {
                        $inc: {
                            rechargeMoney: money,
                            todayRechargeMoney: todaymoney,
                            rechargeNum: 1,
                            onceStatus: recharge.onceStatus > 0 ? 0 : (money >= 250 ? 1 : 0),
                            todayTimes: todaytimes
                        }
                    };
                    let comp = !!rechargeDao.isCompleteRecharge(rechargeCfg, (recharge.rechargeMoney + money));
                    let status = 0
                    if (recharge.status == 0 && !!comp) {
                        status = 1;
                    }
                    setter.$set = {
                        status: status,
                        lastRechargeTime: now
                    };

                    rechargeDao.set(setter, playerId, areaId, cb);
                }
            },
            (cb) => {
                let vipLev = 0;
                for(var i = 0; i < vipCfgsArr.length; i++){
                    if(rechargemoney >= vipCfgsArr[i].rechargenum){
                        vipLev = vipCfgsArr[i].viplev;
                    }else{
                        break;
                    }
                }
                
                //更新勾玉
                playerDao.setPlayer({
                    $set: {
                        vip: vipLev
                    },
                    $inc: {
                        money: money
                    }
                }, playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;
                pointAwardDao.getByPlayerId(playerId, areaId, cb);
            },
            (res, cb) => {
                playerAwas = res || [];
                rechargeRebateDao.getByPlayerId(playerId, areaId, cb);
            },
            (res, cb) => {
                rechargeRebateAwards = res || [];
                /**通关奖励 */
                cfgArr.select((t) => {
                    let nowawa = playerAwas.firstOrDefault(j => j.awardId == t.id);
                    if (!!nowawa) {
                        if(t.point < player.maxStage){
                            if(oncestatus == 1){
                                if(nowawa.onceStatus == consts.Enums.getStatus.Not){
                                    pointAwardDao.upOnceStatusByAwaId(nowawa.awardId, consts.Enums.getStatus.Can, playerId, areaId);
                                }
                            }
                        } 
                    } 
                });            
                /**充值返利相关操作 */
                RebateCfgsArr.select((t) => {
                    let money;
                    let times = 0;
                    let status = consts.Enums.getStatus.Not;
                    let alrtimes = 0;
                    if(t.rebatetype == consts.Enums.rebateType.Today){
                        money = todayrechargemoney;
                    }else{
                        money = rechargemoney;
                    }
                    if(t.type < consts.Enums.rebateType.AllEvery){
                        let nowawa = rechargeRebateAwards.firstOrDefault(j => j.type == t.type && j.typeid == t.typeid);
                        if (!nowawa) {
                            if(t.rebatetype == consts.Enums.rebateType.Today){
                                times = 1;
                            }else{
                                times = t.times;
                            }

                            if(money >= t.money){
                                status = consts.Enums.getStatus.Can;
                                rechargeRebateDao.create({type: t.type, typeid: t.typeid, times: times, status: status, rebatetype: t.rebatetype}, playerId, areaId);
                            }
                        }else{
                            if(t.rebatetype == consts.Enums.rebateType.Today){
                                times = nowawa.times;
                                alrtimes = nowawa.alrtimes;
                                if(utils.isSameDate(nowawa.rechargetime,now)){
                                    if(nowawa.times < t.times){
                                        times = times + 1;
                                    }
                                }else{
                                    alrtimes = 0;
                                    times = 1;
                                }

                                if(money >= t.money && times < t.times){
                                    status = consts.Enums.getStatus.Can;
                                    let setter = {
                                        $set:{
                                            times: times,
                                            alrtimes: alrtimes,
                                            status: status,
                                            rechargetime: now
                                        }
                                    }
                                    rechargeRebateDao.upStatusByPlayerId(setter, t.type, t.typeid, playerId,areaId);
                                }
                            }
                        }
                    }else{
                        if(rechargetype == t.type && rechargetypeid == t.typeid){
                            status = consts.Enums.getStatus.Can;
                            rechargeRebateDao.create({type: t.type, typeid: t.typeid, times: t.times, status: status, rebatetype: t.rebatetype}, playerId, areaId);
                        }
                    }
                });
                //关卡抽奖第一次抽奖升级奖励充值
                if(pointid > 0){
                    let needMoney = ConfigCache.pointLotteryUpdateAward.get(pointid).money;
                    if(money > 0 && money >= needMoney){
                        pointLotteryDao.upStatusByPointId(pointid,{
                            $set: {
                                firstRechargeStatus: 1
                            }
                        },playerId,areaId)
                    }
                }    
            
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
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
     * 查看一次性充值25元的状态
     */
    getOnceStatus(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let onceStatus,maxStage;

        async.waterfall([
            (cb) => {
                rechargeDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                onceStatus = res.onceStatus;
                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                maxStage = res.maxStage;
            
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    status: onceStatus,
                    maxStage: maxStage - 1
                }, next);
            },
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
     * 领取一次性充值25元的额外通关奖励
     */
    getOnceAward(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let awaId = 1 * msg.awaId;
        let player,playerAwa,recharge;
        let hasRecord = false;  //有领奖记录
        let exp = 0, gold = 0, money = 0, items = [], heroIds = [];

        let cfg = ConfigCache.get.pointAward(awaId);
        if (!cfg) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
            });
            return;
        }

    async.waterfall([
        (cb) => {
            rechargeDao.get(playerId, areaId, cb);
        },
        (res,cb) => {
            recharge = res;
            if (!!recharge) {
                if (recharge.onceStatus == 0) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_ONCE_RECHARGE
                    });
                    return;
                }
            }else{
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_ONCE_RECHARGE
                });
                return;
            }
            
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;
            pointAwardDao.getByAwaId(awaId, playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwa = res;

            if (!!playerAwa) {
                if (playerAwa.onceStatus != 0) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_AWARD
                    });
                    return;
                }

                hasRecord = true;
            }
            else {
                if (cfg.point >= player.maxStage) {
                    //未达通过关卡
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TASK_NO_COMPLETE
                    });
                    return;
                }

                hasRecord = false;
            }

            let itemMap = new ItemBuilder(cfg.onceitems, ConfigCache.items());
            money += itemMap.getMoney();
            if (!!hasRecord) {
                //修改状态
                pointAwardDao.upOnceStatusByAwaId(awaId, 1, playerId, areaId, cb);
            }
            else {
                //添加记录
                pointAwardDao.create({ awardId: awaId, onceStatus: 1 }, playerId, areaId, cb);
            }
        },
        (cb) => {
            if (money > 0) {
                playerDao.setPlayer({
                    $inc: {
                        money: money
                    }
                }, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        },
        (res, cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                money: res.money
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
    }
}
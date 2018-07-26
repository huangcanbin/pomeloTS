var consts = require('../../../util/consts');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../../util/utils');
var async = require('async');
var Formula = require('../../../util/formula');
var ConfigCache = require('../../../cache/configCache');
var playerDao = require('../../../dao/playerDao');
var playerLog = require('../../../dao/log/playerDao');
var heroDao = require('../../../dao/heroDao');
var bagDao = require('../../../dao/bagDao');
var bagLog = require('../../../dao/log/bagDao');
var pointLotteryDao = require('../../../dao/pointLotteryDao');
var ItemBuilder = require('../../../cache/itemBuilder');
var PushConsumeModel = require('../../../domain/entity/pushConsumeModel');
var pushDataToSdService = require('../../../services/pushDataToSdService');
var playerDailyTaskDao = require('../../../dao/playerDailyTaskDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 式神召唤界面
 */
Handler.prototype.entry = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player = {};
    var daily = {};
    var goldExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Gold);
    var moneyExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Money);
    var ticketExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Ticket);
    var heroRaffleTickets = 0; //式神抽奖券数量
    var pointLotteryInfo = []; //关卡抽奖信息
    var maxXp;
    var nowXp;
    var now = Date.now();

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        daily = player.daily;
        var hour = ConfigCache.getVar.const(consts.Keys.EVERY_DAY_REFRESH_TIME);
        var date = utils.getDateOfHour(hour, 0, 0);

        if (daily.updateTime < date) {
            //每日7点重置复免费计数           
            logger.debug('daily reflesh free time:%d player:%d', date, playerId);
            daily.useGoldFree = 0;
            daily.useMoneyFree = 0;
            daily.costGoldCount = 0;
            daily.updateTime = Date.now();

            playerDao.setPlayer({
                $set: {
                    "daily.useGoldFree": daily.useGoldFree,
                    "daily.costGoldCount": daily.costGoldCount,
                    "daily.useMoneyFree": daily.useMoneyFree,
                    'daily.updateTime': daily.updateTime
                }
            }, playerId, areaId, cb);
        } else {
            utils.invokeCallback(cb, null, null);
        }
    }, function (res, cb) {
        //获取背包里的式神抽奖券
        bagDao.getByItemId(400000, playerId, areaId, cb);
    }, function (res, cb) {
        if (res && res.length > 0) {
            res.forEach(function (el) {
                heroRaffleTickets += el.num;
            }, this);
        }
        maxXp = ConfigCache.getVar.const(consts.Keys.MAX_XP);
        nowXp = (daily.xp || 0) > maxXp ? maxXp : daily.xp || 0;
        pointLotteryDao.getByPlayerId(playerId, areaId, cb);
    }, function (res, cb) {   
        if (res && res.length > 0) {
            res.forEach(function (el) {
                let lastTime = el.lastTime;
                let alrTimes = el.times;
                let cfg = ConfigCache.get.pointLotteryUpdate(el.pointId * 100 + el.lv)
                if((now - el.lastTime) > cfg.cd * 1000){
                    lastTime = el.lastTime + Math.floor((now - el.lastTime)/cfg.cd/1000) * cfg.cd * 1000;
                    alrTimes = 0;
                }
                pointLotteryInfo.push({pointId: el.pointId, lv: el.lv, cd: cfg.cd, lastTime: lastTime, times: cfg.times, alrTimes: alrTimes})
            }, this);
        }
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            goldFree: goldExpend.freeNum,
            useGoldFree: daily.useGoldFree || 0,
            moneyFree: moneyExpend.freeNum,
            useMoneyFree: daily.useMoneyFree || 0,
            ssrRemain: daily.ssrRemain || 0,
            costMoney: moneyExpend.num,
            costGold: goldExpend.num,
            costTicket: ticketExpend.num,
            heroRaffleTickets: heroRaffleTickets,
            xpNum: nowXp,
            maxXp: maxXp,
            goldCount: daily.costGoldCount,
            pointLotteryInfo: pointLotteryInfo
        });

    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_SUMMON_TAKE
            });
            return;
        }
    });
};

/**
 * 抽取接口
 */
Handler.prototype.take = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var type = parseInt(msg.type) || 0;
    var daily = {}, player = {}, hero = {}, heroId = 0, costNum = 0, costItem = 0;
    var goldExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Gold);
    var moneyExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Money);
    var itemExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Ticket);
    //过滤抽取表类型
    var filterType = type;
    var costGold = 0, costMoney = 0;
    let addXp = 0;   //增长的xp
    var vipConfig;

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        daily = player.daily;
        vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);

        heroDao.isEnoughHeroBag([1], player, playerId, areaId, cb);
    }, function (res, cb) {
        if (res.code !== consts.RES_CODE.SUC_OK) {
            next(null, res);
            return;
        }

        //判断足够的消耗品
        switch (type) {
            case consts.Enums.SummonType.Money:
                costMoney = Math.floor(moneyExpend.num * vipConfig.lotterymoney);
                addXp = moneyExpend.xp_num;
                if (daily.useMoneyFree >= moneyExpend.freeNum && player.money < costMoney) {
                    //免费次数用完且代币(勾玉)不足
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_SUMMON_NOT_MENOY
                    });
                    return;
                }
                //代币抽需要记录剩余抽到SSR的次数
                if (daily.useMoneyFree < moneyExpend.freeNum) {
                    if (daily.ssrRemain === 1) {//重新计数
                        playerDao.setPlayer({
                            $inc: {
                                "daily.useMoneyFree": 1
                            },
                            $set: { "daily.ssrRemain": consts.Vars.SSR_INIT_NUM }
                        }, playerId, areaId, cb);
                    } else {
                        playerDao.setPlayer({
                            $inc: {
                                "daily.useMoneyFree": 1,
                                "daily.ssrRemain": -1
                            }
                        }, playerId, areaId, cb);
                    }
                } else {
                    costItem = moneyExpend.item;
                    costNum = costMoney;
                    if (daily.ssrRemain === 1) {//重新计数
                        //第10次代币抽使用勾玉配置权重抽取
                        filterType = consts.Enums.SummonType.GouYu;
                        playerDao.setPlayer({
                            $inc: {
                                money: -costMoney
                            },
                            $set: { "daily.ssrRemain": consts.Vars.SSR_INIT_NUM }
                        }, playerId, areaId, cb);
                    } else {
                        playerDao.setPlayer({
                            $inc: {
                                money: -costMoney,
                                "daily.ssrRemain": -1
                            }
                        }, playerId, areaId, cb);
                    }
                }
                return;
            case consts.Enums.SummonType.Gold:
                //金币每抽一次价格会上涨 当前抽奖付费=初始付费*2的Goldusenum次方
                costGold = goldExpend.num * Math.pow(2, daily.costGoldCount);
                addXp = goldExpend.xp_num;
                if (daily.useGoldFree >= goldExpend.freeNum && player.gold < costGold) {
                    //免费次数用完且金币不足
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_SUMMON_NOT_GOLD
                    });
                    return;
                }
                if (daily.useGoldFree < goldExpend.freeNum) {
                    playerDao.setPlayer({
                        $inc: {
                            "daily.useGoldFree": 1,
                            "daily.costGoldCount": 1    //免费也记录次数
                        }
                    }, playerId, areaId, cb);
                } else {
                    costItem = goldExpend.item;
                    costNum = costGold;
                    playerDao.setPlayer({
                        $inc: {
                            gold: -costGold,
                            "daily.costGoldCount": 1
                        }
                    }, playerId, areaId, cb);
                }
                return;
            case consts.Enums.SummonType.Ticket:
                //使用物品，延后一个处理
                costItem = itemExpend.item;
                costNum = itemExpend.num;
                addXp = itemExpend.xp_num;
                bagDao.useItem(itemExpend.item, itemExpend.num, false, playerId, areaId, cb);
                break;
            case consts.Enums.SummonType.XP:
                let maxXp = ConfigCache.getVar.const(consts.Keys.MAX_XP) - vipConfig.lotteryxp;
                if (daily.xp >= maxXp) {
                    playerDao.setPlayer({
                        $set: {
                            "daily.xp": 0
                        }
                    }, playerId, areaId, cb);
                }
                else {
                    //免费次数用完且代币(勾玉)不足
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_SUMMON_NOT_XP
                    });
                    return;
                }
                break;
            default:
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_VOID_PARAM
                });
                return;
        }
    }, function (res, cb) {
        if (type === consts.Enums.SummonType.Ticket) {
            if (!res) {
                //奖券不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_SUMMON_NOT_TICKET
                });
                return;
            }

            utils.invokeCallback(cb, null, null);
            return;
        }
        utils.invokeCallback(cb, null, res);

    }, function (res, cb) {
        if (!!res) {
            player = res;
        }

        if (costMoney > 0) {
            let pushModel = new PushConsumeModel({
                serverID: areaId,     //areaId
                type: consts.Enums.consumeType.heroTake,
                accountID: playerId,
                number: costMoney,
                itemType: consts.Enums.consumeType.heroTake,
                price: costMoney
            });

            pushDataToSdService.pushConsume(pushModel);
        }

        daily = player.daily;

        //抽取式神
        var hitSet = ConfigCache.getAll.heroLottery();
        var hitItem = Formula.hitOneFromDict(hitSet, function (p) { return p.type === filterType; });
        heroId = hitItem.heroId;
        hero = ConfigCache.get.hero(heroId);
        if (!hero) {
            //式神不存在
            logger.error('At HeroTakeTen heroId:%d is not found.', heroId);
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_SUMMON_TAKE
            });
            return;
        }

        heroDao.create(hero, player, playerId, areaId, cb);
    }, function (res, cb) {
        hero = res;

        if (addXp > 0) {
            playerDao.setPlayer({
                $inc: {
                    "daily.xp": addXp
                }
            }, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null, null);
        }
    }, function (res, cb) {
        if (!!res) {
            player = res;
            daily = player.daily;
        }

        if (costNum === 0) {
            utils.invokeCallback(cb, null);
            return;
        }

        let inc = consts.Enums.DailyMinInc;
        if(type == consts.Enums.SummonType.Gold) {   
            playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyExtractGold, inc, playerId, areaId); //每日完成一次金币抽奖的记录    
        }else if (type == consts.Enums.SummonType.Money || type == consts.Enums.SummonType.Ticket) {
            playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyExtractMoney, inc, playerId, areaId); //每日完成一次代币/奖券抽奖的记录
        }

        if (type === consts.Enums.SummonType.Ticket) {
            bagLog.write([{ id: costItem, num: -costNum }], 'HeroTake', playerId, areaId, cb);
        } else {
            //增加日志记录
            var ops = {
                lv: player.lv,
                exp: player.exp,
                gold: player.gold,
                money: player.money,
                energy: player.energy,
                bean: player.bean,
                incGold: -costGold,
                incMoney: -costMoney
            };
            playerLog.write(ops, 'TakeHero', playerId, areaId, cb);
        }
    }, function (cb) {
        let maxXp = ConfigCache.getVar.const(consts.Keys.MAX_XP);
        let nowXp = (daily.xp || 0) > maxXp ? maxXp : daily.xp || 0;

        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            costItem: costItem,
            costNum: costNum,
            hid: hero.hid,
            heroId: heroId,
            goldFree: goldExpend.freeNum,
            useGoldFree: daily.useGoldFree || 0,
            moneyFree: moneyExpend.freeNum,
            useMoneyFree: daily.useMoneyFree || 0,
            ssrRemain: daily.ssrRemain || 0,
            xpNum: nowXp,
            goldCount: daily.costGoldCount
        });
    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_SUMMON_TAKE
            });
            return;
        };
    });
};

/**
 * 抽取10次接口
 */
Handler.prototype.takeTen = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var type = parseInt(msg.type) || 0;
    var takeNum = 10;
    var daily = {}, player = {}, heros = [],
        costNum = 0, costItem = 0, remainFreeNum = 0, chargeNum = 10,
        costGold = 0, costMoney = 0;
    var goldExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Gold);
    var moneyExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Money);
    var itemExpend = ConfigCache.get.lotteryCost(consts.Enums.SummonType.Ticket);
    //过滤抽取表类型
    var filterType = type;
    var heroId;
    let addXp = 0;   //增长的xp
    var vipConfig;

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        daily = player.daily;
        vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);

        heroDao.isEnoughHeroBag([takeNum], player, playerId, areaId, cb);
    }, function (res, cb) {
        if (res.code !== consts.RES_CODE.SUC_OK) {
            next(null, res);
            return;
        }

        //判断足够的消耗品
        switch (type) {
            case consts.Enums.SummonType.Money:
                remainFreeNum = moneyExpend.freeNum >= daily.useMoneyFree ? moneyExpend.freeNum - daily.useMoneyFree : 0;
                chargeNum = takeNum - remainFreeNum;
                costMoney = Math.floor(moneyExpend.num * chargeNum * vipConfig.lotterymoney);
                addXp = moneyExpend.xp_num;
                if (player.money < costMoney) {
                    //免费次数用完且代币(勾玉)不足
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_SUMMON_NOT_MENOY
                    });
                    return;
                }
                costItem = moneyExpend.item;
                costNum = costMoney;
                //代币抽需要记录剩余抽到SSR的次数
                playerDao.setPlayer({
                    $inc: {
                        "daily.useMoneyFree": remainFreeNum,
                        money: -costMoney
                    }
                }, playerId, areaId, cb);
                return;
            case consts.Enums.SummonType.Gold:
                //金币扣10次的价格
                remainFreeNum = goldExpend.freeNum >= daily.useGoldFree ? goldExpend.freeNum - daily.useGoldFree : 0;
                //金币每抽一次价格会上涨 当前抽奖付费=初始付费*2的Goldusenum次方
                let costGoldCount = takeNum - remainFreeNum + daily.costGoldCount;
                costGold = goldExpend.num * Math.pow(2, costGoldCount);
                addXp = goldExpend.xp_num;
                if (player.gold < costGold) {
                    //免费次数用完且金币不足
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_SUMMON_NOT_GOLD
                    });
                    return;
                }
                costItem = goldExpend.item;
                costNum = costGold;
                playerDao.setPlayer({
                    $inc: {
                        "daily.costGoldCount": remainFreeNum,
                        gold: -costGold
                    }
                }, playerId, areaId, cb);
                return;
            case consts.Enums.SummonType.Ticket:
                //使用物品，延后一个处理
                costItem = itemExpend.item;
                costNum = itemExpend.num * takeNum;
                addXp = itemExpend.xp_num;
                bagDao.useItem(itemExpend.item, costNum, false, playerId, areaId, cb);
                break;
            default:
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_VOID_PARAM
                });
                return;
        }
    }, function (res, cb) {
        if (type === consts.Enums.SummonType.Ticket) {
            if (!res) {
                //奖券不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_SUMMON_NOT_TICKET
                });
                return;
            }

            utils.invokeCallback(cb, null, null);
        }
        utils.invokeCallback(cb, null, res);

    }, function (res, cb) {
        if (!!res) {
            player = res;
        }

        if (costMoney > 0) {
            let pushModel = new PushConsumeModel({
                serverID: areaId,     //areaId
                type: consts.Enums.consumeType.heroTake,
                accountID: playerId,
                number: costMoney,
                itemType: consts.Enums.consumeType.heroTake,
                price: Math.floor(moneyExpend.num * vipConfig.lotterymoney),
                itemCnt: chargeNum
            });

            pushDataToSdService.pushConsume(pushModel);
        }

        daily = player.daily;
        var hero;
        var hitSet = ConfigCache.getAll.heroLottery();
        var entityList = [];
        //抽取9次式神
        for (var i = 0; i < takeNum - 1; i++) {
            heroId = Formula.hitOneFromDict(hitSet, function (p) { return p.type === filterType; }).heroId;
            hero = ConfigCache.get.hero(heroId);
            heros.push({ heroId: heroId });

            entityList.push({ hero: hero });
        }
        //第10次抽SSR
        heroId = Formula.hitOneFromDict(hitSet, function (p) { return p.type === consts.Enums.SummonType.GouYu; }).heroId;
        hero = ConfigCache.get.hero(heroId);

        heros.push({ heroId: heroId, isfloored: true });
        entityList.push({ hero: hero });

        heroDao.createMany(entityList, player, playerId, areaId, cb);

    }, function (res, cb) {
        heros = heros.joinArray(res, (t) => {
            return { hid: t.toString() };
        });

        if (addXp > 0) {
            addXp = addXp * takeNum;
            playerDao.setPlayer({
                $inc: {
                    "daily.xp": addXp
                }
            }, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null, null);
        }
    }, function (res, cb) {
        if (!!res) {
            player = res;
            daily = player.daily;
        }

        if (costNum === 0) {
            utils.invokeCallback(cb, null);
            return;
        }

        let inc;
        if(type == consts.Enums.SummonType.Gold) {   
            let limit = ConfigCache.get.dailyTask(consts.Enums.dailyTaskType.DailyExtractGold).limit;
            limit > 10 ? inc = 10 : inc = limit;
            playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyExtractGold, inc, playerId, areaId); //每日完成一次金币抽奖的记录    
        }else if (type == consts.Enums.SummonType.Money || type == consts.Enums.SummonType.Ticket) {
            let limit = ConfigCache.get.dailyTask(consts.Enums.dailyTaskType.DailyExtractMoney).limit;
            limit > 10 ? inc = 10 : inc = limit;
            playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyExtractMoney, inc, playerId, areaId); //每日完成一次代币/奖券抽奖的记录
        }

        if (type === consts.Enums.SummonType.Ticket) {
            bagLog.write([{ id: costItem, num: -costNum }], 'HeroTakeTen', playerId, areaId, cb);
        } else {
            //增加日志记录
            var ops = {
                lv: player.lv,
                exp: player.exp,
                gold: player.gold,
                money: player.money,
                energy: player.energy,
                bean: player.bean,
                incGold: -costGold,
                incMoney: -costMoney
            };
            playerLog.write(ops, 'TakeHero', playerId, areaId, cb);
        }

    }, function (cb) {
        let maxXp = ConfigCache.getVar.const(consts.Keys.MAX_XP);
        let nowXp = (daily.xp || 0) > maxXp ? maxXp : daily.xp || 0;

        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            costItem: costItem,
            costNum: costNum,
            heros: heros,
            goldFree: goldExpend.freeNum,
            useGoldFree: daily.useGoldFree || 0,
            moneyFree: moneyExpend.freeNum,
            useMoneyFree: daily.useMoneyFree || 0,
            ssrRemain: daily.ssrRemain || 0,
            xpNum: nowXp,
        });
    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_SUMMON_TAKE
            });
            return;
        }
    });
};

/**
 * 据点抽奖
 */
Handler.prototype.pointLottery = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var pointid = msg.pointid * 1;
    var update = msg.update * 1 || 0;
    var items = [];
    var awarditems = [];
    var heros = [];
    var heroIds = [];
    let exp = 0, gold = 0, money = 0;
    var bFirstTime = false;
    var updateAward = ConfigCache.get.pointLotteryUpdateAward(pointid);
    var now = Date.now();
    var player;
    
    if(!updateAward){
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_INTEN
        });
        return;
    }
    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        pointLotteryDao.getByPointId(pointid, playerId, areaId, cb);
    }, function (res, cb) {
        if(!!res){
            playerRecord = res;
            var updateCfg = ConfigCache.get.pointLotteryUpdate(pointid * 100 + playerRecord.lv)
            if(!updateCfg){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_INTEN
                });
                return;
            }
            //重置cd
            if((now - playerRecord.lastTime) > updateCfg.cd * 1000){
                pointLotteryDao.upStatusByPointId(pointid, {
                    $set: {
                        times: 0,
                        lastTime: playerRecord.lastTime + Math.floor((now - playerRecord.lastTime)/updateCfg.cd/1000) * updateCfg.cd * 1000
                    }
                }, playerId, areaId)
            }else{
                if(updateCfg.times == playerRecord.times){
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_POINTLOTTERY_TIMELIMIT
                    });
                    return;
                }
            }
            //随机奖励
            var hitSet = ConfigCache.getAll.pointLotteryRandomAward();
            var hitRecord = Formula.hitOneFromDict(hitSet, function (p) { return p.pointid === pointid; }, true);
            heros = hitRecord.heros;
            items = hitRecord.items;
            //充值升级奖励
            if(playerRecord.firstRechargeStatus > 0 && playerRecord.allTimes == 0){
                items = []
                heros = updateAward.heros;
            }
            //放弃或者没有选还是第一次随机的奖励，只有点放弃了才能进行下一次
            if(update == 1 || (playerRecord.firstRechargeStatus == 0 && playerRecord.allTimes == 0 && update == 0 && (playerRecord.items.length > 0 || playerRecord.heros.length > 0))){
                items = playerRecord.items;
                heros = playerRecord.heros;
            }
            
            
            for (let i = 0; i < heros.length; i++) {
                let hero = heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            //出现选择界面没有选或者返回主界面还是第一次随机到的奖励
            if(update == 0 && playerRecord.allTimes == 0 && playerRecord.firstRechargeStatus == 0) {
                if(playerRecord.items.length == 0 && playerRecord.heros.length == 0){
                    let setter = {
                        $set: {
                            items: items,
                            heros: heros
                        }
                    }
                    pointLotteryDao.upStatusByPointId(pointid, setter, playerId, areaId)
                }
                
                next(null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    items: items,
                    heros: heros,
                    firsttime: true
                });
                return
            }
            let itemMap = new ItemBuilder(items, ConfigCache.items());
            exp += itemMap.getExp();
            gold += itemMap.getGold();
            money += itemMap.getMoney();
            awarditems = itemMap.getItem();

            if (awarditems.length > 0) {
                bagDao.isEnoughItemsBag(awarditems, player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                });
            }
        }else{
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_INTEN
            });
            return;
        }
    }, function (res, cb) {
        if (res.code !== consts.RES_CODE.SUC_OK) {
            next(null, res);
            return;
        }

        if (heroIds.length > 0) {
            heroDao.isEnoughHeroBag([heroIds.length], player, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null, {
                code: consts.RES_CODE.SUC_OK,
                msg: ''
            });
        }
    }, function (res, cb) {
        if (res.code !== consts.RES_CODE.SUC_OK) {
            next(null, res);
            return;
        }
        let setter = {
            $inc: {
                times: 1,
                allTimes: 1,
            },
            $set: {
                items: items,
                heros: heros
            }
        }
        pointLotteryDao.upStatusByPointId(pointid, setter, playerId, areaId)

        if (gold > 0 || exp > 0 || money > 0) {
            playerDao.setPlayer({
                $inc: {
                    gold: gold,
                    exp: exp,
                }
            }, playerId, areaId, cb);
        }else {
            utils.invokeCallback(cb, null,  null);
        }
    }, function (res,cb) {
        if(!!res){
            player = res;
        }
        if (!!awarditems && awarditems.length > 0) {
            bagDao.createOrIncBag(awarditems, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null, null);
        }
    }, function (res, cb) {
        if (!!heroIds && heroIds.length > 0) {
            let creHeros = heroIds.select((t) => {
                return { hero: { id: t } };
            });

            heroDao.createMany(creHeros, player, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null, []);
        }
    }, function (res, cb) {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            items: items,
            heros: heros,
            firsttime: false
        });
    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};

/**
 * 据点抽奖升级
 */
Handler.prototype.pointLotteryUpdate = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var pointid = msg.pointid * 1;
    
    var items,itemId,num;
    var bagItemNum = 0;
    
    
    async.waterfall([function (cb) {
       pointLotteryDao.getByPointId(pointid, playerId, areaId, cb);
    }, function (res, cb) {
        if(!!res){
            var lv = res.lv;
            var updateCfg = ConfigCache.get.pointLotteryUpdate(pointid * 100 + lv);
            if(!updateCfg){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_INTEN
                });
                return;
            }
            
            items = updateCfg.items;
            if(items.length == 0){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_POINTLOTTERY_UPDATELIMIT
                });
                return;
            }

            itemId = items[0].id;
            num = items[0].num;
            bagDao.getByItemId(itemId, playerId, areaId, cb);
        }else{
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_INTEN
            });
            return;
        }
    }, function (res, cb) {
        if (res && res.length > 0) {
            res.forEach(function (el) {
                bagItemNum += el.num;
            }, this);
        }

        if (bagItemNum >= num) {
            bagDao.useItem(itemId, num, false, playerId, areaId, cb);
        }else{
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_POINTLOTTERY_UPDATEITEMSLIMIT
            });
            return;
        }
    }, function (res, cb) {
        if (!res) {
            //材料不足
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_POINTLOTTERY_UPDATEITEMSLIMIT
            });
            return;
        }else{
            pointLotteryDao.upStatusByPointId(pointid, {
                $inc: {
                    lv: 1
                }
            }, playerId, areaId,cb)
        }
    },function (res,cb) {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
        });
    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};
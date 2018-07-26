var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
var playerDao = require('../../../dao/playerDao');
var playerDailyTaskDao = require('../../../dao/playerDailyTaskDao');
var heroDao = require('../../../dao/heroDao');
var illustratedDao = require('../../../dao/illustratedDao');
var bagDao = require('../../../dao/bagDao');
var lineupDao = require('../../../dao/lineupDao');
const playerTaskDao = require('../../../dao/playerTaskDao');
const pointAwardDao = require('../../../dao/pointAwardDao');
var ConfigCache = require('../../../cache/configCache');
var BattleBuilder = require('../../../cache/battleBuilder');
var ItemBuilder = require('../../../cache/itemBuilder');
var playerLog = require('../../../dao/log/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var Formula = require('../../../util/formula');
var logger = require('pomelo-logger').getLogger(__filename);
const Response = require('../../../domain/entity/response');
const Lineup = require('../../../domain/entity/lineup');
const rechargeDao = require('../../../dao/rechargeDao');
const bossCombatDao = require('../../../dao/bossCombatDao');
const signAwardDao = require('../../../dao/signAwardDao');
const illAchDao = require('../../../dao/illAchDao');
const firstOnlineAwardDao = require('../../../dao/firstOnlineAwardDao');
const lifeLikeDao = require('../../../dao/lifeLikeDao');
var pointLotteryDao = require('../../../dao/pointLotteryDao');
var PushConsumeModel = require('../../../domain/entity/pushConsumeModel');
var pushDataToSdService = require('../../../services/pushDataToSdService');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 战斗计算
 */
Handler.prototype.combat = function (msg, session, next) {
    var self = this;
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var bossTime = session.get('bossTime') || 0;
    bossTime = (Date.now() - bossTime) / 1000; //second

    var bossId = 0;
    var player = {};
    var checkpoint = {};
    var nextpointId = 0;
    let nextPointNum = 0;
    var itemMap = {};
    var itemArray = [];
    var incGold = 0, incExp = 0;
    var costEnergy = 0;
    var heros, lineups, illustrateds, nextpoint, now, roleCost, power, illAch, lifeLikeProbs;
    var combatResult = {};
    let addLin = 0; //添加的式神阵位数量
    var vipConfig;

    var thisLucTime = 0, lucreUpTime = 0; //本次收益时间、收益更新时间

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);

    }, function (res, cb) {
        //检查约束条件
        player = res;
        checkpoint = ConfigCache.get.checkpoint(player.nowStage);//获取当前关卡信息

        if (!checkpoint) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NO_FOUND_BOSS
            });
            return;
        }
        
        roleCost = ConfigCache.getAll.roleCost();
        vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);
        costEnergy = checkpoint.amount;
        bossId = checkpoint.bossId;

        
        //todo: remark
        // if (checkpoint.minTime > bossTime) {
        //     next(null, {
        //         code: consts.RES_CODE.ERR_FAIL,
        //         msg: consts.RES_MSG.ERR_BOSS_TIME
        //     });
        //     return;
        // }

        //下个关卡不存在,当前关卡已经是最大关卡
        nextPointNum = checkpoint.id + 1;
        nextpoint = ConfigCache.get.checkpoint(nextPointNum);
        if (!nextpoint) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NO_FOUND_BOSS
            });
            return;
        }

        //体力
        if (costEnergy > player.energy) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NO_ENERGY
            });
            return;
        }
        //boss挑战重新开始计时
        session.set('bossTime', Date.now());
        session.pushAll(cb);

    }, function (cb) {
        //获取玩家的阵位
        lineupDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        lineups = res;
        //获取玩家的出战式神
        heroDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        heros = res;

        illustratedDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        illustrateds = res;

        lifeLikeDao.getTotalByPlayerId(playerId, areaId, cb);
    }, function (res, cb) {
        lifeLikeProbs = res;
        illAchDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        illAch = res;

        //提交给另一进程处理战斗计算
        var playerBattle = BattleBuilder.builPlayer(player, heros, lineups, illustrateds, lifeLikeProbs, illAch);
        var monsterBattle = { tid: checkpoint.bossId };
        power = player.power;

        self.app.rpc.combat.checkpointRemote.execute(session,
            playerBattle,
            monsterBattle,
            function (err, res) {
                if (!!err) {
                    logger.error('player:%d, checkpoind:%d combat error! %s', playerId, checkpoint.bossId, err.stack);
                }
                utils.invokeCallback(cb, err, res);
            });

    }, function (res, cb) {
        combatResult = res;
        //TODO: LoadTest
        // if (!combatResult || !combatResult.res) {
        //     //失败扣除体力
        //     player.energy -= costEnergy;
        //     playerDao.setPlayer({
        //         $inc: {
        //             energy: -costEnergy
        //         }
        //     }, playerId, areaId, cb);
        //     return;
        // }
        utils.invokeCallback(cb, null, null);
    }, function (res, cb) {
        let inc = consts.Enums.DailyMinInc;
        playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyCombat, inc, playerId, areaId); //每日战斗完成一次的记录
        if (!combatResult || !combatResult.res) {
            //增加日志记录
            var ops = {
                lv: player.lv,
                exp: player.exp,
                gold: player.gold,
                money: player.money,
                energy: player.energy,
                bean: player.bean,
                incEnergy: -costEnergy
            };
            playerLog.write(ops, 'Checkpoint', playerId, areaId, cb);
            return;
        }
        utils.invokeCallback(cb, null);

    }, function (cb) {

        if (!combatResult) {
            //挑战失败
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BOSS_COMBAT
            });
            return;
        }
        if (!combatResult.res) {
            //挑战失败
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                checkpointId: checkpoint.checkpointId,
                gold: player.gold,
                lv: player.lv,
                exp: player.exp,
                energy: player.energy,
                items: [],
                combat: combatResult
            });
            return;
        }
        utils.invokeCallback(cb, null);

    }, function (cb) {
        //增加BOSS通关金币与经验奖励
        itemMap = new ItemBuilder(checkpoint.items, ConfigCache.items());
        incGold = itemMap.getGold();
        incExp = itemMap.getExp();

        //挑战成功后，金币增长率会变化，需要结算一次挂机收益
        var time = player.lastStage > 0 && player.lastStage > player.lastLogin ? player.lastStage : player.lastLogin;
        now = Date.now();

        var maxLucreTime = Formula.getMaxLucreTime(player, now).maxLucreTime;

        //增加在线挂机奖励
        Formula.settleOnlineBoss(now, time, maxLucreTime, checkpoint.exp, checkpoint.gold, vipConfig, function (exp, gold, lucTime) {
            incExp += exp;
            incGold += gold;
            lucreUpTime = incExp > 0 ? now : player.lucreUpTime;
            //上次收益不是今天,扣除之前的收益时间
            thisLucTime = utils.isSameDate(player.lucreUpTime, now) ? lucTime : (lucTime - player.lucreTime || 0);
            var roleLv = player.lv;
        });

        let maxStage = player.maxStage;
        if (nextPointNum > player.maxStage) {
            //变更最大关卡数
            maxStage = nextPointNum;

            //变更最大关卡后,获取本次开启的式神阵位数量.
            let remLin = (ConfigCache.getVar.const(consts.Keys.HERO_LINEUP_EXT_MAX) - player.maxHeroLineup);
            addLin = (checkpoint.addLineup || 0);
            addLin = addLin > remLin ? remLin : addLin;
        }

        playerDao.setPlayer({
            $set: {
                power: power,
                maxStage: maxStage,//更新最大关卡
                nowStage: nextPointNum,//更新当前关卡关卡
                expRise: nextpoint.exp,
                goldRise: nextpoint.gold,
                lastStage: now,  //更新在线结算时间点
                lucreUpTime: lucreUpTime
            },
            $inc: {
                gold: incGold,
                energy: -costEnergy,
                lucreTime: thisLucTime,
                maxHeroLineup: addLin,
                exp: incExp
            }
        }, playerId, areaId, cb);
    }, function (res, cb) {
        player = res;

        if (addLin > 0) {
            let lins = [];
            for (let i = (addLin - 1); i >= 0; i--) {
                lins.push(new Lineup({ pos: (player.maxHeroLineup - i) }));
            }
            //添加式神阵位
            lineupDao.createMany(lins, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null);
        }
    }, function (cb) {
        //更新任务
        playerTaskDao.upTask(playerId, areaId, cb);
    }, function (res, cb) {
        //增加物品
        itemArray = itemMap.getItem();
        bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
    }, function (cb) {
        //增加日志记录
        var ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incExp: incExp,
            incGold: incGold,
            incMoney: 0,
            incEnergy: 0
        };
        playerLog.write(ops, 'Checkpoint', playerId, areaId, cb);

    }, function (cb) {
        //增加日志记录
        bagLog.write(itemArray, 'Checkpoint', playerId, areaId, cb);
    }, function (cb) {
        //每到第九关通关开启关卡抽奖
        if (nextpoint.checkpointId % 10 == 0) {
            let pointLottery = {
                pointId: nextpoint.checkpointId,
            }
            pointLotteryDao.create(pointLottery, playerId, areaId, cb);
        } else {
            utils.invokeCallback(cb, null);
        }
    }, function (cb) {
        var items = [];
        checkpoint.items.forEach(function (el) {
            items.push({
                id: el.id,
                type: el.type,
                num: el.num
            });
        }, this);
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            checkpointId: nextpoint.checkpointId,
            gold: player.gold,
            lv: player.lv,
            exp: player.exp,
            energy: player.energy,
            items: items,
            combat: combatResult
        });
    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BOSS_COMBAT
            });
            return;
        }
    });
};

/**
 * 战斗计算
 */
Handler.prototype.bossCombat = function (msg, session, next) {
    var self = this;
    var stageId = msg.stageId * 1;
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');

    var bossId = 0;
    var player = {};
    var bossCombatRecord = {};
    var checkpoint = {};
    var nextpointId = 0;
    let nextPointNum = 0;
    var itemMap = {};
    var itemArray = [];
    var incGold = 0, incExp = 0;
    var costEnergy = 0;
    var heros, lineups, illustrateds, nextpoint, now, roleCost, power, illAch, lifeLikeProbs;
    var combatResult = {};
    let addLin = 0; //添加的式神阵位数量
    let hasRecord = false;
    let heroIds = [];
    let vipConfig;

    var thisLucTime = 0, lucreUpTime = 0; //本次收益时间、收益更新时间

    async.waterfall([function (cb) {
        bossCombatDao.getByPlayerIdAndStageID(playerId, stageId, areaId, cb);

    }, function (res, cb) {
        bossCombatRecord = res;
        if (!!bossCombatRecord) {
            let now = Date.now();
            if (utils.isSameDate(now, bossCombatRecord.createTime)) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_BOSSCOMBAT_OVERFLOW
                });
                return;
            }
            hasRecord = true;
        }
        playerDao.getPlayer(playerId, areaId, cb);

    }, function (res, cb) {
        //检查约束条件
        player = res;
        let maxCp = ConfigCache.get.checkpoint(player.maxStage);
        let maxCheckpointId = maxCp.checkpointId;   //挑战过的最大关卡ID
        bossCombatAward = ConfigCache.get.bossCombat(stageId);//获取当前关卡信息
        bossId = bossCombatAward.monsterId;

        if (bossCombatAward.pointId > maxCheckpointId - 1) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BOSSCOMBAT_LIMIT
            });
            return;
        }

        if (!bossCombatAward) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NO_FOUND_BOSS
            });
            return;
        }


        //获取玩家的阵位
        lineupDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        lineups = res;
        //获取玩家的出战式神
        heroDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        heros = res;

        illustratedDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        illustrateds = res;

        lifeLikeDao.getTotalByPlayerId(playerId, areaId, cb);
    }, function (res, cb) {
        lifeLikeProbs = res;
        illAchDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        illAch = res;

        //提交给另一进程处理战斗计算
        var playerBattle = BattleBuilder.builPlayer(player, heros, lineups, illustrateds, lifeLikeProbs, illAch);
        var monsterBattle = { tid: bossId };
        power = player.power;

        self.app.rpc.combat.checkpointRemote.execute(session,
            playerBattle,
            monsterBattle,
            function (err, res) {
                if (!!err) {
                    logger.error('player:%d, checkpoind:%d bosscombat error! %s', playerId, bossId, err.stack);
                }
                utils.invokeCallback(cb, err, res);
            });

    }, function (res, cb) {
        combatResult = res;
        if (!combatResult && !hasRecord) {
            //挑战失败
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BOSS_COMBAT
            });
            return;
        }
        if (!combatResult.res && !hasRecord) {
            //挑战失败
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                status: hasRecord ? 1 : 0,
                items: [],
                heros: [],
                combat: combatResult
            });
            return;
        }
        utils.invokeCallback(cb, null);

    }, function (cb) {
        if (!!hasRecord) {
            //修改状态
            bossCombatDao.set(playerId, stageId, areaId, cb);
            vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);
            bossCombatAward.items.select((t) => {
                t.num = t.num + vipConfig.bosscombat;
            });
        }
        else {
            //添加记录
            bossCombatDao.create({ stageId: stageId }, playerId, areaId, cb);
        }
    }, function (cb) {
        itemMap = new ItemBuilder(bossCombatAward.items, ConfigCache.items());
        itemArray = itemMap.getItem();
        heroIds = bossCombatAward.heroIds;
        if (!!hasRecord) {
            bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
        } else {
            if (!!heroIds && heroIds.length > 0 && !hasRecord) {
                let creHeros = heroIds.select((t) => {
                    return { hero: { id: t } };
                });

                heroDao.createMany(creHeros, player, playerId, areaId, cb);
            } else {
                utils.invokeCallback(cb, null, []);
            }

        }
    }, function (cb) {
        Response({
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            status: hasRecord ? 1 : 0,
            items: bossCombatAward.items,
            heros: bossCombatAward.heros,
            combat: combatResult
        }, next);
    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BOSS_COMBAT
            });
            return;
        }
    });
};

/**
 * 在线挂机系统自动抽奖
 */
Handler.prototype.extract = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var autoExtractTime = session.get('autoExtractTime') || 0;
    var now = Date.now();
    extractTime = (now - autoExtractTime) / 1000; //second
    var bagItems, player, checkpoint, costEnergy;
    var incGold = 0, incExp = 0, incEnergy = 0;
    let dropNum = 0;    //掉落福袋的数量
    var vipConfig;
    var isSign = 0, hasNewIllAch = 0;
    let signperiod = ConfigCache.getVar.const(consts.Keys.SIGN_PERIOD);
    let cfgs = ConfigCache.getAll.illAch();
    let firDayAwards, sevendayAwards;

    var thisLucTime = 0, lucreUpTime = 0, maxLucreTime = -1; //本次收益时间、收益更新时间、最大收益时间

    let extractSec = consts.Vars.CHECKPOINT_EXTRACT_INTERVAL;   //抽奖间隔秒数
    let extractMil = extractSec * 1000;    //抽奖间隔毫秒数
    if (extractTime < extractSec) {
        Response({
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_EXTRACT_NOT_TIME,
            extractTime: (autoExtractTime + extractMil)
        }, next);
        return;
    }

    async.waterfall([function (cb) {
        illustratedDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        illustrateds = res;
        //获取玩家图鉴成就状态
        illAchDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        illAchs = res;

        let illIdStr = `,${(illustrateds.select(t => { return t.heroId; })).toString()},`;

        for (var i in cfgs) {
            let cfg = cfgs[i];
            let achId = cfg.id;
            let illAch = illAchs.firstOrDefault((t) => { return achId == t.achId; });
            if (!illAch) {
                let hasHero = true;
                for (let j = 0; j < cfg.needHeroIds.length; j++) {
                    hasHero = illIdStr.includes(`,${cfg.needHeroIds[j]},`);
                    if (!hasHero) {
                        break;
                    }
                }

                if (!!hasHero) {
                    hasNewIllAch = 1;
                }
            } else {
                if (illAch.status != consts.Enums.getStatus.Alr) {
                    hasNewIllAch = 1;
                }
            }
        }
        utils.invokeCallback(cb, null);
    }, function (cb) {
        signAwardDao.getByPlayerId(playerId, areaId, cb);
    }, function (res, cb) {
        let playerAwas = res;
        if (!!playerAwas) {
            if (utils.isSameDate(playerAwas.createTime, Date.now()) !== true) {
                isSign = 1;
            } else {
                isSign = playerAwas.status % signperiod == 0 ? 1 : 0
            }
        } else {
            isSign = 1;
        }
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        checkpoint = ConfigCache.get.checkpoint(player.nowStage);
        if (!checkpoint) {
            //若未找到关卡配置，则已经达到末尾关卡了
            checkpoint = ConfigCache.get.checkpoint(player.nowStage - 1);
            if (!checkpoint) {
                checkpoint = ConfigCache.checkpoint.get(consts.Vars.CHECK_POINT_MIN);
            }
        }

        var time = player.lastStage > 0 && player.lastStage > player.lastLogin ? player.lastStage : player.lastLogin;

        maxLucreTime = Formula.getMaxLucreTime(player, now).maxLucreTime;
        vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);

        //增加在线挂机奖励
        Formula.settleOnlineBoss(now, time, maxLucreTime, checkpoint.exp, checkpoint.gold, vipConfig, function (exp, gold, lucTime) {
            incExp += exp;
            incGold += gold;
            lucreUpTime = incExp > 0 ? now : player.lucreUpTime;
            //上次收益不是今天,扣除之前的收益时间
            thisLucTime = utils.isSameDate(player.lucreUpTime, now) ? lucTime : (lucTime - player.lucreTime || 0);
            var roleLv = player.lv;

            if (!!ConfigCache.get.item(checkpoint.dropItem || 0)) {
                dropNum = Formula.getDropItemNum((lucTime / 1000), checkpoint);
            }
        });

        //结算体力
        Formula.settleRecoverEnergy(now, player.lastEnergy, player.energy, function (inc) {
            incEnergy = inc;
        });

        if (dropNum > 0) {
            var bagItem = ConfigCache.getItem.item(checkpoint.dropItem || 0, dropNum);
            var itemMap = new ItemBuilder([bagItem], ConfigCache.items());
            bagItems = itemMap.getItem();

            bagDao.isEnoughItemsBag(bagItems, player, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null, {
                code: consts.RES_CODE.ERR_FAIL
            });
        }
    },
    function (res, cb) {
        if (res.code != consts.RES_CODE.SUC_OK) {
            //不需要添加物品,或者背包满了
            bagItems = [];
            utils.invokeCallback(cb, null);
        }
        else {
            bagDao.createOrIncBag(bagItems, playerId, areaId, function () {
                bagLog.write(bagItems, 'BossExtract', playerId, areaId, cb);
            });
        }
    },
    function (cb) {
        playerDao.setPlayer({
            $set: {
                lastEnergy: now,
                lastStage: now, //更新在线结算时间点
                lucreUpTime: lucreUpTime
            },
            $inc: {
                gold: incGold,
                energy: incEnergy,
                lucreTime: thisLucTime,
                exp: incExp,
                firstDayOnLineTime: autoExtractTime == 0 ? 0 : extractSec
            }
        }, playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        //重新开始计时
        session.set('autoExtractTime', now);
        session.pushAll(cb);
    }, function (cb) {
        //增加日志记录
        var ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incExp: incExp,
            incGold: incGold,
            incMoney: 0,
            incEnergy: incEnergy
        };
        playerLog.write(ops, 'Checkpoint', playerId, areaId, cb);
    }, function (cb) {
        firstOnlineAwardDao.getByPlayerId(playerId, consts.Enums.dayType.FirstDay, areaId, cb);
    }, function (res, cb) {
        firDayAwards = res;
        firstOnlineAwardDao.getByPlayerId(playerId, consts.Enums.dayType.SevenDay, areaId, cb);
    }, function (res, cb) {
        sevendayAwards = res;
        let cfgs = ConfigCache.getAll.firstOnlineAward();
        if (now < (utils.getZeroHour(player.firstLogin) + 86400000)) {
            let cfgArr = [];
            arrayUtil.dictionaryToArray(cfgs).select((t) => {
                if (t.type == consts.Enums.dayType.FirstDay) {
                    cfgArr.push(t);
                }
            });

            cfgArr.select((t) => {
                let nowawa = firDayAwards.firstOrDefault(j => j.typeid == t.typeid);
                if (!nowawa) {
                    if (player.firstDayOnLineTime >= t.time) {
                        firstOnlineAwardDao.create({ typeid: t.typeid, type: t.type, status: consts.Enums.getStatus.Can }, playerId, areaId)
                    }
                }
            });
        }

        if (now < (utils.getZeroHour(player.firstLogin) + consts.Enums.SevenDayLastDay * 86400000)) {
            let cfgArr = [];
            arrayUtil.dictionaryToArray(cfgs).select((t) => {
                if (t.type == consts.Enums.dayType.SevenDay) {
                    cfgArr.push(t);
                }
            });

            cfgArr.select((t) => {
                let nowawa = sevendayAwards.firstOrDefault(j => j.typeid == t.typeid);
                if (!nowawa) {
                    if (utils.isSameDate((player.firstLogin + (t.time - 1) * 86400000), now)) {
                        firstOnlineAwardDao.create({ typeid: t.typeid, type: t.type, status: consts.Enums.getStatus.Can }, playerId, areaId)
                    }
                }
            });
        }
        var items = bagItems.select(t => {
            return { id: t.id, type: t.type, num: t.num };
        });

        Response({
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            gold: player.gold,
            lv: player.lv,
            exp: player.exp,
            energy: player.energy,
            items: items,
            indulge: (maxLucreTime > -1 && thisLucTime === 0),
            extractTime: (now + extractMil),
            isSign: isSign,
            hasNewIllAch: hasNewIllAch,
            hasNewMail: player.hasNewMail
        }, next);
    }], function (err) {
        Response({
            code: consts.RES_CODE.ERR_FAIL,
            msg: ''
        }, next);
    });

};

/**
 * 离线挂机收益翻倍
 */
Handler.prototype.offlineTimes = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let checkpoint, player;
    let offRec, items = [];
    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;
            offRec = player.offEarRec;
            if (!!offRec.isTimes) {
                Response({
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HAVE_RECEIVED
                }, next);
                return;
            }

            let money = ConfigCache.getVar.const(consts.Keys.OFFLINE_TIMES_PRICE);
            if (player.money < money) {
                Response({
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                }, next);
                return;
            }

            playerDao.setPlayer({
                $set: {
                    "offEarRec.isTimes": true
                },
                $inc: {
                    exp: offRec.exp,
                    gold: offRec.gold,
                    money: -money
                }
            }, playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;
            items = offRec.items;
            bagDao.isEnoughItemsBag(items, player, playerId, areaId, cb);
        },
        (res, cb) => {
            if (res.code != consts.RES_CODE.SUC_OK) {
                //背包满了
                items = [];
                utils.invokeCallback(cb, null);
            }
            else {
                bagDao.createOrIncBag(items, playerId, areaId, function () {
                    bagLog.write(items, 'offlineTimes', playerId, areaId, cb);
                });
            }
        },
        (cb) => {
            let reItems = player.offEarRec.items.select(t => {
                return { id: t.id, type: t.type, num: t.num };
            });

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                gold: player.gold,
                exp: player.exp,
                items: reItems
            }, next);
        }], (err) => {
            Response({
                code: consts.RES_CODE.ERR_FAIL,
                msg: ''
            }, next);
        });
};

/**
 * 补充体力
 */
Handler.prototype.buyenergy = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player, costMoney;
    var incEnergy = msg.num || 10;
    var price = 0;
    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);

    }, function (res, cb) {
        player = res;
        price = ConfigCache.const.getVar(consts.Keys.ENERGY_PRICE);
        costMoney = incEnergy * price;
        if (player.money < costMoney) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NOT_MENOY
            });
            return;
        }

        playerDao.setPlayer({
            $inc: {
                energy: incEnergy,
                money: -costMoney
            }
        }, playerId, areaId, cb);

    }, function (res, cb) {
        player = res;

        if (costMoney > 0) {
            let pushModel = new PushConsumeModel({
                serverID: areaId,     //areaId
                type: consts.Enums.consumeType.buyenergy,
                accountID: playerId,
                number: costMoney,
                itemType: consts.Enums.consumeType.buyenergy,
                price: price,
                itemCnt: incEnergy
            });

            pushDataToSdService.pushConsume(pushModel);
        }

        //增加日志记录
        var ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incMoney: -costMoney,
            incEnergy: incEnergy
        };
        playerLog.write(ops, 'Checkpoint', playerId, areaId, cb);

    }, function (cb) {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            money: player.money,
            energy: player.energy
        });
        return;

    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_BUY_ENERGY
        });
    });
};

/**
 * 选择关卡
 */
Handler.prototype.selected = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let selId = msg.checkpointId * 1;   //选择的关卡ID
    let player = {}, incExp = 0, incGold = 0;
    let thisLucTime = 0, lucreUpTime = 0;
    let vipConfig;

    let cfgs = ConfigCache.getAll.checkpoint();

    let checkpoint = arrayUtil.dictionaryFirstOrDefault(cfgs, (t) => {
        return t.checkpointId == selId;
    });

    if (!checkpoint) {
        //无选择的关卡
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_INTEN
        });
        return;
    }

    async.waterfall([(cb) => {
        playerDao.getPlayer(playerId, areaId, cb);
    }, (res, cb) => {
        player = res;

        if (player.maxStage < checkpoint.id) {
            //选择的关卡未挑战过
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_POINT_MAX
            });
            return;
        }

        if (player.nowStage == checkpoint.id) {
            //选择的关卡未当前的关卡
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_POINT_NOW
            });
            return;
        }

        //挑战成功后，金币增长率会变化，需要结算一次挂机收益
        let time = player.lastStage > 0 && player.lastStage > player.lastLogin ? player.lastStage : player.lastLogin;
        now = Date.now();

        let maxLucreTime = Formula.getMaxLucreTime(player, now).maxLucreTime;
        vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);
        //增加在线挂机奖励
        Formula.settleOnlineBoss(now, time, maxLucreTime, checkpoint.exp, checkpoint.gold, vipConfig, function (exp, gold, lucTime) {
            incExp += exp;
            incGold += gold;
            lucreUpTime = incExp > 0 ? now : player.lucreUpTime;
            //上次收益不是今天,扣除之前的收益时间
            thisLucTime = utils.isSameDate(player.lucreUpTime, now) ? lucTime : (lucTime - player.lucreTime || 0);
        });

        playerDao.setPlayer({
            $set: {
                nowStage: checkpoint.id,//当前关卡
                expRise: checkpoint.exp,
                goldRise: checkpoint.gold,
                lastStage: now,  //更新在线结算时间点
                lucreUpTime: lucreUpTime
            },
            $inc: {
                gold: incGold,
                lucreTime: thisLucTime,
                exp: incExp,
            }
        }, playerId, areaId, cb);
    }, (res, cb) => {
        player = res;
        //增加日志记录
        let ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incExp: incExp,
            incGold: incGold,
            incMoney: 0,
            incEnergy: 0
        };
        playerLog.write(ops, 'Checkpoint', playerId, areaId, cb);
    }, (cb) => {
        let items = checkpoint.items.select((el) => { return { id: el.id, type: el.type, num: el.num }; });

        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            gold: player.gold,
            lv: player.lv,
            exp: player.exp,
            items: items
        });
    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_BUY_ENERGY
        });
    });
};

/**
 * 查看关卡奖励列表
 */
Handler.prototype.findAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let player, playerAwas, recharge;
    //获取所有关卡奖励配置
    let cfgs = ConfigCache.getAll.pointAward();
    let bossCombatRecords;
    let isCanCombat;

    if (!cfgs) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
        });
        return;
    }

    let cfgArr = arrayUtil.dictionaryToArray(cfgs);

    async.waterfall([
        (cb) => {
            bossCombatDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            bossCombatRecords = res;
            rechargeDao.get(playerId, areaId, cb);
        },
        (res, cb) => {
            recharge = res;
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;

            pointAwardDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwas = res || [];

            let awards = cfgArr.select((t) => {
                let nowawa = playerAwas.firstOrDefault(j => j.awardId == t.id);
                let status = consts.Enums.getStatus.Not;
                let oncestatus = consts.Enums.getStatus.Not;
                let rechargestatus = recharge.onceStatus;
                let pointCfg = ConfigCache.get.checkpoint(t.point);
                if (!!nowawa) {
                    status = nowawa.status;
                    oncestatus = nowawa.onceStatus;
                }
                else if (t.point < player.maxStage) {
                    status = consts.Enums.getStatus.Can;
                    if (rechargestatus == 1) {
                        oncestatus = consts.Enums.getStatus.Can;
                    }
                }

                if (t.point < player.maxStage) {
                    let bossCombatRecord = bossCombatDao.getBossCombatRecord(bossCombatRecords, t.stageid)
                    if (!bossCombatRecord) {
                        isCanCombat = consts.Enums.getStatus.Can;
                    } else {
                        if (utils.isSameDate(Date.now(), bossCombatRecord.createTime) == false) {
                            isCanCombat = consts.Enums.getStatus.Can;
                        } else {
                            isCanCombat = consts.Enums.getStatus.Alr;
                        }
                    }
                } else {
                    isCanCombat = consts.Enums.getStatus.Not;
                }

                return { id: t.id, pointId: pointCfg.checkpointId, point: t.point, status: status, items: t.items, heros: t.heros, oncestatus: oncestatus, onceitems: t.onceitems, isCanCombat: isCanCombat };
            });

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                awards: awards,
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};

/**
 * 领取关卡奖励
 */
Handler.prototype.getAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let awaId = 1 * msg.awaId;
    let player, playerAwa, recharge;
    let hasRecord = false;  //有领奖记录
    let exp = 0, gold = 0, money = 0, items = [], heroIds = [];
    let oncestatus;

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
        (res, cb) => {
            recharge = res;
            if (!!recharge) {
                oncestatus = recharge.onceStatus > 0 ? consts.Enums.getStatus.Can : consts.Enums.getStatus.Not;
            } else {
                oncestatus = consts.Enums.getStatus.Not
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
                if (playerAwa.status != consts.Enums.getStatus.Can) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_AWARD
                    });
                    return;
                }

                hasRecord = true;
            }
            else {
                if(cfg === 'undefined')
                {
                    //未达通过关卡
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                    });
                    return;
                }
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

            let itemMap = new ItemBuilder(cfg.items, ConfigCache.items());
            exp += itemMap.getExp();
            gold += itemMap.getGold();
            money += itemMap.getMoney();
            items = itemMap.getItem();

            heroIds = cfg.heroIds;

            if (items.length > 0) {
                bagDao.isEnoughItemsBag(items, player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                });
            }
        },
        (res, cb) => {
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
        },
        (res, cb) => {
            if (res.code !== consts.RES_CODE.SUC_OK) {
                next(null, res);
                return;
            }

            if (!!hasRecord) {
                //修改状态
                pointAwardDao.upStatusByAwaId(awaId, consts.Enums.getStatus.Alr, playerId, areaId, cb);
            }
            else {
                //添加记录
                pointAwardDao.create({ awardId: awaId, status: consts.Enums.getStatus.Alr, onceStatus: oncestatus }, playerId, areaId, cb);
            }
        },
        (cb) => {
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
                utils.invokeCallback(cb, null, null);
            }
        },
        (res, cb) => {
            if (!!res) {
                player = res;
            }

            if (!!items && items.length > 0) {
                bagDao.createOrIncBag(items, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null);
            }
        },
        (cb) => {
            if (!!heroIds && heroIds.length > 0) {
                let creHeros = heroIds.select((t) => {
                    return { hero: { id: t } };
                });

                heroDao.createMany(creHeros, player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, []);
            }
        },
        (res, cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                items: cfg.items,
                heros: cfg.heros
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};


/**
 * 领取一次性充值25元的额外通关奖励
 */
Handler.prototype.getOnceAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let awaId = 1 * msg.awaId;
    let player, playerAwa, recharge;
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
        (res, cb) => {
            recharge = res;
            if (!!recharge) {
                if (recharge.onceStatus == 0) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_ONCE_RECHARGE
                    });
                    return;
                }
            } else {
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
                if (playerAwa.onceStatus != consts.Enums.getStatus.Can) {
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
                pointAwardDao.upOnceStatusByAwaId(awaId, consts.Enums.getStatus.Alr, playerId, areaId, cb);
            }
            else {
                //添加记录
                pointAwardDao.create({ awardId: awaId, onceStatus: consts.Enums.getStatus.Alr }, playerId, areaId, cb);
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
                items: cfg.onceitems
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        })
};
var consts = require('../../../util/consts');
var Formula = require('../../../util/formula');
var utils = require('../../../util/utils');
var userDao = require('../../../dao/userDao');
var playerDao = require('../../../dao/playerDao');
var heroDao = require('../../../dao/heroDao');
var lineupDao = require('../../../dao/lineupDao');
var bagDao = require('../../../dao/bagDao');
var illustratedDao = require('../../../dao/illustratedDao');
var playerLog = require('../../../dao/log/playerDao');
var async = require('async');
var ConfigCache = require('../../../cache/configCache');
var Goblin = require('../../../domain/entity/goblin');
var Lineup = require('../../../domain/entity/lineup');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagLog = require('../../../dao/log/bagDao');
var rechargeDao = require('../../../dao/rechargeDao');
var bossCombatDao = require('../../../dao/bossCombatDao');
var arrayUtil = require('../../../util/arrayUtil');
var onlineServer = require('../../../services/onlineService');
var refreshConf = require('../../../test/import');
var lifeLikeDao = require('../../../dao/lifeLikeDao');
var pushDataToSdService = require('../../../services/pushDataToSdService');
var illAchDao = require('../../../dao/illAchDao');
var playerDailyTaskDao = require('../../../dao/playerDailyTaskDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 创建角色
 */
Handler.prototype.create = function (msg, session, next) {
    var uid = session.uid;
    var areaId = msg.areaId;
    var roleType = msg.roleId || 1;
    var name = (msg.name || '').trim();
    var self = this;
    var playerId, character, player;
    var pos = 1; //主角固定在位置1
    var firstPoint = ConfigCache.get.checkpoint(consts.Vars.CHECK_POINT_MIN);
    var lineups = [];

    if (!areaId) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NO_SERVER_AVAILABLE
        });
        return;
    }

    if (name === '') {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_PLAYER_NAME
        });
        return;
    }

    async.waterfall([function (cb) {
        //敏感词过滤
        self.app.rpc.sensitive.checkRemote.checkName(session,
            name,
            function (err, res) {
                utils.invokeCallback(cb, err, res);
            });
    }, function (res, cb) {
        if (!res) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_PLAYER_NAME
            });
            return;
        }

        character = ConfigCache.get.character(roleType);
        if (!character) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_CHARACTER_NOT_EXIST
            });
            return;
        }
        userDao.checkRole(uid, areaId, cb);

    }, function (res, cb) {
        if (res) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_PLAYER_EXIST
            });
            return;
        }
        userDao.createRole(name, roleType, uid, areaId, cb);
    }, function (res, cb) {
        playerId = res;
        //添加式神阵位        
        var lineupNum = ConfigCache.getVar.const(consts.Keys.HERO_LINEUP_INIT_NUM);
        for (i = 1; i <= lineupNum; i++) {
            lineups.push(new Lineup({ pos: i }));
        }

        lineupDao.createMany(lineups, playerId, areaId, cb);
    }, function (cb) {
        heroDao.createHasPos(character, pos, playerId, areaId, cb);
    }, function (hero, cb) {
        var power = Formula.settleHeroCombatPower([hero], lineups);
        var goblin = ConfigCache.get.goblin(10001);
        var energy = ConfigCache.getVar.const(consts.Keys.ENERGY_MAX);
        var bean = ConfigCache.getVar.const(consts.Keys.BEAN_MAX);

        var time = Date.now();
        let pointMin = firstPoint ? firstPoint.id : consts.Vars.CHECK_POINT_MIN;
        var opts = {
            playerId: playerId,
            name: name,
            roleId: roleType,
            uid: uid,
            maxPos: 1, //开始只有主角
            lv: 1,
            exp: 0,
            gold: 0,
            money: 0,
            power: power,
            energy: energy,
            bean: bean,
            maxStage: pointMin,
            nowStage: pointMin,
            expRise: firstPoint ? firstPoint.exp : 0,
            goldRise: firstPoint ? firstPoint.gold : 0,
            firstLogin: time,
            lastLogin: time,
            lastLogout: 0,
            lastEnergy: time,
            lastBean: time,
            lastStage: time, //记录首次
            goblin: new Goblin(goblin),
            heroBagNum: ConfigCache.getVar.const(consts.Keys.HERO_BAG_INIT_NUM),
            heroBagExt: 0,
            maxHeroLineup: ConfigCache.getVar.const(consts.Keys.HERO_LINEUP_INIT_NUM)
        };
        playerDao.create(opts, areaId, cb);

    }, function (cb) {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            playerId: playerId
        });

    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: player === null ? consts.RES_MSG.ERR_PLAYER_CREATE
                    : consts.RES_MSG.ERR_PLAYER_NAME_EXIST
            });
            return;
        }
    });

};

/**
 * 进入主场景下发玩家数据
 */
Handler.prototype.entry = function (msg, session, next) {
    var self = this;
    var playerId = msg.playerId || 0;
    var areaId = msg.areaId || 0;
    var player, heros, lineups;
    var incExp = 0, incGold = 0, incEnergy = 0;
    var changelv = false;
    var now = Date.now();
    var illustrateds = [];
    var illAch, lifeLikeProbs;
    let dropNum = 0;    //福袋掉落数量
    let bagItems = [];
    let hasRecharge; //是否一次充值25元
    var achId= []    //图鉴收集成就ID列表

    var thisLucTime = 0, lucreUpTime = 0; //本次收益时间、收益更新时间
    var vipConfig;

    var addOnlineTime = 0;  //在线时间统计值

    onlineServer.online(playerId);

    var params = {};
    params.IP = session.get("ipAddress") || "";
    params.ActType = 1;
    ServerID = areaId;
    AccountID = playerId;
    params.DeviceModel = msg.DeviceModel || '';
    params.ScreenX = msg.ScreenX || '';
    params.ScreenY = msg.ScreenY || '';
    params.Platform = msg.Platform || '';
    params.DeviceVer = msg.DeviceVer || '';
    params.NetMode = msg.NetMode || '';
    params.SessionID = session.id;
    pushDataToSdService.pushLogin(params);

    async.waterfall([function (cb) {
        rechargeDao.get(playerId, areaId, cb);
    },
    function (res, cb) {
        if (!res) {
            hasRecharge = false;
        } else {
            hasRecharge = res.onceStatus == 0 ? false : true;
        }
        playerDao.getPlayer(playerId, areaId, cb);
    },
    function (res, cb) {
        if (!res) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_PLAYER_NO_EXIST
            });
            return;
        }
        player = res;
        var checkpoint = ConfigCache.get.checkpoint(player.nowStage);
        var vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1)

        //统计每日任务中的在线时间
        let resetTime = 1000 * (consts.Vars.DAILY_TASK_RESET_HOUR * 3600 + consts.Vars.DAILY_TASK_RESET_MIN * 60 + consts.Vars.DAILY_TASK_RESET_SEC); //统计起始点时间戳
        let lastOffLine = player.lastLogout > 0 && player.lastLogout > player.lastLogin
        ? player.lastLogout : self.app.startTime ; //获取上次离线时间：正常退出/服务器异常退出按启动时间算
        
        if( !utils.isSameDate( lastOffLine - resetTime, now - resetTime ) || player.lastLogout <= 0 ) {
            addOnlineTime = 0 - player.onlineTime; //初次创建角色登录，或上次离线时间与当前时间不在一个统计周期，则在线时长置零;要扣除之前的在线时长
        }else if (utils.isSameDate ( lastOffLine - resetTime, player.lastLogin - resetTime )) {
            addOnlineTime = lastOffLine - player.lastLogin ; //上次离线与上次登录时间在一个统计周期内，则为累加统计时间
        }else if ( !utils.isSameDate ( lastOffLine - resetTime, player.lastLogin - resetTime ) ) {
            addOnlineTime = lastOffLine - ( utils.getZeroHour(now) + resetTime )  - player.onlineTime; //上次离线时间与上次登录时间不在一个统计周期，则从今日的统计起始点算起;要扣除之前的在线时长
        }

        //上次在线退出点与离线挂机收益结算
        var ts = now - player.lastStage;
        var time = player.lastLogout > 0 && player.lastLogout > player.lastLogin
            ? player.lastLogout //正常退出
            : player.lastLogout > 0
                ? self.app.startTime //服务器异常退出时，从服务器启动时间开始算，计在上线时间内
                : player.lastStage + (ts > 86400 ? 86400 : ts); //最多加24H在线时间

        if (!checkpoint) {
            //若未找到关卡配置，则已经达到末尾关卡了
            checkpoint = ConfigCache.get.checkpoint(player.nowStage - 1);
            if (!checkpoint) {
                checkpoint = ConfigCache.checkpoint.get(consts.Vars.CHECK_POINT_MIN);
            }
        }

        var pointExp = checkpoint ? checkpoint.exp : player.expRise;
        var pointGold = checkpoint ? checkpoint.gold : player.goldRise;

        if (time > 0 && player.lastLogin < time) {
            var maxLucreTime = Formula.getMaxLucreTime(player, now).maxLucreTime;     //今天的最大收益时间
            vipConfig = ConfigCache.get.vipPrivilege(player.vip+1)
            Formula.settleOnlineBoss(time, player.lastStage, maxLucreTime, pointExp, pointGold, vipConfig, function (e, g, t) {
                incExp += e;
                incGold += g;
                lucreUpTime = incExp > 0 ? now : player.lucreUpTime;
                thisLucTime = t;
                var surLucTime = maxLucreTime === -1 ? maxLucreTime : maxLucreTime - thisLucTime;   //今天的剩余收益

                Formula.settleOfflineBoss(time, surLucTime, pointExp, pointGold, vipConfig, function (exp, gold, lucreTime, earTs) {
                    incExp += exp;
                    incGold += gold;
                    //没有一次充值25元，离线不掉落福袋
                    if (!!ConfigCache.get.item(checkpoint.dropItem || 0) && hasRecharge) {
                        dropNum = Formula.getOfflineDropItemNum(((t / 1000) + earTs), checkpoint);
                    }

                    thisLucTime += lucreTime;
                    //上次收益不是今天,扣除之前的收益时间
                    thisLucTime = utils.isSameDate(player.lucreUpTime, now) ? thisLucTime : (thisLucTime - player.lucreTime || 0)
                });
            });
        } else {
            console.info('Mutil-login entry scene.');
        }
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
                bagLog.write(bagItems, 'PlayerEntry', playerId, areaId, cb);
            });
        }
    },
    function (cb) {
        //获取玩家的阵位
        lineupDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        lineups = res;
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

        //获取所有的图鉴收集成就ID
        if (!!illAch) {
            illAch.forEach(el => {
                achId.push(el.achId);
            });
        }

        var power = player.power;
        if (changelv) {
            power = Formula.settleHeroCombatPower(heros, lineups, illustrateds, lifeLikeProbs, illAch);
        }
        playerDao.setPlayer({
            $set: {
                power: power,
                lastEnergy: now,
                lastStage: now, //结算打BOSS到登录这区间的在线时间
                lastLogin: now, //且更新登录成功时间
                lastHeroPieceRain: now,
                lucreUpTime: lucreUpTime,
                "offEarRec.exp": incExp,
                "offEarRec.gold": incGold,
                "offEarRec.items": bagItems,
                "offEarRec.isTimes": false
            },
            $inc: {
                gold: incGold,
                energy: incEnergy,
                lucreTime: thisLucTime,
                exp: incExp,
                onlineTime: addOnlineTime //在线时长累加
            }
        }, playerId, areaId, cb);
    }, function (res, cb) {
        player = res;

        //结算每日持续在线任务情况
        let inc;
        let limit = ConfigCache.get.dailyTask(consts.Enums.dailyTaskType.DailyOnline).limit;
        let onlineMinute = Math.floor( ( player.onlineTime + Date.now() - player.lastLogin ) / (60 * 1000) );
        inc = onlineMinute > limit ? limit : onlineMinute ;
        playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyOnline, inc, playerId, areaId); //每日持续在线时间的记录

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
        playerLog.write(ops, 'EntryScene', playerId, areaId, cb);
    }, function (cb) {
        bagDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {

        var bags = res;
        let nowCp = ConfigCache.checkpoint.get(player.nowStage);
            if (!nowCp) {
                //若未找到关卡配置，则已经达到末尾关卡了
                nowCp = ConfigCache.get.checkpoint(player.nowStage - 1);
                if (!nowCp) {
                    nowCp = ConfigCache.checkpoint.get(consts.Vars.CHECK_POINT_MIN);
                }
            }
        let checkpointId = nowCp.checkpointId;

        let maxCp = ConfigCache.checkpoint.get(player.maxStage);
        if (!maxCp) {
            //若未找到关卡配置，则已经达到末尾关卡了
            maxCp = ConfigCache.get.checkpoint(player.maxStage - 1);
            if (!maxCp) {
                maxCp = ConfigCache.checkpoint.get(consts.Vars.CHECK_POINT_MIN);
            }
        }
        let maxCheckpointId =maxCp.checkpointId;

        let offRecItem = player.offEarRec.items.select(t => {
            return { id: t.id, type: t.type, num: t.num };
        });

        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            player: {
                id: player.id,
                name: player.name,
                lv: player.lv,
                exp: player.exp,
                gold: player.gold,
                money: player.money,
                heroFragment: player.heroFragment,
                roleId: player.roleId,
                checkpointId: checkpointId,
                maxCheckpointId: maxCheckpointId,
                exprise: player.expRise,
                goldrise: player.goldRise,
                power: player.power,
                energy: player.energy,
                maxenergy: ConfigCache.getVar.const(consts.Keys.ENERGY_MAX, 100),
                propBagNum: player.propBagNum,
                propBagExt: player.propBagExt,
                matBagNum: player.matBagNum,
                matBagExt: player.matBagExt,
                isAdult: player.isAdult,
                viplv: player.vip,
                achId: achId,
                firstLogin: player.firstLogin
            },
            offlineEarnings: {
                exp: player.offEarRec.exp,
                gold: player.offEarRec.gold,
                items: offRecItem
            },
            heros: heros,
            bags: bags
        });
    }], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_ENTRY_SCENCE_FAIL
            });
            return;
        }
    });
};

/**
 * 获取玩家信息
 */
Handler.prototype.getPlayerInfo = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let player = {};
    let cfgs = ConfigCache.getAll.checkpoint();
    let cfgArr = arrayUtil.dictionaryToArray(cfgs);
    let stageId, monsterId;
    let bossCombatRecords;
    let checkpointId, maxCheckpointId;

    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
		(res, cb) => {
            player = res;

            let nowCp = ConfigCache.checkpoint.get(player.nowStage);
            if (!nowCp) {
                //若未找到关卡配置，则已经达到末尾关卡了
                nowCp = ConfigCache.get.checkpoint(player.nowStage - 1);
                if (!nowCp) {
                    nowCp = ConfigCache.checkpoint.get(consts.Vars.CHECK_POINT_MIN);
                }
            }
            checkpointId = nowCp.checkpointId;

            let maxCp = ConfigCache.checkpoint.get(player.maxStage);
            if (!maxCp) {
                //若未找到关卡配置，则已经达到末尾关卡了
                maxCp = ConfigCache.get.checkpoint(player.maxStage - 1);
                if (!maxCp) {
                    maxCp = ConfigCache.checkpoint.get(consts.Vars.CHECK_POINT_MIN);
                }
            }
            maxCheckpointId = maxCp.checkpointId;


            bossCombatDao.getByPlayerId(playerId, areaId, cb);
        }, (res, cb) => {
            bossCombatRecords = res;

            for (var i = 0; i < cfgArr.length; i++) {
                let bossCombatRecord = bossCombatDao.getBossCombatRecord(bossCombatRecords, cfgArr[i].stageId)
                if (!bossCombatRecord) {
                    if (maxCheckpointId > cfgArr[i].pointId) {
                        stageId = cfgArr[i].stageId;
                        monsterId = cfgArr[i].monsterId;
                        break;
                    }
                } else {
                    if (utils.isSameDate(Date.now(), bossCombatRecord.createTime) == false) {
                        stageId = cfgArr[i].stageId;
                        monsterId = cfgArr[i].monsterId;
                        break;
                    }
                }
            }

            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                checkpointId: checkpointId,
                maxCheckpointId: maxCheckpointId,
                power: player.power,
                energy: player.energy,
                money: player.money,
                gold: player.gold,
                exp: player.exp,
                lv: player.lv,
                stageId: stageId || 0,
                monsterId: monsterId || 0,
                viplv: player.vip
            });
        }
    ], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_ENTRY_SCENCE_FAIL
            });
            return;
        }
    });
};

/**
 * 获取排行信息
 */
Handler.prototype.getRankInfo = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    var powerRank = [];
    var heronumRank = [];
    async.waterfall([
        (cb) => {
            playerDao.powerRank(playerId, areaId, cb);
        },
		(res, cb) => {
            powerRank = res;
            playerDao.heronumRank(playerId, areaId, cb);
        },
        (res, cb) => {
            heronumRank = res;
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                powerRank: powerRank,
                heronumRank: heronumRank
            });
        }
    ], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_ENTRY_SCENCE_FAIL
            });
            return;
        }
    });
};

/**
 * 查询邮件
 */
Handler.prototype.getVipConfig = function(msg, session, next) {
    var vipConfig = ConfigCache.vipPrivilege.getAll();
    var vipConfigArr = [];
                
    arrayUtil.dictionaryToArray(vipConfig).select((t) => {
                    vipConfigArr.push(t);
    });
    if(!vipConfig){
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
        });
        return;
    }
    async.waterfall([
        (cb) => {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                VipConfig: vipConfigArr
            });
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
        });
};


/**
 * 更新配置缓存
 */
Handler.prototype.configCheck = function (msg, session, next) {

    async.waterfall([
        (cb) => {
            refreshConf.refresh('cfg_achieve_task',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_card',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_character',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_checkpoint',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_const',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_daily_task',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_daily_task_award',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_goblin',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_hero',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_hero_illustrated',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_hero_lottery',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_hero_skill',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_hero_smelt',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_heropiece_rain',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_ill_ach',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_item',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_item_lottery',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_lottery_cost',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_lv_cost',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_monster',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_online_award',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_online_lottery',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_point_award',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_point_boss',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_prop_cost',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_recharge',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_recharge_rebate',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_role_cost',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_shop',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_shop_hero_pool',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_sign_award',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_signnum',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_skill_cost',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_skill_state',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_starlv_cost',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_task',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_tower',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_vip_privilege',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_lifelike',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_point_lottery_update_award',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_point_lottery_random_award',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_point_lottery_update',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_ranked_game_award',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_robot',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_world_boss',cb);
        },
        (res, cb) => {
            refreshConf.refresh('cfg_world_boss_award',cb);
        },
        (res, cb) => {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                res: res
            });
        }
    ], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_ENTRY_SCENCE_FAIL
            });
            return;
        }
    });

};





/**
 * 获取/更新配置缓存
 */
Handler.prototype.configGet = function (msg, session, next) {
    var self = this;
    var data;
    async.waterfall([
        (cb) => {
            //ConfigCache.get连续使用，会出现部分数据被重新刷洗；目前并未发现会影响的数据在一个接口中多次get
            data = 123;
            utils.invokeCallback(cb, null, data);
        },
        (res, cb) => {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                // res: ConfigCache.getData('cfg_item'),
                // res1: ConfigCache.item,
                // res2: ConfigCache.getAll.card(),
                // res3: ConfigCache.get.card('1'),
                // res4: ConfigCache.get.card('1'),
                // res5: ConfigCache.get.character('90003'),
                // res6: ConfigCache.get.character('90003'),
                // res7: ConfigCache.get.checkpoint('1002'),
                // res8: ConfigCache.get.checkpoint('1002'),
                // res9: ConfigCache.get.const('BAG_EXT_PRICE'),
                // res10: ConfigCache.get.const('BAG_EXT_PRICE'),
                // res11: ConfigCache.get.goblin('10002'),
                // res12: ConfigCache.get.goblin('10002'),
                // res13: ConfigCache.get.hero('10005'),
                // res14: ConfigCache.get.hero('10005'),
                // res15: ConfigCache.get.illustrated('3'),
                // res16: ConfigCache.get.illustrated('3'),
                // res17: ConfigCache.get.heroLottery('6'),
                // res18: ConfigCache.get.heroLottery('6'),
                // res19: ConfigCache.get.skill('1000','5'),
                // res20: ConfigCache.get.skill('1000','5'),
                // res21: ConfigCache.get.heroSmelt('3'),
                // res22: ConfigCache.get.heroSmelt('3'),
                // res23: ConfigCache.get.heroPieceRain('1013'),
                // res24: ConfigCache.get.heroPieceRain('1013'),
                // res25: ConfigCache.get.illAch('1005'),
                // res26: ConfigCache.get.illAch('1005'),
                // res27: ConfigCache.get.item('510103'),
                // res28: ConfigCache.get.item('510103'),
                // res29: ConfigCache.get.itemLottery('1'),
                // res30: ConfigCache.get.itemLottery('1'),
                // res31: ConfigCache.get.lotteryCost('1'),
                // res32: ConfigCache.get.lotteryCost('1'),
                // res33: ConfigCache.get.lvCost('1'),
                // res34: ConfigCache.get.lvCost('1'),
                // res35: ConfigCache.get.monster('11002'),
                // res36: ConfigCache.get.monster('11002'),
                // res37: ConfigCache.get.firstOnlineAward('1'),
                // res38: ConfigCache.get.firstOnlineAward('1'),
                // res39: ConfigCache.get.onlineLottery('610000'),
                // res40: ConfigCache.get.onlineLottery('610000'),
                // res41: ConfigCache.get.pointAward('10007'),
                // res42: ConfigCache.get.pointAward('10007'),
                // res43: ConfigCache.get.bossCombat('7000'),
                // res44: ConfigCache.get.bossCombat('7000'),
                // res45: ConfigCache.get.propCost('1'),
                // res46: ConfigCache.get.propCost('1'),
                // res47: ConfigCache.get.recharge('40001'),
                // res48: ConfigCache.get.recharge('40001'),
                // res49: ConfigCache.get.roleCost('1','5'),
                // res50: ConfigCache.get.roleCost('1','5'),
                // res51: ConfigCache.get.shop('610100'),
                // res52: ConfigCache.get.shop('610100'),
                // res53: ConfigCache.get.shopHeroPool('40007'),
                // res54: ConfigCache.get.shopHeroPool('40007'),
                // res55: ConfigCache.get.signAward('1'),
                // res56: ConfigCache.get.signAward('1'),
                // res57: ConfigCache.get.skillCost('1'),
                // res58: ConfigCache.get.skillCost('1'),
                // res59: ConfigCache.get.skillState('20100'),
                // res60: ConfigCache.get.skillState('20100'),
                // res61: ConfigCache.get.starlvCost('1'),
                // res62: ConfigCache.get.starlvCost('1'),
                // res63: ConfigCache.get.task('10014'),
                // res64: ConfigCache.get.task('10014'),
                // res65: ConfigCache.get.tower('1'),
                // res66: ConfigCache.get.tower('1'),
                // res67: ConfigCache.get.vipPrivilege('1'),
                // res68: ConfigCache.get.vipPrivilege('1'),
            });
        }
    ], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_ENTRY_SCENCE_FAIL
            });
            return;
        }
    });

};

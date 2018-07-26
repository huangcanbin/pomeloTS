var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
var playerDao = require('../../../dao/playerDao');
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
const worldBossDao = require('../../../dao/worldBossDao');
const signAwardDao = require('../../../dao/signAwardDao');
const illAchDao = require('../../../dao/illAchDao');
const mailDao = require('../../../dao/mailDao');
var Mail = require('../../../domain/entity/mail');
const lifeLikeDao = require('../../../dao/lifeLikeDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};


/**
 * boss挑战
 */
Handler.prototype.worldBossCombat = function (msg, session, next) {
    var self = this;
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');

    var bossId = msg.bossid * 1;
    var pay = msg.pay * 1 || 0;
    var monsterId;
    var player = {};
    var bossCombatRecord = {};
    var heros, lineups, illustrateds, nextpoint, now, roleCost, power;
    var combatResult = {};
    var hasRecord = false;
    var now = Date.now();
    var weekDay = new Date(now).getDay();
    var hp = 0;
    var bossCfg = ConfigCache.get.worldBoss(bossId);
    var timesLimit = ConfigCache.getVar.const(consts.Keys.WORLDBOSS_CHALLENGE_TIMES)
 
    if (!bossCfg) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
        });
        return;
    }

    async.waterfall([function (cb) {
        worldBossDao.getByPlayerIdAndBossId(playerId, bossId ,areaId, cb);
    },function (res,cb) {
        bossCombatRecord = res;
        if(!!bossCombatRecord){
            if((utils.isSameDate(now,bossCombatRecord.updatetime) && pay == 0 && bossCombatRecord.times >= timesLimit) || (utils.isSameDate(now,bossCombatRecord.updatetime) && pay == 1 && bossCombatRecord.times == timesLimit + 1)){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_WORLDBOSSCOMBAT_OVERFLOW
                });
                return;
            }
            hasRecord = true;
        }
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        //检查约束条件
        player = res;
        

        if(bossCfg.weekday != weekDay){
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_WORLDBOSSCOMBAT_TIMELIMIT
            });
            return;
        }

        if(pay == 1){
            if (player.money < bossCfg.money) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                });
                return;
            }
        }
        monsterId = bossCfg.monsterid;

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
    }, function (res, cb)  {
        lifeLikeProbs = res;
        illAchDao.getByPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        illAch = res;
        //提交给另一进程处理战斗计算
        var playerBattle = BattleBuilder.builPlayer(player, heros, lineups, illustrateds, lifeLikeProbs, illAch);
        var monsterBattle = { tid: monsterId };
        power = player.power;

        self.app.rpc.combat.checkpointRemote.execute(session,
            playerBattle,
            monsterBattle,
            function (err, res) {
                if (!!err) {
                    logger.error('player:%d, checkpoind:%d bosscombat error! %s', playerId, monsterId, err.stack);
                }
                utils.invokeCallback(cb, err, res);
            });

    }, function (res, cb) {
        combatResult = res;
        if (!combatResult) {
            //挑战失败
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_WORLDBOSS_COMBAT
            });
            return;
        }else{
            combatResult.process.select((t) => {
                if(t.turn == 0){
                    hp += t.hp;
                }
            });
        }
        
        utils.invokeCallback(cb, null);

    },  function (cb){
        if(pay == 1){
            if (bossCfg.money > 0) {

                playerDao.setPlayer({
                    $inc: {
                        money: -bossCfg.money
                    }
                }, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        }else {
            utils.invokeCallback(cb, null, null);
        }
        
    }, function (res, cb) {
        if (!!hasRecord) {
            //修改状态
            let setter = {
                $set:{
                    times: utils.isSameDate(now,bossCombatRecord.updatetime) ? bossCombatRecord.times + 1 : 1,
                    updatetime : now,
                    hp: utils.isSameDate(now,bossCombatRecord.updatetime) ? bossCombatRecord.hp + hp : hp,
                }
            }
            worldBossDao.upStatusByPlayerIdAndBossId(setter, bossId, playerId, areaId, cb);
        }
        else {
            //添加记录
            worldBossDao.create({bossid: bossId, name: player.name, updatetime: now, hp: hp}, playerId, areaId, cb);
        }
    }, function (cb) {
        let entity = [];
        entity.push(new Mail({playerId: playerId,items: bossCfg.items}));
        mailDao.create(entity, playerId, areaId, cb);
    }, function (cb) {
        Response({
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            hp: hp,
            allhp: hasRecord ? (utils.isSameDate(now,bossCombatRecord.updatetime) ? bossCombatRecord.hp + hp : hp) : hp
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
 * 获取排名信息
 */
Handler.prototype.getRankInfo = function (msg, session, next) {
    var rankInfo;
    var areaId = session.get('areaId');
    async.waterfall([function (cb) {
        worldBossDao.get(Date.now(),areaId, cb);
    }, function (res, cb) {
        rankInfo = res || [];

        Response({
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            rankinfo: rankInfo
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
}
/**
 * 获取玩家挑战boss记录
 */
Handler.prototype.getRankInfoByPlayerId = function (msg, session, next) {
    var bossCombatRecord;
    var bossId = msg.bossid * 1;
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    async.waterfall([function (cb) {
        worldBossDao.getByPlayerIdAndBossId(playerId, bossId, areaId, cb);
    }, function (res, cb) {
        bossCombatRecord = res;
        
        Response({
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            bossCombatRecord: bossCombatRecord
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
}

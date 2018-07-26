var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var dbDriver = require('../drive/dbDriver');
var utils = require('../util/utils');
var consts = require('../util/consts');
var Player = require('../domain/entity/player');
var Daily = require('../domain/entity/daily');
var Goblin = require('../domain/entity/goblin');
const ConfigCache = require('../../app/cache/configCache');
const OffEarRec = require('../domain/entity/offEarRec');
const async = require('async');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');
const illustratedDao = require('./illustratedDao');
const Formula = require('../../app/util/formula');
const playerTaskDao = require('./playerTaskDao');
var lifeLikeDao = require('./lifeLikeDao');
const illAchDao = require('./illAchDao');

var handle = module.exports;

/**
 * create player object
 */
handle.create = function (opts, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Player", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }
        var entity = new Player(opts);
        col.insertOne(entity, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }
            close();
            utils.invokeCallback(next, null);
        });
    });
};

/**
 * get player object
 */
handle.getPlayer = function (playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Player", function (err, col, close) {
        if (!!err || !playerId) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        var filter = { playerId: playerId };
        col.findOne(filter, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();
            if (!res || !res.playerId || res.playerId === 0) {
                utils.invokeCallback(next, 'Not found player:' + playerId + ' on area:' + areaId, null);
                return;
            }
            var player = builBackdPlayer(res);
            utils.invokeCallback(next, null, player);
        });
    });
};

/**
 * set player object
 */
handle.setPlayer = function (setter, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Player", function (err, col, cb) {
        if (!!err || !playerId) {
            cb(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        col.findOneAndUpdate({ playerId: playerId }, setter, { returnOriginal: false }, function (err, res) {
            if (!!err) {
                cb();
                utils.invokeCallback(next, err, null);
                return;
            }
            cb();
            res = res.value;
            var player = builBackdPlayer(res);
            utils.invokeCallback(next, null, player);
        });
    });
};


handle.logout = function (playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Player", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        col.updateOne({ playerId: playerId }, { $set: { lastLogout: Date.now() } }, { upsert: true }, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, 0);
                return;
            }
            close();
            utils.invokeCallback(next, null, res.matchedCount);
        });
    });
};

var builBackdPlayer = function (res) {
    return {
        id: res.playerId,
        name: res.name,
        maxPos: res.maxPos || 1,
        lv: res.lv || 1,
        exp: res.exp || 0,
        gold: res.gold || 0,
        money: res.money || 0,
        roleId: res.roleId,
        maxStage: res.maxStage,
        nowStage: res.nowStage || 0,
        expRise: res.expRise,
        goldRise: res.goldRise,
        power: res.power || 0,
        energy: res.energy || 0,
        bean: res.bean || 0,
        lastLogout: res.lastLogout,
        lastLogin: res.lastLogin,
        lastStage: res.lastStage,
        lastEnergy: res.lastEnergy,
        lastBean: res.lastBean,
        daily: res.daily || new Daily(),
        goblin: res.goblin || new Goblin(),
        heroBagNum: res.heroBagNum || 0,
        heroBagExt: res.heroBagExt || 0,
        heroFragment: res.heroFragment || 0,
        maxHeroLineup: res.maxHeroLineup || 0,
        propBagNum: res.propBagNum || 30,
        propBagExt: res.propBagExt || 0,
        matBagNum: res.matBagNum || 30,
        matBagExt: res.matBagExt || 0,
        idNumber: res.idNumber,
        isAdult: res.isAdult || false,
        createTime: res.createTime,
        lucreTime: res.lucreTime || 0,
        lucreUpTime: res.lucreUpTime || 0,
        offEarRec: res.offEarRec || new OffEarRec(),
        heroNum: res.heroNum || 0,
        goblinFlag: res.goblinFlag || 0,
        lastHeroPieceRain: res.lastHeroPieceRain,
        heroPieceRainNum: res.heroPieceRainNum,
        hasNewMail: res.hasNewMail || 0,
        vip: res.vip || 0,
        lastVipAwardTime: res.lastVipAwardTime || 0,
        firstDayOnLineTime: res.firstDayOnLineTime || 0,
        firstLogin: res.firstLogin,
        lifeLike: res.lifeLike || 0,
        lifeLikeLevel: res.lifeLikeLevel || 1, 
        isRemedial: res.isRemedial || false,
        remedialList: res.remedialList || [],
        onlineTime: res.onlineTime || 0,
        rankedCard: res.rankedCard,
        rankedHistory: res.rankedHistory,
        lastFullCard: res.lastFullCard,
        nextFullCard: res.nextFullCard,
        lastRanked: res.lastRanked,
    };
};

/**
 * 更新战斗力
 */
handle.upPower = function (playerId, areaId, next) {
    let power, lineups = [], heros = [], illustrateds = [],lifeLikeProbs, illAch = [];
    async.waterfall([
        (cb) => {
            lineupDao.getByPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            lineups = res;

            heroDao.getLineup(playerId, areaId, cb);
        },
        (res, cb) => {
            heros = res;

            illustratedDao.getByPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            illustrateds = res;

            lifeLikeDao.getTotalByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            lifeLikeProbs = res;

            illAchDao.getByPlayer(playerId, areaId, cb);
        }, 
        (res, cb) => {
            illAch = res;
            //更新战斗力
            power = Formula.settleHeroCombatPower(heros, lineups, illustrateds, lifeLikeProbs, illAch);
            handle.setPlayer({
                $set: {
                    power: power
                },
            }, playerId, areaId, cb);
        },
        (res, cb) => {
            //更新任务
            playerTaskDao.upTask(playerId, areaId, cb);
        },
        (res, cb) => {
            utils.invokeCallback(next, null, {
                code: consts.RES_CODE.SUC_OK,
                power: power,
                heros: heros,
                lineups: lineups
            });
        }
    ], (err) => {
        if (!!err) {
            utils.invokeCallback(next, null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};

/**
 * 获取战斗力排行榜
 */
handle.powerRank = function (playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    var powerlimit = ConfigCache.getVar.const(consts.Keys.RANK_POWER_LIMIT);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Player", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }
        let entity = {power : {$gte:powerlimit}};
        col.find(entity).limit(50).toArray(function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();

            var powerRankInfo = [];
            if (!!res && res.length > 0) {
                for (var i = 0; i < res.length; i++) {
                    var r = res[i];
                    powerRankInfo.push({
                        name: r.name,
                        power: Math.floor(r.power)
                    });
                }
            }

            utils.invokeCallback(next, null, powerRankInfo);
        });
    });
};

/**
 * 获取式神数量排行榜
 */
handle.heronumRank = function (playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    var heronumlimit = ConfigCache.getVar.const(consts.Keys.RANK_HERONUM_LIMIT);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Player", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }
        let entity = {heroNum : {$gte:heronumlimit}};
        col.find(entity).limit(50).toArray(function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();

            var heroNumRankInfo = [];
            if (!!res && res.length > 0) {
                for (var i = 0; i < res.length; i++) {
                    var r = res[i];
                    heroNumRankInfo.push({
                        name: r.name,
                        heroNum: r.heroNum
                    });
                }
            }

            utils.invokeCallback(next, null, heroNumRankInfo);
        });
    });
};
var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
var moneyRouletteDao = require('../../../dao/moneyRouletteDao');
var ConfigCache = require('../../../cache/configCache');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var playerDao = require('../../../dao/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var logger = require('pomelo-logger').getLogger(__filename);
const Response = require('../../../domain/entity/response');
const Formula = require('../../../util/formula');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 查看抽奖记录
 */
Handler.prototype.rouletteRecord = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let money = 0;
    let nextmoney = 100;
    let playerAwas;

    async.waterfall([
        (cb) => {
            moneyRouletteDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwas = res;
            
            if(!!playerAwas){
                money = playerAwas.money;
                nextmoney = playerAwas.nextmoney;
            }

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                money: money,
                nextmoney: nextmoney
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};

/**
 * 领取签到奖励
 */
Handler.prototype.roulette = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let status = 0;
    let player, playerAwa;
    let hasRecord = false;  //有领奖记录
    let money = msg.money * 1;
    let awardmoney;
    let nextmoney = 100;
    let playerAwas;
    let moneylimit = ConfigCache.const.getVar(consts.Keys.ROULETTE_LIMIT);
    let cfgs = {};
    let id = 0;
    //获取所有抽奖配置
    let allCfgs = ConfigCache.moneyRoulette.getAll();
    arrayUtil.dictionaryToArray(allCfgs).select((t) => {
        if(t.money == money){
            cfgs[id] = t;
            id++;
        }
    });

    if (!cfgs) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
        });
        return;
    }

    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;

            if(player.money < money){
                Response({
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                }, next);
                return;
            }

            moneyRouletteDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwas = res;
            if(!!playerAwas){
                nextmoney = playerAwas.nextmoney;
                hasRecord = true;
                if(playerAwas.money == moneylimit){
                    Response({
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_ROULETTE_LIMIT
                    }, next);
                    return;
                }
            }
            if(money != nextmoney){
                Response({
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_VOID_PARAM
                }, next);
                return;
            }
            
            let hitItem = Formula.hitOneFromDict(cfgs, function (p) { return p.money === money; }, true);
            awardmoney = hitItem.awardmoney;
            nextmoney = hitItem.nextmoney;
            if(hitItem.protectmoney > 0){
                if(player.money - money + hitItem.awardmoney >= hitItem.protectmoney){
                    awardmoney = hitItem.awardmoney1;
                }
            }

            if (!!hasRecord) {
                //修改状态
                let setter = {
                    $set:{
                        money:money,
                        awardmoney:awardmoney,
                        nextmoney:nextmoney
                    }
                }
                moneyRouletteDao.upRecordByPlayerId(setter, playerId, areaId, cb);
            }
            else {
                //添加记录
                moneyRouletteDao.create({money:money,awardmoney:awardmoney,nextmoney:nextmoney}, playerId, areaId, cb);   
            }
        },
        (cb) => {
            if (awardmoney > 0) {
                playerDao.setPlayer({
                    $inc: {
                        money: awardmoney - money
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

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                awardmoney: awardmoney,
                nextmoney: nextmoney,
                money: player.money
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};




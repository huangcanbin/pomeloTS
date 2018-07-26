var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
var firstOnlineAwardDao = require('../../../dao/firstOnlineAwardDao');
var ConfigCache = require('../../../cache/configCache');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var playerDao = require('../../../dao/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var logger = require('pomelo-logger').getLogger(__filename);
const Response = require('../../../domain/entity/response');
const heroDao = require('../../../dao/heroDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 查看签到奖励列表
 */
Handler.prototype.findAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let player, playerAwas;
    let signperiod = ConfigCache.getVar.const(consts.Keys.SIGN_PERIOD) ;
    let accustatus = 0;
    let accustatusArr = [];
    let type = msg.type * 1;
    let now = Date.now();
    //获取所有关卡奖励配置
    let cfgs = ConfigCache.getAll.firstOnlineAward();

    if (!cfgs) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
        });
        return;
    }

    let cfgArr = [];
    arrayUtil.dictionaryToArray(cfgs).select((t) => {
        if(t.type == type){
                cfgArr.push(t);
        }
    });

    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;
            firstOnlineAwardDao.getByPlayerId(playerId, type, areaId, cb);
        },
        (res, cb) => {
            playerAwas = res;
            let awards = [];

            cfgArr.select((t) => {
                let status = consts.Enums.getStatus.Not;
                let nowawa = playerAwas.firstOrDefault(j => j.typeid == t.typeid);
                if(!!nowawa){
                    status = nowawa.status;
                }else{
                    if(t.type == consts.Enums.dayType.SevenDay){
                        if(!utils.isSameDate((player.firstLogin + (t.time-1) * 86400000),now) && (player.firstLogin + (t.time-1) * 86400000) < now){
                            status = consts.Enums.getStatus.Rem;
                            firstOnlineAwardDao.create({typeid:t.typeid,type:t.type,status:status},playerId,areaId)                            
                        }
                    }
                }
                awards.push({id:t.typeid,status:status,items:t.items,heros:t.heros})
            });
            
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                firstdayonlietime: player.firstDayOnLineTime || 0,
                firstlogin: player.firstLogin,
                awards: awards,
                //awards: awards
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
Handler.prototype.getAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let status = 0;
    let player, playerAwa;
    let hasRecord = false;  //有领奖记录
    let exp = 0, gold = 0, money = 0, items = [], heroIds = [];
    let viplev = 0;
    let type = msg.type * 1;
    let id = msg.id * 1;
    let needMoney = ConfigCache.getVar.const(consts.Keys.ONLINE_NEED_MONEY) ;
    //获取所有关卡奖励配置
    let cfgs = ConfigCache.getAll.firstOnlineAward();
    let cfgArr = [];
    arrayUtil.dictionaryToArray(cfgs).select((t) => {
        if(t.type == type){
                cfgArr.push(t);
        }
    });

    let cfg = cfgArr.firstOrDefault(j => j.typeid == id);

    if (!cfg) {
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
            firstOnlineAwardDao.getByPlayerId(playerId, type, areaId, cb);
        },
        (res, cb) => {
            playerAwas = res;
            if(type == consts.Enums.dayType.SevenDay && id == consts.Enums.SevenDayLastDay){
                for(i = 1;i<7;i++){
                    let nowawa = playerAwas.firstOrDefault(j => j.typeid == i);
                    if(!nowawa || nowawa.status != consts.Enums.getStatus.Alr){
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_NOT_ALL_GET
                        });
                        return;
                    }
                }
            }
            let nowawa = playerAwas.firstOrDefault(j => j.typeid == id);
            if (!!nowawa) {
                
                status = nowawa.status;
                if (status == consts.Enums.getStatus.Alr) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_AWARD
                    });
                    return;
                }

                if (status == consts.Enums.getStatus.Rem){
                    if (player.money < needMoney) {
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_NOT_MENOY
                        });
                        return;
                    }
                }

                hasRecord = true;
            }
            else {
                hasRecord = false;
            }
            

            let itemMap = new ItemBuilder(cfg.items, ConfigCache.items());
            exp += itemMap.getExp();
            gold += itemMap.getGold();
            money += itemMap.getMoney();
            if(status == 3){
                money -= needMoney
            }
            items = itemMap.getItem();

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
                firstOnlineAwardDao.upStatusByPlayerId(consts.Enums.getStatus.Alr, type, id, playerId, areaId, cb);
            }
            else {
                //添加记录
                firstOnlineAwardDao.create({typeid:id,type:type,status:consts.Enums.getStatus.Alr}, playerId, areaId, cb);   
            }
        },
        (cb) => {
            if (gold > 0 || exp > 0 || money != 0) {
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




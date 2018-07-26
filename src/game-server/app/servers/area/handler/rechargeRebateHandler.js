var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
var rechargeRebateDao = require('../../../dao/rechargeRebateDao');
var ConfigCache = require('../../../cache/configCache');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var playerDao = require('../../../dao/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var logger = require('pomelo-logger').getLogger(__filename);
const Response = require('../../../domain/entity/response');
const Formula = require('../../../util/formula');
const heroDao = require('../../../dao/heroDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 查看充值返利
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
    //获取所有奖励配置
    let cfgs = ConfigCache.getAll.rechargeRebateAward();

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
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;
            rechargeRebateDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwas = res;
            let awards = [];

            cfgArr.select((t) => {
                let status = consts.Enums.getStatus.Not;
                let nowawa = playerAwas.firstOrDefault(j => j.typeid == t.typeid && j.type == t.type);
                if(!!nowawa){
                    if(t.type < consts.Enums.rebateType.AllTotal){
                        if(utils.isSameDate(nowawa.rechargetime,now)){
                            status = nowawa.status;
                        }else{
                            status = consts.Enums.getStatus.Not;
                        }
                    }else{
                        status = nowawa.status;

                        if(t.type == consts.Enums.rebateType.AllEvery && nowawa.alrtimes < nowawa.times){
                            if(!utils.isSameDate(nowawa.awardtime,now)){
                                status = consts.Enums.getStatus.Can;
                                let setter = {
                                    $set:{
                                        status: status
                                    }
                                }
                                rechargeRebateDao.upStatusByPlayerId(setter, t.type, t.typeid, playerId, areaId);
                            }
                        }
                        
                    }  
                }
                awards.push({type:t.type,id:t.typeid,status:status,items:t.items,heros:t.heros})
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
 * 领取奖励
 */
Handler.prototype.getAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let status = 0;
    let player, playerAwa;
    let hasRecord = false;  //有领奖记录
    let exp = 0, gold = 0, money = 0, items = [], heroIds = [], nums = [], heros = [];
    let viplev = 0;
    let type = msg.type * 1;
    let id = msg.id * 1;
    let needMoney = ConfigCache.getVar.const(consts.Keys.ONLINE_NEED_MONEY) ;
    let nowawa;
    let now = Date.now();
    //获取所有奖励配置
    let cfgs = ConfigCache.getAll.rechargeRebateAward();
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
            rechargeRebateDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwas = res;
            
            nowawa = playerAwas.firstOrDefault(j => j.typeid == id && j.type == type);
            if (!!nowawa) {
                status = nowawa.status;
                if(nowawa.type < consts.Enums.rebateType.AllTotal && !utils.isSameDate(nowawa.rechargetime,now)){
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_RECHARGEREBATE_TIMEOUT
                    });
                    return;
                }

                if (status == consts.Enums.getStatus.Alr) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_AWARD
                    });
                    return;
                }
            }
            if(type == consts.Enums.rebateType.AllFirstLottery){
                let itemCfg = ConfigCache.get.item(cfg.items[0].id);
                let hitSet = ConfigCache.getAll.heroLottery();
                //式神抽奖
                let hitItem = Formula.hitOneFromDict(hitSet, function (p) { return p.type === itemCfg.ids; }, true);
                let heroId = hitItem.heroId;
                let hero = ConfigCache.get.hero(heroId);
                if (!hero) {
                    //式神不存在
                    logger.error('At HeroTakeTen heroId:%d is not found.', heroId);
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_SUMMON_TAKE
                    });
                     return;
                }

                heroIds.push(heroId);
                heros.push({
                    heroId: heroId,
                    num: 1
                });
                cfg.items = [];
                cfg.heros = heros;
            }
            let itemMap = new ItemBuilder(cfg.items, ConfigCache.items());
            exp += itemMap.getExp();
            gold += itemMap.getGold();
            money += itemMap.getMoney();
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
            let setter = {
                $inc: {
                    alrtimes:1
                },
                $set:{
                    status: ((nowawa.alrtimes + 1) == nowawa.times && nowawa.type != consts.Enums.rebateType.AllEvery) || nowawa.type == consts.Enums.rebateType.AllEvery ? consts.Enums.getStatus.Alr:consts.Enums.getStatus.Can,
                    awardtime: now
                }
            }
            rechargeRebateDao.upStatusByPlayerId(setter, type, id, playerId, areaId, cb);
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
                heros: cfg.heros,
                times: nowawa.times,
                alrtimes: nowawa.alrtimes + 1
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};




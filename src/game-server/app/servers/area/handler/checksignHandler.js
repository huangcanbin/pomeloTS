var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
const signAwardDao = require('../../../dao/signAwardDao');
var ConfigCache = require('../../../cache/configCache');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var playerDao = require('../../../dao/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var logger = require('pomelo-logger').getLogger(__filename);
const Response = require('../../../domain/entity/response');

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
    //获取所有关卡奖励配置
    let cfgs = ConfigCache.getAll.signAward();

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
            signAwardDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwas = res;
            let status = 0;
            let awardFlag = 0;
            let awards;

            if(!!playerAwas) {
                status = playerAwas.status;
                accustatus = playerAwas.accustatus;
                awardFlag = playerAwas.status % 10;
                if(utils.isSameDate(playerAwas.createTime,Date.now()) !== true){
                    signAwardDao.upStatusByPlayerId(parseInt((status/10)%signperiod+1)*10, playerId, areaId);
                    status = parseInt((status/10)%signperiod+1)*10;
                    awardFlag = 0;
                    if(status == 10){
                        accustatus = 0;
                        signAwardDao.upAccuStatusByPlayerId(accustatus, playerId, areaId);
                    }
                }
                awards = { todayRew:{items: ConfigCache.get.signAward(parseInt(status/10)).items} , tomRew : {items: ConfigCache.get.signAward(parseInt((status/10)%7+1)).items} };
            }else{
                awards = { todayRew:{items: ConfigCache.get.signAward(1).items} , tomRew : {items: ConfigCache.get.signAward(2).items} };
            }

            for(var i = 0; i<cfgArr.length;i++){
                if(cfgArr[i].items1.length > 0){
                    accustatusArr.push({id: cfgArr[i].id,status: utils.ParseNumbersContain(Math.pow(2,cfgArr[i].id),accustatus)});
                }
            }
            
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                days: (status == 0) ? 0 : ((status % 10) == 1 ? Math.floor(status/10) :Math.floor(status/10) - 1),
                status: awardFlag,
                accustatus: accustatusArr,
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
    let nowDayPosition = 1;
    let tomorrowDayPosition = 2;
    let status ;
    let player, playerAwa;
    let hasRecord = false;  //有领奖记录
    let exp = 0, gold = 0, money = 0, items = [], heroIds = [];
    let viplev = 0;
    let signperiod = ConfigCache.getVar.const(consts.Keys.SIGN_PERIOD) ;
    
    let cfg = ConfigCache.get.signAward(nowDayPosition);
    let cfg1 = ConfigCache.get.signAward(tomorrowDayPosition);
    if (!cfg || !cfg1) {
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
            viplev = player.vip;
            signAwardDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwa = res;

            if (!!playerAwa) {
                status = playerAwa.status;
                if (parseInt(status%10) == 1) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_AWARD
                    });
                    return;
                }else{
                    nowDayPosition = parseInt(status/10);
                    cfg = ConfigCache.get.signAward(nowDayPosition);
                    tomorrowDayPosition = parseInt((status/10)%signperiod+1);
                    cfg1 = ConfigCache.get.signAward(tomorrowDayPosition);
                }

                hasRecord = true;
            }
            else {
                hasRecord = false;
            }
            if(viplev > 0 && cfg.vipflag == 1){
                cfg.items.select((t) => {
                    t.num = t.num * 2;
                });
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

            if (!!hasRecord) {
                //修改状态
                signAwardDao.upStatusByPlayerId(status + 1, playerId, areaId, cb);
            }
            else {
                //添加记录
                signAwardDao.create({ status: status + 1 || 11 }, playerId, areaId, cb);   
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
        (res, cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                items: cfg.items,
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};

/**
 * 领取累计签到奖励
 */
Handler.prototype.getAccuAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let nowDayPosition = 1;
    let tomorrowDayPosition = 2;
    let status ;
    let player, playerAwa;
    let hasRecord = false;  //有领奖记录
    let exp = 0, gold = 0, money = 0, items = [], heroIds = [];
    let day = msg.day * 1;
    
    let cfg = ConfigCache.get.signAward(day);
    // let cfg = ConfigCache.signAward.get(day);
    
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
            viplev = player.vip;
            signAwardDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            playerAwa = res;

            if (!!playerAwa) {
                status = playerAwa.status;
                if (utils.ParseNumbersContain(Math.pow(2,day), playerAwa.accustatus)) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_AWARD
                    });
                    return;
                }

                hasRecord = true;
            }
            else {
                hasRecord = false;
            }

            if(status < (day * 10  + 1)){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_SIGN_DAYLIMIT
                });
                return;
            }

            let itemMap = new ItemBuilder(cfg.items1, ConfigCache.items());
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

            signAwardDao.upAccuStatusByPlayerId(playerAwa.accustatus + Math.pow(2,day), playerId, areaId, cb);
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
        (res, cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                items: cfg.items1,
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};

/**
 * 领取每日vip奖励
 */
Handler.prototype.getVipAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let nowDayPosition = 1;
    let tomorrowDayPosition = 2;
    let status ;
    let player, playerAwa;
    let hasRecord = false;  //有领奖记录
    let exp = 0, gold = 0, money = 0, items = [], heroIds = [];
    let day = msg.day * 1;
    let vipConfig;
    
    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;
            viplev = player.vip;
            vipConfig = ConfigCache.get.vipPrivilege(viplev+1);
            if (viplev == 0) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NO_VIP
                });
                return;
            }

            if (utils.isSameDate(player.lastVipAwardTime,Date.now()) == true) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_AWARD
                });
                return;
            }

            let itemMap = new ItemBuilder(vipConfig.award, ConfigCache.items());
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
        (res,cb) => {
            playerDao.setPlayer({
                $set: {
                    lastVipAwardTime: Date.now()
                }
            }, playerId, areaId, cb);
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
                items: vipConfig.award,
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};

/**
 * 二进制数值判断
 * @param {number} nConNum 
 * @param {number} nTotalNum 
 */
/*var ParseNumbersContain = function (nConNum, nTotalNum) {
    var nPow = 0
	var nTemp = 0
	var bBool = false
	while(nTotalNum != 0 && nTotalNum != null){
		nTemp = nTotalNum % 2
		
		if(nTemp != 0) {
			if (nConNum ==  Math.pow(2,nPow)) {
				bBool = true
				break
			}
		}

		nPow = nPow + 1
		nTotalNum = (nTotalNum - nTemp) / 2
    }
	return bBool
}; */
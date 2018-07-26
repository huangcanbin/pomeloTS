var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
const heroPieceRainDao = require('../../../dao/heroPieceRainDao');
var ConfigCache = require('../../../cache/configCache');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var playerDao = require('../../../dao/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var logger = require('pomelo-logger').getLogger(__filename);
const Response = require('../../../domain/entity/response');
const playerTaskDao = require('../../../dao/playerTaskDao');
const playerDailyTaskDao = require('../../../dao/playerDailyTaskDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 查看掉落数据
 */
Handler.prototype.checkHeroPieces = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let player, playerAwas,lastHeroPieceRain;
    let minPoint = ConfigCache.getVar.const(consts.Keys.HEROPIECERAIN_POINT_MIN);
    let timeInterval = ConfigCache.getVar.const(consts.Keys.HEROPIECERAIN_RESET_TIME);
    let status = 0;
    let cfgs;//获取所有关卡对应掉落数据
    let vipConfig;

    

    let cfgArr = arrayUtil.dictionaryToArray(cfgs);

    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;
            vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);
            lastHeroPieceRain = player.lastHeroPieceRain;
           
            if(player.maxStage < minPoint){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HEROPIECERAIN_MINPOINT
                });
                return;
            }
     
            cfgs = ConfigCache.get.heroPieceRain(player.maxStage);

            if(!cfgs){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }

            heroPieceRainDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            if(!!res){
                let now = Date.now();
                if((now - lastHeroPieceRain) < timeInterval){
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_HEROPIECERAIN_OVERINTERVAL
                    });
                    return;
                }

                heroPieceRainDao.upStatusAndNumByPlayerId(status,cfgs.num,cfgs.rnum,cfgs.srnum,cfgs.ssrnum,cfgs.rssrnum,playerId, areaId, cb)
            }else{
                heroPieceRainDao.create({status:status,num:cfgs.num,rnum:cfgs.rnum,srnum:cfgs.srnum,ssrnum:cfgs.ssrnum,rssrnum:cfgs.rssrnum},playerId,areaId,cb)
            }
        },
        (cb) => {
            //更新任务
            playerTaskDao.upTask(playerId, areaId, cb);
        }, 
        (cb) => {

            let inc = consts.Enums.DailyMinInc;
            playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyPieceRain, inc, playerId, areaId); //每日妖怪雨完成一次的记录

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                point: cfgs.id,
                num: cfgs.num,
                rnum: cfgs.rnum,
                srnum: cfgs.srnum,
                ssrnum: cfgs.ssrnum,
                rssrnum: cfgs.rssrnum,
                speed: vipConfig.heropiecespeed
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
        });
};

/**
 * 领取结算碎片
 */
Handler.prototype.getHeroPieces = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let num = msg.num * 1;
    let rnum = msg.rnum * 1;
    let srnum = msg.srnum * 1;
    let ssrnum = msg.ssrnum * 1;
    let rssrnum = msg.rssrnum * 1;
    let status = 0;
    let player, playerAwa;
    let hasRecord = false;  //有领奖记录
    let items = [],items1 = []
    

    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;
            heroPieceRainDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            if (!res) {
                next(null, res);
                return;
            }
            playerAwa = res;
            
            status = playerAwa.status;
            if (status == 1) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_AWARD
                });
                return;
            }

            status = 1;

            if(num > playerAwa.num || rnum > playerAwa.rnum || srnum > playerAwa.srnum || ssrnum > playerAwa.ssrnum || rssrnum > playerAwa.rssrnum){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HEROPIECERAIN_OVERFLOW
                });
                return;
            }

            if(num > 0){
                items.push({ id: 630004, type: 6, num: num });
            }

            if(rnum > 0){
                items.push({ id: 630005, type: 6, num: rnum });
            }

            if(srnum > 0){
                items.push({ id: 630006, type: 6, num: srnum });
            }

            if(ssrnum > 0){
                items.push({ id: 630007, type: 6, num: ssrnum });
            }

            if(rssrnum > 0){
                items.push({ id: 630008, type: 6, num: rssrnum });
            }
            

            let itemMap = new ItemBuilder(items, ConfigCache.items());
            items1 = itemMap.getItem();

            if (items1.length > 0) {
                bagDao.isEnoughItemsBag(items1, player, playerId, areaId, cb);
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

            heroPieceRainDao.upStatusByPlayerId(status, playerId, areaId, cb);
        },
        (cb) => {
            playerDao.setPlayer({
                $set: {
                    lastHeroPieceRain:Date.now()
                },
                $inc: {
                    heroPieceRainNum: 1
                }
            }, playerId, areaId, cb);
        },
        (res, cb) => {
            if (!!items1 && items1.length > 0) {
                bagDao.createOrIncBag(items1, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null);
            }
        },
        (res, cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                status:status, 
                items: items,
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
        });
};
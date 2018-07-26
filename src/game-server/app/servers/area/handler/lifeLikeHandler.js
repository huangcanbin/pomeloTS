var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
var lifeLikeDao = require('../../../dao/lifeLikeDao');
var ConfigCache = require('../../../cache/configCache');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var playerDao = require('../../../dao/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var logger = require('pomelo-logger').getLogger(__filename);
var Response = require('../../../domain/entity/response');
var Formula = require('../../../util/formula');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 查询某层的命格属性
 */
Handler.prototype.getLifeLikeByLevel = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let level = msg.level * 1 || 1;
    let player;

    async.waterfall([
        function(cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function(res, cb) {
            player = res;
            if(player.lifeLikeLevel < level){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_LIFELIKELEVEL
                });
                return;
            }
            lifeLikeDao.getBallBylevel(level, playerId, areaId, cb);
        },
        function(res, cb) {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                levelRecords: res || []
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
        });
};
/**
 * 开通命格
 */
Handler.prototype.openLifeLikeBylevel = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let level = msg.level * 1 || 1;
    let player;
    let levelLimit = ConfigCache.getVar.const(consts.Keys.LIFELIKE_LEVEL_LIMIT);
    

    async.waterfall([
        function(cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function(res, cb) {
            player = res;
            if(player.lifeLikeLevel != level - 1 || level > levelLimit){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_VOID_PARAM
                });
                return;
            }
            lifeLikeDao.getBallByBallid(level, 7 ,playerId, areaId, cb);  
        },
        function(res, cb) {
            if(!res){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOTDONE_LASTLEVEL
                });
                return;
            }
            let cfg = ConfigCache.lifeLike.get(level);
            if (!cfg) {
                //配置错误
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_INTEN
                });
                return;
            }
            if(player.lifeLike < cfg.lifeLike){
                //命格值不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_LIFELIKE
                });
                return;
            }

            playerDao.setPlayer({
                $inc:{
                    lifeLike: -cfg.lifeLike,
                    lifeLikeLevel: 1
                }
            }, playerId, areaId, cb);
        },
        function(cb) {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
        });
};
/**
 * 命格养成
 */
Handler.prototype.developLifeLike = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let level = msg.level * 1 > 10 ? 10 : msg.level * 1;
    let ballid = msg.ballid * 1;
    let player;
    let hitHp=0,hitAttack=0,hitHit=0,hitDodge=0,hitSpeed=0;
    let ballHp=0,ballAttack=0,ballHit=0,ballDodge=0,ballSpeed=0;
    let incHp=0,incAttack=0,incHit=0,incDodge=0,incSpeed=0;
    let cfg = ConfigCache.lifeLike.get(level);
    let hitItem,hitProbs,incProbs;
    let needValue = ConfigCache.getVar.const(consts.Keys.LIFELIKE_BALL_VALUE);
    let hasRecord = false;
    let hasTotalRecord = false;
    let levelLimit = ConfigCache.getVar.const(consts.Keys.LIFELIKE_LEVEL_LIMIT);

    async.waterfall([
        function(cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function(res, cb) {
            player = res;
            if((player.lifeLikeLevel != level - 1 && level > 1) || level > levelLimit){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_VOID_PARAM
                });
                return;
            }
            if(ballid > 1){
                lifeLikeDao.getBallByBallid(level,ballid - 1, playerId, areaId, cb);
            }else{
                utils.invokeCallback(cb,null,true);
            }
        },
        function(res, cb) {
            if(!res){
                //上一坏还炼制
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOTDONE_LASTBALL
                });
                return;
            }
            lifeLikeDao.getTotalByPlayerId(playerId, areaId, cb);
        },
        function(res, cb) {
            if(!!res){
                hasTotalRecord = true;
            }
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function(res, cb) {
            player = res;

            if(player.lifeLike < needValue){
                //命格值不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_LIFELIKE
                });
                return;
            }
            
            hitItem = Formula.hitOneFromArray(cfg.probsArr);
            switch (hitItem.probtype) {
                case consts.Enums.LifeLikeIncType.Attack:
                    hitAttack = hitItem.value;
                    break;
                case consts.Enums.LifeLikeIncType.Hp:
                    hitHp = hitItem.value;
                    break;
                case consts.Enums.LifeLikeIncType.Hit:
                    hitHit = hitItem.value;
                    break;
                case consts.Enums.LifeLikeIncType.Dodge:
                    hitDodge = hitItem.value;
                    break;
                case consts.Enums.LifeLikeIncType.Speed:
                    hitSpeed = hitItem.value;
                    break;
                default:
                    break;
            }

            lifeLikeDao.getBallByBallid(level, ballid, playerId, areaId, cb);
        },
        function(res, cb) {
            if(!!res){
                hasRecord = true;
                ballHp = res.hp;
                ballAttack = res.attack;
                ballHit = res.hit;
                ballDodge = res.dodge;
                ballSpeed = res.speed;
            }

            incAttack = hitAttack - ballAttack;
            incHp = hitHp - ballHp;
            incHit = hitHit - ballHit;
            incDodge = hitDodge - ballDodge;
            incSpeed = hitSpeed - ballSpeed;
            
            hitProbs = {
                attack: hitAttack,
                hp: hitHp,
                hit: hitHit,
                dodge: hitDodge,
                speed: hitSpeed
            }
            incProbs = {
                attack: incAttack,
                hp: incHp,
                hit: incHit,
                dodge: incDodge,
                speed: incSpeed
            }
            playerDao.setPlayer({
                $inc:{
                    lifeLike: -needValue
                }
            }, playerId, areaId, cb);
        },
        function(res, cb) {
            player = res;
            if(!!hasRecord){
                lifeLikeDao.updateBallByPlayerId({
                    $set:hitProbs
                }, level, ballid, playerId, areaId, cb)
            }else{
                hitProbs.level = level;
                hitProbs.ballid = ballid;
                lifeLikeDao.create(hitProbs, playerId, areaId, cb)
            }
        },function(res, cb) {
            if(!!hasTotalRecord){
                lifeLikeDao.updateTotalByPlayerId({
                    $inc:incProbs
                }, playerId, areaId, cb)
            }else{
                lifeLikeDao.createTotal(incProbs, playerId, areaId, cb)
            }
        },function(res, cb) {
            playerDao.upPower(playerId, areaId, cb)
        },function(res, cb) {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                hitProbs: hitProbs,
                incProbs: incProbs
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
        });
};


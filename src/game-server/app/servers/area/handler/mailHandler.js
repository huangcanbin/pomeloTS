var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
const mailDao = require('../../../dao/mailDao');
var ConfigCache = require('../../../cache/configCache');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var playerDao = require('../../../dao/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var logger = require('pomelo-logger').getLogger(__filename);
const Response = require('../../../domain/entity/response');
const ObjectID = require('mongodb').ObjectID;
const redPointDao = require('../../../dao/redPointDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 发送邮件
 */
Handler.prototype.sendMail = function(msg, session, next) {
    var self = this;
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let uid = session.uid;
    let sid = session.frontendId;
    //let title = msg.title || "你好";
    //let content = msg.content || "欢迎来到百鬼游戏";


    async.waterfall([
        (cb) => {
            mailDao.create(null,playerId, areaId, cb);
        },
        (cb) => {
            playerDao.setPlayer({
                $set: {
                    hasNewMail: 1
                }
            }, playerId, areaId, cb);
            
        },(res,cb) => {      
            redPointDao.upStatus({type: consts.Enums.redPointType.Mail, status: 1}, playerId, areaId,cb);
        },(res,cb) => {
            if(!!res){
                self.app.rpc.push.pushRedPointMessageToPlayer.push(session, {		
                    uid: uid,
                    sid: sid,
                    type: consts.Enums.redPointType.Mail,
                    id: 0,
                    status: 1
                }, null);
            }
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
 * 查询邮件
 */
Handler.prototype.findMails = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let mailRes,mails;


    async.waterfall([
        (cb) => {
            mailDao.getByPlayerId(playerId, areaId, cb);
        },
        (res, cb) => {
            mailRes = res;
            if(!mailRes){
                mails = [];
                utils.invokeCallback(cb, null);
                return;
            }else{
                mails = mailRes.select((t) => {
                    return { id: t.id, title: t.title, content: t.content, deltime: t.deltime, isread: t.isread, items: t.items};
                }); 
                playerDao.setPlayer({
                    $set: {
                        hasNewMail: 0
                    }
                }, playerId, areaId, cb);
            }
        },(cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                mails: mails
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
        });
};
/**
 * 读取邮件
 */
Handler.prototype.readMail = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let mailId = new ObjectID(msg.id);

    async.waterfall([
        (cb) => {
            mailDao.upReadMailStatus(mailId,playerId, areaId, cb);
        },
        (res,cb) => {
            if(!res){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_MIAL_NOHASTHISMAIL
                });
                return;
            }
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
 * 删除邮件
 */
Handler.prototype.delMail = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let mailIds = msg.id.split(',');
    let objIds = [];
    mailIds.forEach(function (el) {
        objIds.push(new ObjectID(el));
    });

    async.waterfall([
        (cb) => {
            mailDao.delByID(objIds,playerId, areaId, cb);
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
 * 领取奖励
 */
Handler.prototype.getMailAward = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let mailIds = msg.id.split(',');
    let objIds = [];
    let mailRes;
    let awards;
    let exp = 0, gold = 0, money = 0, items = [];
    let player;
    let allitems = [];

    mailIds.forEach(function (el) {
        objIds.push(new ObjectID(el));
    });

    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res,cb) => {
            player = res;
            mailDao.getByID(objIds,playerId, areaId, cb);
        },
        (res,cb) => {
            if(!res){
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_MIAL_NOHASTHISMAIL
                });
                return;
            }

            mailRes = res;

            awards = mailRes.select((t) => {
                t.items.select((t1) => {
                    allitems.push(t1);
                });
                
                return { id: t.id, items: t.items};
            });

            let itemMap = new ItemBuilder(allitems, ConfigCache.items());
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
            }else{
                mailDao.delByID(objIds,playerId,areaId,cb);
                utils.invokeCallback(cb, null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                });
            }
        },
        (res,cb) => {
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
                awards: awards
            }, next)
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
        });
};

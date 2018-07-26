
var utils = require('../../../util/utils');
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var playerDao = require('../../../dao/playerDao');
var userDao = require('../../../dao/userDao');
var onlineServer = require('../../../services/onlineService');
var pushDataToSdService = require('../../../services/pushDataToSdService');

var exp = module.exports;

exp.playerLeave = function (args, cb) {
    var playerId = args.playerId;
    var areaId = args.areaId;
    var userId = args.uid;
    var sid = args.sid;
    var ipAddress = args.ipAddress;
    // logger.debug('player:%d logout...', playerId);

    playerDao.logout(playerId, areaId, function (err, res) {
        if (!!err) {
            logger.error('player:%d logout faild. err:%s', playerId, err.stack);
        }
    });
    userDao.userLogout(userId, function (err) {
        if (!!err) {
            logger.error('user:%d logout faild. err:%s', userId, err.stack);
        }
    });

    onlineServer.leave(playerId)

    var params = {};
    params.IP = ipAddress || "";
    params.ActType = 2; //登出
    ServerID = areaId;
    AccountID = playerId;
    params.SessionID = sid;
    pushDataToSdService.pushLogin(params);

    //这里可以推送些玩家离开逻辑    

    utils.invokeCallback(cb);
};
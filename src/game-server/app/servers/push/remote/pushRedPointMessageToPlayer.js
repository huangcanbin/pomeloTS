var utils = require('../../../util/utils');
var pomelo = require('pomelo');
var redPointDao = require('../../../dao/redPointDao');
var messageService = require('../../../domain/messageService');
 
var pushRedPointMessageToPlayer = module.exports;

pushRedPointMessageToPlayer.push = function (args, cb) {
    var type = args.type;
    var status = args.status;
    var id = args.id;
    var uid = args.uid;
    var sid = args.sid;

    messageService.pushMessageToPlayer({ uid: uid, sid: sid }, 'onRedPoint', {type: type, id: id, status: status},function (err, res) {
        if (!!err) {
            logger.error('uid:%s pushMessage faild. err:%s', uid, err.stack);
        }
    });
    utils.invokeCallback(cb);
};
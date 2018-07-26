var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
// var EntityType = require('../consts/consts').EntityType;

var exp = module.exports;

exp.pushMessageByUids = function (uids, route, msg, cb) {
	if (!cb) {
		cb = function (err, fails) {
			errHandler(err, fails);
		};
	}
	pomelo.app.get('channelService').pushMessageByUids(route, msg, uids, cb);
};

exp.pushMessageToPlayer = function (uid, route, msg, cb) {
	exp.pushMessageByUids([uid], route, msg, cb);
};

// exp.pushMessageByAOI = function (area, msg, pos, ignoreList) {
//   var uids = area.timer.getWatcherUids(pos, [EntityType.PLAYER], ignoreList);

//   if (uids.length > 0) {
//     exp.pushMessageByUids(uids, msg.route, msg);
//   }
// };

function errHandler(err, fails) {
	if (!!err) {
		logger.error('Push Message error! %j', err.stack);
	}
}
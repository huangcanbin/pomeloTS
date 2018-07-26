var consts = require('../../../util/consts');
var Token = require('../../../../../shared/token');
var tokenConfig = require('../../../../../shared/config/session');
var userDao = require('../../../dao/userDao');
var async = require('async');
var messageService = require('../../../domain/messageService');

module.exports = function (app) {
	return new Handler(app);
};

var Handler = function (app) {
	this.app = app;
};

/**
 * 连接游戏服务器
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
Handler.prototype.entry = function (msg, session, next) {
	var token = msg.token;
	var areaType = msg.channel || 1;
	self = this;
	if (!token) {
		next(null, {
			code: consts.RES_CODE.ERR_NO_LOGIN,
			msg: consts.RES_MSG.ERR_NO_OAUTH_USER
		});
		return;
	}

	var res = Token.parse(token, tokenConfig.secret);
	if (!res) {
		next(null, {
			code: consts.RES_CODE.ERR_NO_LOGIN,
			msg: consts.RES_MSG.ERR_NO_OAUTH_USER
		});
		return;
	}
	if (!Token.checkExpire(res, tokenConfig.expire)) {
		next(null, {
			code: consts.RES_CODE.ERR_NO_LOGIN,
			msg: consts.RES_MSG.ERR_NO_OAUTH_USER
		});
	}
	var uid = res.uid;
	var user, historyAreas;

	async.waterfall([
		function (cb) {
			userDao.getUserById(uid, cb);
		}, function (res, cb) {
			user = res;

			messageService.pushMessageToPlayer({ uid: uid, sid: session.frontendId }, 'onRepeatLogin', {
				msg: consts.RES_MSG.ERR_OTHER_USER
			});

			self.app.get('sessionService').kick(uid, cb);
		}, function (cb) {
			session.bind(uid, cb);
		}, function (cb) {
			//获取客户端IP地址存入session
			var ser = self.app.get("sessionService");
			var ipAddress = ser.getClientAddressBySessionId(session.id).ip.split(":");
			if (ipAddress && ipAddress.length > 0) {
				session.set("ipAddress", ipAddress[ipAddress.length - 1]);
			}

			//授权登录成功后，注册退出事件
			session.on('closed', onUserLeave.bind(null, self.app));
			session.pushAll(cb);

		}, function (cb) {
			userDao.getHistoryRoleAreas(user.id, areaType, cb);

		}, function (areas, cb) {
			historyAreas = areas;
			if (!historyAreas || historyAreas.length === 0) {
				next(null, {
					code: consts.RES_CODE.SUC_OK,
					msg: '',
					uid: user.id,
					areas: []
				});
				return;
			}
			next(null, {
				code: consts.RES_CODE.SUC_OK,
				msg: '',
				uid: user.id,
				areas: historyAreas
			});
		}],
		function (err) {
			if (!!err) {
				next(null, {
					code: consts.RES_CODE.ERR_FAIL,
					msg: consts.RES_MSG.ERR_NO_OAUTH_USER
				});
				return;
			}
			next(null, {
				code: consts.RES_CODE.SUC_OK,
				msg: '',
				uid: user.id,
				areas: []
			});
		});
};

var onSessionError = function (err) {
	if (err) {
		next(err, { code: Code.FAIL });
		return;
	}
};

var onUserLeave = function (app, session, reason) {
	if (!session || !session.uid) {
		return;
	}
	var serverId = session.get('serverId');
	var playerId = session.get('playerId');
	var areaId = session.get('areaId');
	if (!playerId || !areaId || !serverId) return;

	console.log(session.uid + ' session is logout..');
	app.rpc.area.playerRemote.playerLeave(session, {
		playerId: playerId,
		areaId: areaId,
		uid: session.uid,
		sid: session.id,
		ipAddress: session.get("ipAddress")
	}, function (err) {
		if (!!err) {
			console.log('user leave error! %s', err.stack);
		}
	});

};

var consts = require('../../../util/consts');
var dispatcher = require('../../../util/dispatcher');
var Token = require('../../../../../shared/token');
var tokenConfig = require('../../../../../shared/config/session');

/**
 * Gate handler that dispatch user to connectors.
 */
module.exports = function (app) {
	return new Handler(app);
};

var Handler = function (app) {
	this.app = app;
};

Handler.prototype.queryEntry = function (msg, session, next) {
	var token = msg.token;
	if (!token) {
		next(null, {
			code: consts.RES_CODE.ERR_NO_LOGIN,
			msg: consts.RES_MSG.ERR_NO_OAUTH_USER
		});
		return;
	}

	var res = Token.parse(token, tokenConfig.secret);
	//log
	console.debug('uid:'+res.uid +',expire:'+res.timestamp);

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

	var connectors = this.app.getServersByType('connector');
	if (!connectors || connectors.length === 0) {
		next(null, {
			code: consts.RES_CODE.NO_SERVER_AVAILABLE,
			msg: consts.RES_MSG.ERR_NO_SERVER_AVAILABLE
		});
		return;
	}

	var res = dispatcher.dispatch(uid, connectors);
	next(null, {
		code: consts.RES_CODE.SUC_OK,
		msg: '',
		host: res.clientHost,
		port: res.clientPort
	});
};
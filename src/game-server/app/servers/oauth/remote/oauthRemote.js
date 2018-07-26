var consts = require('../../../util/consts');
var Token = require('../../../../../shared/token');
var tokenConfig = require('../../../../../shared/config/session');
var userDao = require('../../../dao/userDao');


module.exports = function(app) {
	return new Remote(app);
};

var Remote = function(app) {
	this.app = app;
	var session = app.get('session') || {};
	this.secret = session.secret || DEFAULT_SECRET;
	this.expire = session.expire || DEFAULT_EXPIRE;
};

Remote.prototype.oauth = function(token, next) {
	
	var res = Token.parse(token, tokenConfig.secret);
	if (!res) {
		next(null, {
			code: consts.RES_CODE.ERR_FAIL,
			msg: consts.RES_MSG.ERR_NO_OAUTH_USER
		});
		return;
	}
	if (!Token.checkExpire(res, tokenConfig.expire)) {
		next(null, {
			code: consts.RES_CODE.ERR_FAIL,
			msg: consts.RES_MSG.ERR_NO_OAUTH_USER
		});
	}

	userDao.getUserById(res.uid, function (err, user) {
		if (err) {
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
			areaId: 0, //todo not role
			player: {}
		});
	});
    
};
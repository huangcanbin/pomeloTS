var consts = require('./consts');
var secret = require('../../shared/config/session').secret;
var userDao = require('../lib/dao/userDao');
var Token = require('../../shared/token');
var routerpath = '/api/login';

var routeHandle = function (router) {
    router.post(routerpath, function (req, res) {
        // todo: not do samething
        var username = req.body.username || '';
        var password = req.body.password || '';
        password = userDao.encodePassword(password);
        userDao.getUserByName(username, function (err, user) {
            if (err || !user) {
                console.log('username not exist!');
                res.send({
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_LOGIN_NO_USER
                });
                return;
            }
            if (password !== user.password) {
                // password is wrong
                console.log('password incorrect!');
                res.send({
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_LOGIN_PASS
                });
                return;
            }
            var userId = user.id;
            var token = Token.create(userId, Date.now(), secret);
            userDao.loginSucess(userId, function (err) {
                if (!!err) {
                    console.log('login err:' + err);
                }
                res.send({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    token: token,
                    uid: userId
                });
            });

        });
    })
};

module.exports = routeHandle;
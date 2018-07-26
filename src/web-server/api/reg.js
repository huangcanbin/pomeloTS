var consts = require('./consts');
var userDao = require('../lib/dao/userDao');
var routerpath = '/api/reg';

var routeHandle = function (router) {
    router.post(routerpath, function (req, res) {
        // todo: not do samething
        var username = req.body.username || '';
        var password = req.body.password || '';
        if (typeof (username) !== "string" || username === '' || username.length < 6) {
            res.send({
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_USER_NAME_LENGTH
            });
            return;
        }
        password = userDao.encodePassword(password);

        userDao.getUserByName(username, function (err, user) {
            if (!!user) {
                res.send({
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_REG_NAME_EXIST
                });
                return;
            }

            userDao.createUser(username, password, function (err, user) {
                if (!!err) {
                    console.log('username is exist!');
                    res.send({
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_REG_NAME_EXIST
                    });
                    return;
                }
                res.send({
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                });
            });
        });
    })
};

module.exports = routeHandle;
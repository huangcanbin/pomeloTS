var async = require('async');
var utils = require('../../../util/utils');
var consts = require('../../../util/consts');
var heroDao = require('../../../dao/heroDao');
var heroLogDao = require('../../../dao/heroLogDao');
var playerDao = require('../../../dao/playerDao');
var ConfigCache = require('../../../../app/cache/configCache');
var Formula = require('../../../util/formula');
var ObjectID = require('mongodb').ObjectID;
var Hero = require('../../../domain/entity/hero');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 实名认证
 */
Handler.prototype.identification = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var name = msg.name;    //姓名
    var idNumber = msg.idNumber;//身份证号码

    var player;
    var nameReg = /^[\u4e00-\u9fa5]{2,8}$/;

    if (!nameReg.test(name)) {
        //姓名输入有误
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NAME
        });
        return;
    }

    if (!utils.isIDNumber(idNumber)) {
        //请输入正确的身份证号号码
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_IDNUMBER
        });
        return;
    }

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            if (player.isAdult) {
                //已经实名认证过
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_VERIFIDE
                });
                return;
            }

            var age = utils.getAge(idNumber.substr(6, 8));
            var isAdult = age >= 18;

            //修改身份证号
            playerDao.setPlayer({
                $set: {
                    idNumber: idNumber,
                    idName: name,
                    isAdult: isAdult
                }
            }, playerId, areaId);

            if (!isAdult) {
                //未成年
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_ADULT
                });
                return;
            }

            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: ''
            });
        }
    ], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};
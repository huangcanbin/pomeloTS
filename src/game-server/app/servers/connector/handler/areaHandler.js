var consts = require('../../../util/consts');
var userDao = require('../../../dao/userDao');


module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 选服查询列表
 */
Handler.prototype.query = function (msg, session, next) {
    var uid = session.uid;
    var areaType = msg.channel || 1;
    var page = msg.page || 1;
    var size = msg.size || 10;
    var self = this;

    userDao.getAreas(areaType, page - 1, size, function (err, areas) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_AREA_GET
            });
            return;
        }

        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            areas: areas
        });
    });
};
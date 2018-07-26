var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var arrayUtil = require('../../../util/arrayUtil');
var async = require('async');
var redPointDao = require('../../../dao/redPointDao');
var ConfigCache = require('../../../cache/configCache');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var playerDao = require('../../../dao/playerDao');
var bagLog = require('../../../dao/log/bagDao');
var logger = require('pomelo-logger').getLogger(__filename);
const Response = require('../../../domain/entity/response');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 修改红点状态
 */
Handler.prototype.getRedPointInfo = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');

    async.waterfall([
        (cb) => {
            redPointDao.getByPlayerId(playerId, areaId,cb);
        },
        (res, cb) => {
            let playerRecord = res;

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                redPointInfo:playerRecord
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
    });
};

/**
 * 修改红点状态
 */
Handler.prototype.upStatus = function(msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let player, playerAwas;
    let type = msg.type * 1;
    let id = msg.id * 1 || 0;
    let status = msg.status * 1 || 0;
    let self = this;

    async.waterfall([
        (cb) => {
            redPointDao.upStatus({type: type, id: id, status: status}, playerId, areaId,cb);
        },
        (res, cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
            }, next);
        }], function (err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_ENERGY
            });
    });
};



var consts = require('../../util/consts');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');
var dbDriver = require('../../drive/dbDriver');

var handle = module.exports;

/**
 * 写入玩家背包日志, ex: [{id:400001, num:1}]
 * 
 * @param {Object} items
 * @param {String} form
 * @param {Number} playerId
 * @param {Number} areaId
 * @param {Function} next
 */
handle.write = function (items, from, playerId, areaId, next) {
    if (items.length === 0) {
        utils.invokeCallback(next, null);
        return;
    }
    var now = Date.now();
    var date = utils.toDateFormat(now);
    var client = dbDriver.get(areaId, consts.DB.Log.name);
    if (!client || !client.insert) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    var sql = 'insert into log_player_bag(playerId, itemId, num, `from`, create_date, create_time) values';
    var args = [];
    var values = '';
    items.forEach(function (item) {
        values += values === '' ? '(?,?,?,?,?,?)' : ',(?,?,?,?,?,?)';
        args.push(playerId, (item.id || 0), (item.num || 0), from, date, now);
    });
    sql += values;

    client.insert(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('log write error:' + err.stack);
            utils.invokeCallback(next, err.message);
            return;
        }
        utils.invokeCallback(next, null);
    });
};

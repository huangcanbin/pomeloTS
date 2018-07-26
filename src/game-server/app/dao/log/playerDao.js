
var consts = require('../../util/consts');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../../util/utils');
var dbDriver = require('../../drive/dbDriver');

var handle = module.exports;

/**
 * 写入玩家成长日志
 */
handle.write = function (ops, from, playerId, areaId, next) {
    var now = Date.now();
    var date = utils.toDateFormat(now);
    var client = dbDriver.get(areaId, consts.DB.Log.name);
    if (!client || !client.insert) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    var sql = 'insert into log_player(playerId, lv, exp, exp_inc, gold, gold_inc, money, money_inc, energy, energy_inc, bean, bean_inc, `from`, create_date, create_time) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
    var args = [playerId,
        ops.lv || 0,
        ops.exp || 0,
        ops.incExp || 0,
        ops.gold || 0,
        ops.incGold || 0,
        ops.money || 0,
        ops.incMoney || 0,
        ops.energy || 0,
        ops.incEnergy || 0,
        ops.bean || 0,
        ops.incBean || 0,
        from, date, now];
        
    client.insert(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('log write error:' + err.stack);
            utils.invokeCallback(next, err.message);
            return;
        }
        utils.invokeCallback(next, null);
    });
};

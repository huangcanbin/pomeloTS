var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../util/utils');
var consts = require('../util/consts');

var dbLoader = module.exports;

dbLoader.load = function (table, cb) {
    var sql = 'select * from ' + table;
    var args = [];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('loader table:"' + table + '" failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
            return;
        }

        if (!!res && res.length > 0) {
            logger.info('loader table:"' + table + '"' + res.length + ' rows.');
            utils.invokeCallback(cb, null, res);
        } else {
            utils.invokeCallback(cb, null, []);
        }
    });

};

//获取配置总表config
dbLoader.getConfig = function (table,cb) {
    var sql = 'select name,data,status,version from ' + table;
    var args = [];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('loader table:"' + table + '" failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
            return;
        }

        if (!!res && res.length > 0) {
            logger.info('loader table:"' + table + '"' + res.length + ' rows.');
            utils.invokeCallback(cb, null, res);
        } else {
            utils.invokeCallback(cb, null, []);
        }
    });
}

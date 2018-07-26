var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var dbDriver = require('../drive/dbDriver');
var utils = require('../util/utils');
var consts = require('../util/consts');


var handle = module.exports;

/**
 * create hero log object
 */
handle.createMany = function (heros, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("HeroLog", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }

        col.insertMany(heros, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }
            close();
            utils.invokeCallback(next, null);
        });
    });
};
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var dbDriver = require('../drive/dbDriver');
var utils = require('../util/utils');
var consts = require('../util/consts');
var Player = require('../domain/entity/player');
var Daily = require('../domain/entity/daily');
var Goblin = require('../domain/entity/goblin');

var handle = module.exports;

/**
 * create exchangeHero object
 */
handle.create= function (exchangeHero, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("ExchangeHero", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        col.insertOne(exchangeHero, function (err, res) {
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

/**
 * get exchangeHero for player
 */
handle.getByPlayer = function (playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("ExchangeHero", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        var filter = { playerId: playerId };
        col.findOne(filter, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();
            
            utils.invokeCallback(next, null, res);
        });
    });
};

/**
 * set player object
 */
handle.set = function (setter, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("ExchangeHero", function (err, col, cb) {
        if (!!err || !playerId) {
            cb(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        col.findOneAndUpdate({ playerId: playerId }, setter, { upsert: true, returnOriginal: false }, function (err, res) {
            if (!!err) {
                cb();
                utils.invokeCallback(next, err, null);
                return;
            }
            cb();
            utils.invokeCallback(next, null, res);
        });
    });
};
var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var dbDriver = require('../drive/dbDriver');
var utils = require('../util/utils');
var consts = require('../util/consts');
var Lineup = require('../domain/entity/lineup');


var handle = module.exports;

/**
 * create lineup object
 */
handle.create = function (lineup, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Lineup", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }
        var entity = new Lineup({
            playerId: playerId,
            pos: lineup.pos,
            lv: lineup.lv,
            starLv: lineup.starLv,
            propLv: lineup.propLv,
            skillLv: lineup.skillLv
        });
        col.insertOne(entity, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();
            utils.invokeCallback(next, null, entity);
        });
    });
};

/**
 * create lineup object, ex: [{lineup:{}, pos:1}]
 */
handle.createMany = function (lineups, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Lineup", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }
        var entitys = [];
        var entity;
        lineups.forEach(function (el) {
            entity = new Lineup({
                playerId: playerId,
                pos: el.pos,
                lv: el.lv,
                starLv: el.starLv,
                propLv: el.propLv,
                skillLv: el.skillLv
            });
            entitys.push(entity);
        }, this);
        col.insertMany(entitys, function (err, res) {
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
 * 修改阵位信息
 */
handle.setLineup = function (setter, pos, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Lineup", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }

        col.findOneAndUpdate({ pos: pos, playerId: playerId }, setter, { returnOriginal: false }, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }
            close();
            var setLineup = builBackd(res.value);
            utils.invokeCallback(next, null, setLineup);
        });
    });
};

/**
 * get lineup list for player
 */
handle.getByPlayer = function (playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Lineup", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        var entity = { playerId: playerId };
        col.find(entity).sort({ pos: 1 }).toArray(function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }
            close();
            var roles = [];
            if (!!res && res.length > 0) {
                for (var i = 0; i < res.length; i++) {
                    var r = res[i];
                    roles.push({
                        id: r._id,
                        playerId: r.playerId,
                        pos: r.pos,
                        lv: r.lv,
                        starLv: r.starLv,
                        propLv: r.propLv,
                        skillLv: r.skillLv
                    });
                }
            }
            utils.invokeCallback(next, null, roles);
        });
    });
};



/**
 * get lineup list for player
 */
handle.getByPos = function (playerId, pos, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Lineup", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        var entity = { playerId: playerId, pos: pos };
        col.findOne(entity, function (err, res) {
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

function builBackd(res) {
    return {
        pos: res.pos,
        lv: res.lv,
        starLv: res.starLv,
        propLv: res.propLv,
        skillLv: res.skillLv
    };
}
const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const consts = require('../util/consts');
const Hero = require('../domain/entity/hero');
const async = require('async');
const illustratedDao = require('./illustratedDao');
const playerDao = require('./playerDao');


var handle = module.exports;

/**
 * get Connect
 */
function _getConnect(areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Hero", function (err, col, close) {
        utils.invokeCallback(next, err, col, close);
    });
}

/**
 * create hero object
 */
handle.create = function (hero, player, playerId, areaId, next) {
    _getConnect(areaId, (err, col, close) => {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }
        _getMaxPos(playerId, col, (err, maxPos) => {
            if (!!err) {
                close(); //release connect
                utils.invokeCallback(next, err);
                return;
            }
            var pos = player.maxHeroLineup > maxPos && hero.id != consts.Enums.materialHero ? (maxPos + 1) : 0;
            _create(hero, pos, playerId, areaId, col, (err, res) => {
                close();
                utils.invokeCallback(next, err, res);
            });
        });
    });
};

/**
 * create hero object
 */
handle.createHasPos = function (hero, pos, playerId, areaId, next) {
    _getConnect(areaId, (err, col, close) => {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }

        _create(hero, pos, playerId, areaId, col, (err, res) => {
            close();
            utils.invokeCallback(next, err, res);
        });
    });
};

function _create(hero, pos, playerId, areaId, col, next) {
    var entity = new Hero({
        playerId: playerId,
        heroId: hero.id,
        pos: pos
    });

    col.insertOne(entity, function (err, res) {
        if (!!err) {
            utils.invokeCallback(next, err, null);
            return;
        }

        //创建主角式神不更新
        if (pos !== 1) {
            playerDao.setPlayer({
                $inc: {
                    heroNum: 1
                }
            }, playerId, areaId);

            entity.hid = res.insertedId.toString();

            //创建图鉴
            illustratedDao.create(entity, playerId, areaId, () => {
                //更新战斗力
                playerDao.upPower(playerId, areaId);
            });
        }

        utils.invokeCallback(next, null, entity);
    });
}

/**
 * create hero object, ex: [{hero:{}, pos:1}]
 */
handle.createMany = function (heros, player, playerId, areaId, next) {
    _getConnect(areaId, (err, col, close) => {
        if (!!err) {
            close();
            utils.invokeCallback(next, err);
            return;
        }
        _getMaxPos(playerId, col, (err, maxPos) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            _createMany(heros, player, maxPos, playerId, areaId, col, (err, res) => {
                close();
                utils.invokeCallback(next, err, res);
            });
        });
    });
};

function _createMany(heros, player, maxPos, playerId, areaId, col, next) {
    let pos = maxPos;

    let entitys = heros.select((t) => {
        let entPos = 0;
        if (player.maxHeroLineup > pos && t.hero.id != consts.Enums.materialHero) {
            entPos = ++pos;
        }

        return new Hero({
            playerId: playerId,
            heroId: t.hero.id,
            pos: entPos
        });
    });

    col.insertMany(entitys, function (err, res) {
        if (!!err) {
            utils.invokeCallback(next, err);
            return;
        }
        playerDao.setPlayer({
            $inc: {
                heroNum: entitys.length
            }
        }, playerId, areaId)

        //创建图鉴
        illustratedDao.createMany(entitys, playerId, areaId, () => {
            //更新战斗力
            playerDao.upPower(playerId, areaId);
        });

        let hids = res.insertedIds;
        let reHeros = [];

        if (heros.length > 0) {
            entitys = entitys.joinArray(hids, (t) => {
                return { hid: t.toString() };
            });

            reHeros = entitys.select((t) => {
                return {
                    heroId: t.heroId,
                    hid: t.hid,
                    pos: t.pos
                };
            });
        }

        utils.invokeCallback(next, null, reHeros);
    });
}

/**
 * 修改式神
 */
handle.setHero = function (setter, id, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Hero", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }

        col.updateOne({ _id: id, playerId: playerId }, setter, function (err, res) {
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
 * get hero list for player
 */
handle.getByPlayer = function (playerId, areaId, next) {
    handle.get({
        playerId: playerId
    }, areaId, next);
};


/**
 * 获取玩家上阵的式神
 */
handle.getLineup = function (playerId, areaId, next) {
    handle.get({
        playerId: playerId,
        pos: { $gt: 0 }
    }, areaId, next);
};

/**
 * 根据式神id获取玩家未上阵的式神
 */
handle.getNoLineup = function (playerId, heroIds, areaId, next) {
    handle.get({
        playerId: playerId,
        pos: 0,
        heroId: {
            $in: heroIds
        }
    }, areaId, next);
};

/**
 * get hero list
 */
handle.get = function (query, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Hero", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        col.find(query).sort({ pos: 1 }).toArray(function (err, res) {
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
                        heroId: r.heroId,
                        playerId: r.playerId,
                        pos: r.pos
                    });
                }
            }
            utils.invokeCallback(next, null, roles);
        });
    });
};


/**
 * delete Many hero by id array
 */
handle.deleteMany = function (idArray, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Hero", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        col.deleteMany({ _id: { $in: idArray } }, function (err, res) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }
            playerDao.setPlayer({
                $inc: {
                    heroNum: -idArray.length
                }
            }, playerId, areaId)

            close();
            utils.invokeCallback(next, null);
        });
    });
};

/**
 * get hero count for player
 */
handle.count = function (playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Hero", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        var entity = { playerId: playerId };
        col.count(entity, function (err, count) {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            close();
            utils.invokeCallback(next, null, count);
        });
    });
};

/**
 * 式神背包格子是否足够
 */
handle.isEnoughHeroBag = function (nums, player, playerId, areaId, next) {
    let num = 0;    //本次得到的式神数量
    let heroCount = 0;  //已有的式神数量

    nums.forEach(function (el) {
        num += el;
    }, this);

    async.waterfall([
        function (cb) {
            if (num > 0) {
                //获取已有的式神数量
                handle.count(playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, 0);
            }
        },
        function (res, cb) {
            heroCount = res + num;

            if (player.heroBagNum < heroCount) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_BAG_HERO_OVERFLOW
                });
                return;
            }

            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: ''
            });
            return;
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

/**
 * get hero count for player
 */
handle.getMaxPos = function (playerId, areaId, next) {
    _getConnect(areaId, (err, col, close) => {
        if (!!err) {
            close();
            utils.invokeCallback(next, err, null);
            return;
        }

        _getMaxPos(playerId, col, (err, res) => {
            close();
            utils.invokeCallback(next, err, res);
        });
    });
};

function _getMaxPos(playerId, col, next) {
    var entity = [
        { $match: { playerId: playerId } },
        { $group: { _id: '$playerId', maxPos: { $max: "$pos" } } }
    ];
    col.aggregate(entity, {}, function (err, result) {
        if (!!err) {
            utils.invokeCallback(next, err, null);
            return;
        }

        utils.invokeCallback(next, null, result[0].maxPos);
    });
}

/**
 * use heros
 */
handle.useHeros = function (ids, areaId, next) {
    _getConnect(areaId, (err, col, close) => {
        if (!!err) {
            close();
            utils.invokeCallback(next, err);
            return;
        }

        var entity = {
            _id: { $in: ids }
        };
        col.deleteMany(entity, function (err, result) {
            if (!!err) {
                utils.invokeCallback(next, err);
                return;
            }
            console.log('Use hero[%d] success.', ids);
            utils.invokeCallback(next, null);
        });
    });
}
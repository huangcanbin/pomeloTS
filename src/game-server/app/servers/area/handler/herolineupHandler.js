var async = require('async');
var consts = require('../../../util/consts');
var heroDao = require('../../../dao/heroDao');
var heroLogDao = require('../../../dao/heroLogDao');
var playerDao = require('../../../dao/playerDao');
var lineupDao = require('../../../dao/lineupDao');
var ConfigCache = require('../../../../app/cache/configCache');
var bagLog = require('../../../dao/log/bagDao');
var Lineup = require('../../../domain/entity/lineup');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 获取玩家阵位列表和阵位上的式神
 */
Handler.prototype.query = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player = {};
    var heros = []; //出阵的式神
    var maxHeroLineup = 0;
    var team = { hp: 0, attack: 0, hit: 0, speed: 0, dodge: 0, power: 0 };  //队伍信息

    async.waterfall([
        function (cb) {
            //获取玩家式神列表
            heroDao.getByPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            for (i = 0; i < res.length; i++) {
                var hero = res[i];
                if (hero.pos > 0) {
                    heros.push(hero);
                }
            }
            //获取阵位列表
            lineupDao.getByPlayer(playerId, areaId, cb);
        }, function (res, cb) {
            var lineup = res;

            lineup.forEach(function (el) {
                for (i = 0; i < heros.length; i++) {
                    var hero = heros[i];
                    if (hero.pos === el.pos) {
                        el.hid = hero.id;
                        el.heroId = hero.heroId;
                        break;
                    }
                }
            });

            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                lineup: lineup
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

/**
 * 提前开启式神位
 */
Handler.prototype.add = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player = {};
    var maxHeroLineup = 0;
    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            //获取最大阵位编号
            maxHeroLineup = player.maxHeroLineup;

            if (maxHeroLineup >= ConfigCache.getVar.const(consts.Keys.HERO_LINEUP_EXT_MAX)) {
                //扩充上限
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_EXT_MAX
                });
                return;
            }

            //计算开启价格,勾玉消耗=（位置编号-初始阵数）*基础价格；
            let knum = ConfigCache.getVar.const(consts.Keys.HERO_LINEUP_INIT_NUM) - 1;
            var price = (maxHeroLineup - knum) * ConfigCache.getVar.const(consts.Keys.HERO_LINEUP_EXT_PRICE);

            if (player.money < price) {
                //勾玉不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                });
                return;
            }

            //扣除勾玉,添加式神阵位
            playerDao.setPlayer({
                $inc: {
                    money: -price,
                    maxHeroLineup: 1
                }
            }, playerId, areaId, cb);
        }, function (res, cb) {
            //添加式神阵位
            lineupDao.create(new Lineup({ pos: (maxHeroLineup + 1) }), playerId, areaId, cb);
        },
        function (cb) {
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

/**
 * 式神上阵
 */
Handler.prototype.setHero = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var heros;
    var player;
    var pos = 1 * msg.pos;
    var hid = msg.hid;
    var selHero;   //选择的式神

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            if (player.maxHeroLineup < pos) {
                //式神阵位未开启
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HERO_LINEUP_DXDP
                });
                return;
            }

            //获取玩家式神列表
            heroDao.getByPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            heros = res;

            heros.forEach(function (el) {
                if (el.id.equals(hid)) {
                    selHero = el;
                    return;
                }
            });

            if (!selHero) {
                //选择的式神不存在
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HERO_NOT_EXIST
                });
                return;
            }

            var oldHero;
            heros.forEach(function (el) {
                if (el.pos === pos) {
                    oldHero = el;
                    return;
                }
            });

            if (!!oldHero) {
                //原来式神,设置位置为0
                heroDao.setHero({
                    $set: {
                        pos: 0
                    }
                }, oldHero.id, playerId, areaId, cb);
            }
            else {
                cb("");
            }
        },
        function (cb) {
            //新式神设置相应的位置
            heroDao.setHero({
                $set: {
                    pos: pos
                }
            }, selHero.id, playerId, areaId, cb);
        },
        (cb) => {
            //更新战斗力
            playerDao.upPower(playerId, areaId, cb);
        },
        (res, cb) => {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
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


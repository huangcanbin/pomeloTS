const consts = require('../../../util/consts');
const logger = require('pomelo-logger').getLogger(__filename);
const utils = require('../../../util/utils');
const arrayUtil = require('../../../util/arrayUtil');
const async = require('async');
const Formula = require('../../../util/formula');
const ConfigCache = require('../../../cache/configCache');
const playerDao = require('../../../dao/playerDao');
const playerDailyTaskDao = require('../../../dao/playerDailyTaskDao');
const playerLog = require('../../../dao/log/playerDao');
const bagDao = require('../../../dao/bagDao');
const bagLog = require('../../../dao/log/bagDao');
const Response = require('../../../domain/entity/response');
const ItemBuilder = require('../../../cache/itemBuilder');
const Goblin = require('../../../domain/entity/goblin');
const playerTaskDao = require('../../../dao/playerTaskDao');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 进入百鬼界面
 */
Handler.prototype.entry = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player;
    var maxBean = 0, reTime = 0, incBean;
    var now = Date.now();
    let bosses = [];
    let poiPha = 5; //关卡和boss需要的关卡阶段关系(玩家到32关,可以随机到point是30~34的boss)

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        maxBean = ConfigCache.getVar.const(consts.Keys.BEAN_MAX);
        reTime = ConfigCache.getVar.const(consts.Keys.BEAN_INTERVAL);

        let cfgs = ConfigCache.getAll.goblin();

        cfgs = arrayUtil.dictionaryToArray(cfgs, t => { return true; });

        //可以随机到boss的最小关卡
        var minPoint = parseInt((player.maxStage - 1) / poiPha) * poiPha;

        //最大关卡数的配置
        let getCfgs = cfgs.where(t => {
            return t.point > minPoint && t.point <= (minPoint + poiPha);
        });

        //防止出现配置断层
        if (getCfgs.length <= 0) {
            getCfgs = cfgs.where(t => {
                return t.point <= (minPoint + poiPha);
            });

            if (getCfgs.length > 0) {
                getCfgs = [getCfgs[getCfgs.length - 1]];
            }
        }

        bosses = getCfgs.select(t => {
            let items = t.items.select(j => { return j.id; });
            return { bossId: t.id, needBean: t.bean, items: items };
        });

        //结算仙豆
        Formula.settleRecoverBean(now, player.lastBean, player.bean, function (inc) {
            incBean = inc;
        });

        if (incBean > 0) {
            playerDao.setPlayer({
                $set: {
                    lastBean: now
                },
                $inc: {
                    bean: incBean
                }
            }, playerId, areaId, cb);

        } else {
            utils.invokeCallback(cb, null, null);
        }
    }, function (res, cb) {
        if (incBean > 0) {
            player = res;
            //增加日志记录
            var ops = {
                lv: player.lv,
                exp: player.exp,
                gold: player.gold,
                money: player.money,
                energy: player.energy,
                bean: player.bean,
                incBean: incBean
            };
            playerLog.write(ops, 'EntryGoblin', playerId, areaId, cb);
        } else {
            utils.invokeCallback(cb, null);
        }
    }, function (cb) {
        let beanPrice = ConfigCache.getVar.const(consts.Keys.BEAN_PRICE);
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            bosses: bosses,
            ts: reTime,
            bean: player.bean,
            maxBean: maxBean,
            beanPrice: beanPrice
        });
    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_ENTRY_GOBLIN_FAIL
        });
        return;
    });
};

/**
 * 挑战BOSS
 */
Handler.prototype.challenge = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let player, incBean, goblinTime;
    let now = Date.now();
    let poiPha = 5; //关卡和boss需要的关卡阶段关系(玩家到32关,可以随机到point是30~34的boss)
    let cfg;
    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;

        let cfgs = ConfigCache.getAll.goblin();
        //可以随机到boss的最小关卡
        var minPoint = parseInt(player.maxStage / poiPha) * poiPha;

        cfg = Formula.hitOneFromDict(cfgs, function (t) { return t.point > minPoint && t.point <= (minPoint + poiPha); }, true);

        if (!cfg) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_INTEN
            });
            return;
        }

        if (player.bean < cfg.bean) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NO_BEAN
            });
            return;
        }

        bagDao.isEnoughItemsBag(cfg.items, player, playerId, areaId, cb);
    }, function (res, cb) {
        if (res.code !== consts.RES_CODE.SUC_OK) {
            next(null, res);
            return;
        }

        //结算仙豆
        Formula.settleRecoverBean(now, player.lastBean, player.bean, function (inc) {
            incBean = inc;
        });

        incBean -= cfg.bean;
        goblinTime = Date.now() + (cfg.time * 1000);
        let goblin = new Goblin(cfg);
        goblin.get = false;

        playerDao.setPlayer({
            $set: {
                lastBean: now,
                goblin: goblin
            },
            $inc: {
                bean: incBean
            }
        }, playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        let incNum = consts.Enums.DailyMinInc;
        playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyGoblin, incNum, playerId, areaId); //每日百鬼完成一次的记录
        //增加日志记录
        var ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incBean: incBean
        };
        playerLog.write(ops, 'ChallengeGoblin', playerId, areaId, cb);
    }, function (cb) {
        Response({
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            bossId: cfg.id,
            bean: player.bean,
            maxHp: cfg.maxHp,
            attackTime: goblinTime,
            power: player.power
        }, next);
    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_ENTRY_GOBLIN_FAIL
        });
        return;
    });
};

/**
 * 攻击百鬼BOSS掉落
 */
Handler.prototype.attack = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let remHp = 1 * msg.remHp;
    let now = Date.now();
    let player, boss, item, itemArray = [], cfg, exp = 0, glod = 0;
    let costBean = 1;
    let items = [];
    const intervalMs = 100;   //客户端点击间隔100毫秒/次

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        let boss = player.goblin;

        if (!!boss.get) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_GOBLIN_COMPLETE
            });
            return;
        }

        cfg = ConfigCache.get.goblin(boss.id);
        if (!cfg) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_INTEN
            });
            return;
        }

        exp = cfg.exp || 0;
        gold = cfg.gold || 0;
        let ms = (cfg.time || 1) * 1000;            //可挑战时间转毫秒        
        let cliMax = Math.ceil(ms / intervalMs);    //最大可点击次数
        let subHp = (cfg.maxHp || 0) - remHp;       //boss减少的血量
        subHp = subHp <= 0 ? 1 : subHp;
        let cli = Math.ceil(subHp / (player.power || 1));  //根据扣除血量获得用户点击次数

        if (cli > cliMax) {
            //超过正常点击频率返回异常
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_VOID_PARAM
            });
            return;
        }

        exp = exp * cli;
        gold = gold * cli;

        playerDao.setPlayer({
            $inc: {
                exp: exp,
                gold: gold,
                goblinFlag: 1
            },
            $set: {
                'goblin.get': true,
            }
        }, playerId, areaId, cb);
    }, function (res,cb) {
        player = res;
        boss = player.goblin;
        //更新任务
        playerTaskDao.upTask(playerId, areaId, cb);
    }, function (res,cb) {
        if (remHp <= 0) {
            //击杀boss
            for (let i = 0; i < cfg.items.length; i++) {
                let t = cfg.items[i];
                if (Formula.isHit(t.weight)) {
                    items.push(t);
                }
            }

            if (items.length > 0) {
                itemMap = new ItemBuilder(items, ConfigCache.items());

                //增加物品
                itemArray = itemMap.getItem();
                bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null);
            }
        }
        else {
            utils.invokeCallback(cb, null);
        }
    }, function (cb) {
        //增加日志记录
        var ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incBean: -costBean
        };
        playerLog.write(ops, 'AttackGoblin', playerId, areaId, cb);
    }, function (cb) {
        //增加日志记录
        if (itemArray.length > 0) {
            bagLog.write(itemArray, 'AttackGoblin', playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null);
        }
    }, function (cb) {
        items = items.select(t => {
            return { id: t.id, type: t.type, num: t.num };
        });

        if (exp > 0) {
            items.push({ id: 200000, type: 2, num: exp });
        }
        if (gold > 0) {
            items.push({ id: 100000, type: 1, num: gold });
        }

        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            items: items
        });
    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_ATTACK_GOBLIN_FAIL
        });
        return;
    });
};

/**
 * 补充仙豆
 */
Handler.prototype.buy = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var incBean = (1 * msg.num);
    var player;
    var costMoney = 0;

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);

    }, function (res, cb) {
        player = res;
        maxBean = ConfigCache.getVar.const(consts.Keys.BEAN_MAX);
        if (player.bean >= maxBean) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_BUY_BEAN_IS_FULL
            });
            return;
        }

        if (incBean === 0) {
            //all
            incBean = maxBean - player.bean;
        }

        costMoney = ConfigCache.getVar.const(consts.Keys.BEAN_PRICE) * incBean;

        if (player.money < costMoney) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NOT_MENOY
            });
            return;
        }

        playerDao.setPlayer({
            $inc: {
                bean: incBean,
                money: -costMoney
            }
        }, playerId, areaId, cb);

    }, function (res, cb) {
        player = res;
        //增加日志记录
        var ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incMoney: -costMoney,
            incBean: incBean
        };
        playerLog.write(ops, 'BuyBean', playerId, areaId, cb);

    }, function (cb) {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            money: player.money,
            bean: player.bean
        });

    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_BUY_BEAN_FAIL
        });
        return;
    });
};

/**
 * 刷新百鬼BOSS
 */
/* Handler.prototype.refresh = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player, boss;
    var items = [];
    var costMoney = 0;

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);

    }, function (res, cb) {
        player = res;
        boss = player.goblin;
        costMoney = ConfigCache.getVar.const(consts.Keys.GOBLIN_COST_MONEY);

        if (player.money < costMoney) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NOT_MENOY
            });
            return;
        }

        goblin = Formula.hitOneFromDict(ConfigCache.getAll.goblin(), function (r) {
            return r.id !== boss.id; //排除当前的BOSS
        }, true);
        if (!goblin) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_REFRESH_GOBLIN_FAIL
            });
            return;
        }
        goblin.items.forEach(function (el) {
            items.push(el.id);
        });
        boss = new Goblin(goblin);

        playerDao.setPlayer({
            $set: {
                goblin: boss
            },
            $inc: {
                money: -costMoney
            }
        }, playerId, areaId, cb);

    }, function (res, cb) {
        player = res;
        //增加日志记录
        var ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incMoney: -costMoney
        };
        playerLog.write(ops, 'RefreshGoblin', playerId, areaId, cb);

    }, function (cb) {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            money: player.money,
            bossId: boss.id,
            hp: boss.hp,
            maxHp: boss.maxHp,
            items: items
        });
    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_REFRESH_GOBLIN_FAIL
        });
        return;
    });
}; */
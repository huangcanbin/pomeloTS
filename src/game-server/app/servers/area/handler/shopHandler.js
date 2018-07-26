var async = require('async');
var consts = require('../../../util/consts');
var heroDao = require('../../../dao/heroDao');
var playerDao = require('../../../dao/playerDao');
var exchangeHeroDao = require('../../../dao/exchangeHeroDao');
var bagDao = require('../../../dao/bagDao');
var ConfigCache = require('../../../../app/cache/configCache');
var Formula = require('../../../util/formula');
var ObjectID = require('mongodb').ObjectID;
var Hero = require('../../../domain/entity/hero');
var ItemBuilder = require('../../../cache/itemBuilder');
var utils = require('../../../util/utils');
var PushConsumeModel = require('../../../domain/entity/pushConsumeModel');
var pushDataToSdService = require('../../../services/pushDataToSdService');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 物品商店列表
 */
Handler.prototype.item = function (msg, session, next) {
    var cfg = ConfigCache.getAll.shop();
    var items = [];

    for (var key in cfg) {
        var item = cfg[key];
        items.push({
            itemId: item.itemId,
            type: item.type,
            price: item.price
        });
    }

    next(null, {
        code: consts.RES_CODE.SUC_OK,
        msg: '',
        items: items
    });
};

/**
 * 购买物品
 */
Handler.prototype.buyItem = function (msg, session, next) {
    var itemId = 1 * msg.itemId;
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player, gold = 0, money = 0, bagCount = 0;

    var shopcfg = ConfigCache.get.shop(itemId);
    var itemcfg = ConfigCache.get.item(itemId);
    if (!shopcfg || !itemcfg) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
        });
        return;
    }

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            if (shopcfg.type == 0) {
                if (shopcfg.price > player.gold) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_GOLD
                    });
                    return;
                }
                gold = shopcfg.price;
            } else {
                if (shopcfg.price > player.money) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_MENOY
                    });
                    return;
                }
                money = shopcfg.price;
            }

            bagDao.count(itemcfg.type, player, areaId, cb);
        }, function (res, cb) {
            bagCount = res;

            if (itemcfg.type == consts.Enums.ItemType.Prop) {
                //道具
                if (player.propBagNum <= bagCount) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_BAG_PROP_OVERFLOW
                    });
                    return;
                }
            }
            else {
                //材料
                if (player.matBagNum <= bagCount) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_BAG_MAT_OVERFLOW
                    });
                    return;
                }
            }
            //减金币/勾玉
            playerDao.setPlayer({
                $inc: {
                    gold: -gold,
                    money: -money
                }
            }, playerId, areaId, cb);
        }, function (res, cb) {
            player = res;

            if (money > 0) {
                let pushModel = new PushConsumeModel({
                    serverID: areaId,     //areaId
                    type: consts.Enums.consumeType.buyItem,
                    accountID: playerId,
                    number: money,
                    itemType: itemId,
                    price: money
                });

                pushDataToSdService.pushConsume(pushModel);
            }

            var itemType = utils.getItemType(itemId);
            var itemMap = new ItemBuilder([{
                id: itemId,
                type: itemType,
                num: 1
            }], ConfigCache.items());
            var itemArray = itemMap.getItem();

            bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
        }, function (res, cb) {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                money: player.money,
                gold: player.gold
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
 * 式神商店列表
 */
Handler.prototype.hero = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var hitItems = [];
    var shopHeroNum = 6;    //商店展示的可以兑换式神个数
    var refreshMoney = ConfigCache.getVar.const(consts.Keys.SHOP_HERO_REFRESH_PRICE);

    async.waterfall([
        function (cb) {
            exchangeHeroDao.getByPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            var exchangeHero = res;

            var date = utils.getDateOfHour(0, 0, 0);
            //刷新时间小于今天0点
            if (!exchangeHero || exchangeHero.refreshTime < date) {
                //获取式神兑换池
                var heroPool = ConfigCache.getAll.shopHeroPool();

                //根据权重获取6个式神信息
                for (var i = 0; i < shopHeroNum; i++) {
                    var hitItem = Formula.hitOneFromDict(heroPool, function (p) {
                        for (var j = 0; j < hitItems.length; j++) {
                            if (hitItems[j].heroId === p.heroId) {
                                return false;
                            }
                        }
                        return true;
                    }, true);
                    hitItems.push({ heroId: hitItem.heroId, exchange: false, heroFragment: hitItem.fragment });
                }

                if (!exchangeHero) {
                    //插入兑换式神信息
                    var entity = {
                        playerId: playerId,
                        refreshCount: 0,
                        refreshTime: Date.now(),
                        heros: hitItems
                    };

                    exchangeHeroDao.create(entity, areaId, function () {
                        next(null, {
                            code: consts.RES_CODE.SUC_OK,
                            msg: '',
                            refreshMoney: refreshMoney,
                            heros: hitItems
                        });
                    });
                }
                else {
                    //更新兑换式神信息
                    exchangeHeroDao.set({
                        $set: {
                            refreshCount: 0,
                            refreshTime: Date.now(),
                            heros: hitItems
                        }
                    }, playerId, areaId, function () {
                        next(null, {
                            code: consts.RES_CODE.SUC_OK,
                            msg: '',
                            refreshMoney: refreshMoney,
                            heros: hitItems
                        });
                    });
                }
            }
            else {
                //返回式神信息
                next(null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    refreshMoney: refreshMoney,
                    heros: exchangeHero.heros
                });
            }
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
 * 兑换式神
 */
Handler.prototype.exchangeHero = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var heroId = 1 * msg.heroId;
    var exchangeHero, selHero = null, player, heroCount, heroCfg;
    async.waterfall([
        function (cb) {
            exchangeHeroDao.getByPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            exchangeHero = res;

            if (!exchangeHero) {
                //未找到信息
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }

            var heros = exchangeHero.heros;
            for (var i = 0; i < heros.length; i++) {
                if (heros[i].heroId === heroId) {
                    selHero = heros[i];
                    break;
                }
            }

            if (!selHero) {
                //选择的式神不能兑换
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HERO_NOT_EXCHANGE
                });
                return;
            }

            if (selHero.exchange) {
                //式神已经兑换过
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HERO_EXCHANGE
                });
                return;
            }

            heroDao.count(playerId, areaId, cb);
        },
        function (res, cb) {
            heroCount = res;

            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            if (player.heroBagNum <= heroCount) {
                //式神背包空间不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_BAG_HERO_OVERFLOW
                });
                return;
            }

            if (player.heroFragment < selHero.heroFragment) {
                //式神碎片不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FRAGMENT
                });
                return;
            }

            //获取式神配置
            heroCfg = ConfigCache.get.hero(heroId);
            if (!heroCfg) {
                //式神不存在
                logger.error('At HeroTakeTen heroId:%d is not found.', heroId);
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_SUMMON_TAKE
                });
                forResult = false;
                return;
            }

            //扣除式神碎片
            playerDao.setPlayer({
                $inc: {
                    heroFragment: -selHero.heroFragment
                }
            }, playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            //更新为已兑换过状态
            selHero.exchange = true;
            exchangeHeroDao.set({
                $set: {
                    heros: exchangeHero.heros
                }
            }, playerId, areaId, cb);
        },
        function (res, cb) {
            //添加式神
            heroDao.create(heroCfg, player, playerId, areaId, cb);
        },
        function (res, cb) {
            //返回信息
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                heroFragment: player.heroFragment
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
 * 刷新式神商店
 */
Handler.prototype.refreshHero = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var refreshMoney = ConfigCache.getVar.const(consts.Keys.SHOP_HERO_REFRESH_PRICE);
    var player;
    var shopHeroNum = 6;    //todo:需要和商店列表统一
    var hitItems = [];

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            if (player.money < refreshMoney) {
                //勾玉不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                });
                return;
            }

            //扣除勾玉
            playerDao.setPlayer({
                $inc: {
                    money: -refreshMoney
                }
            }, playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            if (refreshMoney > 0) {
                let pushModel = new PushConsumeModel({
                    serverID: areaId,     //areaId
                    type: consts.Enums.consumeType.reHeroShop,
                    accountID: playerId,
                    number: refreshMoney,
                    itemType: consts.Enums.consumeType.reHeroShop,
                    price: refreshMoney
                });

                pushDataToSdService.pushConsume(pushModel);
            }

            //获取式神兑换池
            var heroPool = ConfigCache.getAll.shopHeroPool();

            //根据权重获取6个式神信息
            for (var i = 0; i < shopHeroNum; i++) {
                var hitItem = Formula.hitOneFromDict(heroPool, function (p) {
                    for (var j = 0; j < hitItems.length; j++) {
                        if (hitItems[j].heroId === p.heroId) {
                            return false;
                        }
                    }
                    return true;
                }, true);
                hitItems.push({ heroId: hitItem.heroId, exchange: false, heroFragment: hitItem.fragment });
            }

            //更新兑换式神信息
            exchangeHeroDao.set({
                $set: {
                    heros: hitItems
                },
                $inc: {
                    refreshCount: 1
                }
            }, playerId, areaId, cb);
        },
        function (res, cb) {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                money: player.money,
                heros: hitItems
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
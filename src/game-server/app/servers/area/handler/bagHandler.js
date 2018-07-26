const async = require('async');
const consts = require('../../../util/consts');
const ConfigCache = require('../../../../app/cache/configCache');
const bagDao = require('../../../dao/bagDao');
const heroDao = require('../../../dao/heroDao');
const playerDao = require('../../../dao/playerDao');
const Formula = require('../../../util/formula');
const ItemBuilder = require('../../../cache/itemBuilder');
const utils = require('../../../util/utils');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 获取背包列表
 */
Handler.prototype.queryBags = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player = {}, propBags = [], matBags = [];

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            bagDao.getByPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            var bags = res;

            bags.forEach(function (el) {
                if (el.type == 0) {
                    //道具物品
                    propBags.push(el);
                }
                else {
                    //材料物品
                    matBags.push(el);
                }
            }, this);

            let addBagsPrice = ConfigCache.getVar.const(consts.Keys.BAG_EXT_PRICE);
            let addBagsMax = ConfigCache.getVar.const(consts.Keys.BAG_EXT_MAX);

            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                propBags: propBags,
                matBags: matBags,
                addBagsPrice: addBagsPrice,
                addBagsMax: addBagsMax,
                propBagExt: player.propBagExt,
                matBagExt: player.matBagExt
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
 * 使用物品
 */
Handler.prototype.useItem = function (msg, session, next) {
    var itemId = 1 * msg.itemId;    //物品编号
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var itemCfg, itemIds = [], heroIds = [], nums = [], heros = [], items = [];
    let player;
    var sucok = function () {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            itemIds: itemIds,
            heroIds: heroIds,
            nums: nums
        });
    };
    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            //获取物品配置
            itemCfg = ConfigCache.get.item(itemId);
            if (!itemCfg) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }

            switch (itemCfg.logicType) {
                case consts.Enums.ItemLogicType.Item:
                    itemIds = itemCfg.ids;
                    nums = itemCfg.nums;
                    items = itemCfg.items;
                    break;
                case consts.Enums.ItemLogicType.Hero:
                    heroIds = itemCfg.ids;
                    nums = itemCfg.nums;
                    heros = itemCfg.heros;
                    break;
                case consts.Enums.ItemLogicType.DrawHero:
                    //获取抽奖配置
                    var hitSet = ConfigCache.getAll.heroLottery();
                    //式神抽奖
                    var hitItem = Formula.hitOneFromDict(hitSet, function (p) { return p.type === itemCfg.ids; }, true);
                    var heroId = hitItem.heroId;
                    var hero = ConfigCache.get.hero(heroId);
                    if (!hero) {
                        //式神不存在
                        logger.error('At HeroTakeTen heroId:%d is not found.', heroId);
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_SUMMON_TAKE
                        });
                        return;
                    }

                    heroIds.push(heroId);
                    nums.push(1);
                    heros.push({
                        hero: { id: heroId }
                    });
                    //添加式神
                    break;
                case consts.Enums.ItemLogicType.DrawItem:
                    //物品抽奖
                    var itemHitSet = ConfigCache.getAll.itemLottery();
                    //式神抽奖
                    var itemHitItem = Formula.hitOneFromDict(itemHitSet, function (p) { return p.type === itemCfg.ids; }, true);
                    itemIds.push(itemHitItem.itemId);
                    nums.push(itemHitItem.num);
                    items = [itemHitItem.item];
                    break;
                default:
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_ITEM_NOT_USE
                    });
                    return;
            }

            if (items.length > 0) {
                bagDao.isEnoughItemsBag(items, player, playerId, areaId, cb);
            }
            else if (heros.length > 0) {
                heroDao.isEnoughHeroBag(nums, player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                });
            }
        },
        function (res, cb) {
            if (res.code !== consts.RES_CODE.SUC_OK) {
                next(null, res);
                return;
            }

            bagDao.useItem(itemId, 1, false, playerId, areaId, cb); //使用物品
        },
        function (res, cb) {
            if (!res) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_ITEM
                });
                return;
            }

            if (itemCfg.logicType == consts.Enums.ItemLogicType.Item || itemCfg.logicType == consts.Enums.ItemLogicType.DrawItem) {
                var gold = itemCfg.getGlod;
                var exp = itemCfg.getExp;
                var money = itemCfg.getMoney;
                if (gold > 0 || exp > 0 || money > 0) {
                    playerDao.setPlayer({
                        $inc: {
                            gold: gold,
                            exp: exp,
                            money: money
                        }
                    }, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null, null);
                }
            }
            else {
                heroDao.createMany(heros, player, playerId, areaId, function () {
                    sucok();
                });

                return;
            }
        }, function (res, cb) {
            var itemMap = new ItemBuilder(items, ConfigCache.items());
            var itemArray = itemMap.getItem();
            if (itemArray && itemArray.length > 0) {
                bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
            }
            else {
                sucok();
                return;
            }
        }, function (cb) {
            sucok();
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
 * 合成物品
 */
Handler.prototype.composeItem = function (msg, session, next) {
    var itemId = 1 * msg.itemId;    //物品编号
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var itemCfg, player;

    var sucok = function () {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            itemId: itemCfg.items[0].id,
            costNum: itemCfg.costItems[0].num,
            costGold: itemCfg.costGlod,
            costMoney: itemCfg.costMoney
        });
    };

    async.waterfall([
        function (cb) {
            //获取物品配置
            itemCfg = ConfigCache.get.item(itemId);
            if (!itemCfg) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }

            if (itemCfg.logicType != consts.Enums.ItemLogicType.Compose) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_ITEM_NOT_COMPOSE
                });
                return;
            }

            playerDao.getPlayer(playerId, areaId, cb);
        }, function (res, cb) {
            player = res;

            if (player.gold < itemCfg.costGlod) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_GOLD
                });
                return;
            }
            if (player.exp < itemCfg.costExp) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_EXP
                });
                return;
            }
            if (player.money < itemCfg.costMoney) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                });
                return;
            }

            bagDao.useItem(itemCfg.id, itemCfg.costItems[0].num, false, playerId, areaId, cb); //使用物品
        },
        function (res, cb) {
            if (!res) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_ITEM
                });
                return;
            }

            var gold = itemCfg.costGlod;
            var exp = itemCfg.costExp;
            var money = itemCfg.costMoney;
            if (gold > 0 || exp > 0 || money > 0) {

                playerDao.setPlayer({
                    $inc: {
                        gold: -gold,
                        exp: -exp,
                        money: -money
                    }
                }, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        }, function (res, cb) {
            var itemMap = new ItemBuilder(itemCfg.items, ConfigCache.items());
            var itemArray = itemMap.getItem();
            if (itemArray && itemArray.length > 0) {
                bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
            }
            else {
                sucok();
                return;
            }
        }, function (cb) {
            sucok();
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
 * 出售物品
 */
Handler.prototype.vendItem = function (msg, session, next) {
    var itemId = 1 * msg.itemId;    //物品编号
    var num = 1 * msg.num;          //出售数量
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var itemCfg, gold;

    async.waterfall([
        function (cb) {
            //获取物品配置
            itemCfg = ConfigCache.get.item(itemId);
            if (!itemCfg) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }

            bagDao.useItem(itemId, num, false, playerId, areaId, cb); //使用物品
        },
        function (res, cb) {
            if (!res) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_ITEM
                });
                return;
            }

            gold = num * itemCfg.gold;

            playerDao.setPlayer({
                $inc: {
                    gold: gold
                }
            }, playerId, areaId, cb);
        }, function (res, cb) {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                gold: gold
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
 * 扩充背包
 */
Handler.prototype.addBags = function (msg, session, next) {
    var type = 1 * msg.type;    //背包类型 0:道具背包 1:材料背包
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player = {}, propBagNum = 0, propBagExt = 0, matBagNum = 0, matBagExt = 0, price = 0, addCell = 5;

    var errExtMax = function () {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_EXT_MAX
        });
    };

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            if (type == 0) {
                if (player.propBagExt >= ConfigCache.getVar.const(consts.Keys.BAG_EXT_MAX)) {
                    //扩充上限
                    errExtMax();
                    return;
                }

                propBagNum = addCell;
                propBagExt = 1;
            }
            else {
                if (player.matBagExt >= ConfigCache.getVar.const(consts.Keys.BAG_EXT_MAX)) {
                    errExtMax();
                    return;
                }

                matBagNum = addCell;
                matBagExt = 1;
            }

            price = ConfigCache.getVar.const(consts.Keys.BAG_EXT_PRICE);

            if (player.money < price) {
                //勾玉不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                });
                return;
            }

            playerDao.setPlayer({
                $inc: {
                    propBagNum: propBagNum,
                    propBagExt: propBagExt,
                    matBagNum: matBagNum,
                    matBagExt: matBagExt,
                    money: -price
                }
            }, playerId, areaId, cb);
        }, function (res, cb) {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                money: res.money,
                bagNum: type == 0 ? res.propBagNum : res.matBagNum,
                bagExt: type == 0 ? res.propBagExt : res.matBagExt,
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
 * 物品表前端配置
 */

Handler.prototype.itemCfg = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let cfg = ConfigCache.getAll.item();
    if (!cfg) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_INTEN
        });
        return;
    }

    var cfgFormat = {}

    for(var i in cfg)
    {
        var idx = cfg[i]["id"]
        cfgFormat[idx] = {
            "id" : cfg[i]["id"],
            "gold": cfg[i]["gold"],
            "logic_ids": cfg[i]["logicIds"].split(",").map(function(data){  
                return +data;  
            }),
            "logic_nums": cfg[i]["logicNums"].split(",").map(function(data){  
                return +data;  
            }),
            "cost_ids": cfg[i]["costIds"].split(",").map(function(data){  
                return +data;  
            }),
            "cost_nums": cfg[i]["costNums"].split(",").map(function(data){  
                return +data;  
            }),
        }
    }
 
    async.waterfall([
        (cb) => {

            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                cfgs: cfgFormat,
            });
        },
    ], (err) => {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};

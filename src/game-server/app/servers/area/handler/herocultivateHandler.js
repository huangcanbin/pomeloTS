const async = require('async');
const utils = require('../../../util/utils');
const consts = require('../../../util/consts');
const heroDao = require('../../../dao/heroDao');
const heroLogDao = require('../../../dao/heroLogDao');
const playerDao = require('../../../dao/playerDao');
const lineupDao = require('../../../dao/lineupDao');
const ConfigCache = require('../../../../app/cache/configCache');
const bagDao = require('../../../dao/bagDao');
const Lineup = require('../../../domain/entity/lineup');
const arrayUtil = require('../../../util/arrayUtil');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 强化阵位(升级，升宝具，进化，升星)
 */
Handler.prototype.intensify = function (msg, session, next) {
    let getCost, setlineup, validation;
    let type = 1 * msg.type;
    switch (type) {
        case 1:
            getCost = function (selLineup) {
                return ConfigCache.get.lvCost(selLineup.lv);
            };
            setlineup = function (pos, playerId, areaId, cb) {
                //更新等级
                lineupDao.setLineup({
                    $inc: {
                        lv: 1
                    }
                }, pos, playerId, areaId, cb);
            };
            validation = function (selLineup) {
                var cfg = ConfigCache.get.lvCost(selLineup.lv + 1);
                if (!cfg) {
                    return consts.RES_MSG.ERR_LV_MAX;
                }
                else if (cfg.starLv != selLineup.starLv) {
                    //升级后的星级不匹配当前星级
                    return consts.RES_MSG.ERR_NOT_STARLV;
                }
                else {
                    return null;
                }
            };
            break;
        case 2:
            getCost = function (selLineup) {
                //宝具等级从0开始,所以获取升到下一级的消耗
                return ConfigCache.get.propCost(selLineup.propLv + 1);
            };
            setlineup = function (pos, playerId, areaId, cb) {
                //更新宝具等级
                lineupDao.setLineup({
                    $inc: {
                        propLv: 1
                    }
                }, pos, playerId, areaId, cb);
            };
            validation = function (selLineup) {
                return null;
            };
            break;
        case 3:
            getCost = function (selLineup) {
                 //技能等级从0开始,所以获取升到下一级的消耗
                return ConfigCache.get.skillCost(selLineup.skillLv + 1);
            };
            setlineup = function (pos, playerId, areaId, cb) {
                //更新技能等级
                lineupDao.setLineup({
                    $inc: {
                        skillLv: 1
                    }
                }, pos, playerId, areaId, cb);
            };
            validation = function (selLineup) {
                return null;
            };
            break;
        case 4:
            getCost = function (selLineup) {
                 //星级从0开始,所以获取升到下一级的消耗
                return ConfigCache.get.starlvCost(selLineup.starLv + 1);
            };
            setlineup = function (pos, playerId, areaId, cb) {
                //更新星级
                lineupDao.setLineup({
                    $inc: {
                        starLv: 1
                    }
                }, pos, playerId, areaId, cb);
            };
            validation = function (selLineup) {
                var cfg = ConfigCache.get.lvCost(selLineup.lv + 1);
                if (!cfg) {
                    return consts.RES_MSG.ERR_LV_MAX;
                }
                else if (cfg.starLv !== (selLineup.starLv + 1)) {
                    //下个等级的星级和升星后的星级不匹配
                    return consts.RES_MSG.ERR_NOT_LV;
                }
                else {
                    return null;
                }
            };
            break;
        default:
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
    }

    intensify(msg, session, next, getCost, setlineup, validation);
};

/**
 * 强化方法
 * @param {*} msg 
 * @param {*} session 
 * @param {*} next 
 * @param {*} cost 获取消耗配置列表函数
 * @param {*} setlineup 更新阵位函数
 */
function intensify(msg, session, next, getCost, setlineup, validation) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let pos = 1 * msg.pos;
    let cost;
    let lineup = {};
    let selLineup;
    let player = {};
    let costGold = 0;   //消耗的金币
    let costExp = 0;    //消耗的经验
    let costItems = [], reCostItems = []; //消耗的物品
    let costHeros = [], costHeroIds = []; //消耗的式神
    let heros = [];

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;
            //获取阵位            
            lineupDao.getByPos(playerId, pos, areaId, cb);
        },
        function (res, cb) {
            selLineup = res;

            if (!selLineup) {
                //无效式神位
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HERO_LINEUP_DXDP
                });
                return;
            }

            cost = getCost(selLineup);
            if (!cost) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }

            var valResult = validation(selLineup);
            if (!!valResult) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: valResult
                });
                return;
            }

            costHeros = cost.heros || [];

            if (costHeros.length > 0) {
                let heroIds = costHeros.select((t) => { return t.heroId; });
                heroDao.getNoLineup(playerId, heroIds, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        },
        function (res, cb) {
            if (!!res) {
                heros = res;
            }

            if (costHeros.length > 0) {
                if (heros.length < costHeros.length) {
                    //式神不足
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_HERO
                    });
                    return;
                }

                for (let i = 0; i < costHeros.length; i++) {
                    let costHero = costHeros[i];
                    let mHero = heros.where((t) => { return t.heroId === costHero.heroId; });
                    if (costHero.num > mHero.length) {
                        //式神不足
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_NOT_HERO
                        });
                        return;
                    }
                    else {
                        for (let j = 0; j < costHero.num; j++) {
                            costHeroIds.push(mHero[j].id);
                        }
                    }
                }
            }

            //获取消耗
            cost.items.forEach(function (el) {
                switch (el.type) {
                    case 0:
                        break;
                    case 1:
                        costGold += el.num;
                        break;
                    case 2:
                        costExp += el.num;
                        break;
                    default:
                        costItems.push(el);
                        reCostItems.push({
                            itemId: el.id,
                            num: el.num
                        });
                        break;
                }
            });

            if (player.gold < costGold) {
                //金币不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_GOLD
                });
                return;
            }

            if (player.exp < costExp) {
                //经验不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_EXP
                });
                return;
            }

            //校验物品数量
            var task = [];
            costItems.forEach(function (el) {
                task.push(function (chres, chcb) {
                    if (!chcb) {
                        chcb = chres;
                    }
                    else {
                        if (!chres) {
                            next(null, {
                                code: consts.RES_CODE.ERR_FAIL,
                                msg: consts.RES_MSG.ERR_NOT_ITEM
                            });
                            return;
                        }
                    }

                    bagDao.checkItem(el.id, el.num, playerId, areaId, chcb);
                });
            });

            task.push(function (chres, chcb) {
                if (!chres) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_ITEM
                    });
                    return;
                }

                //扣除经验和金币
                if (costGold > 0 || costExp > 0) {
                    playerDao.setPlayer({
                        $inc: {
                            exp: -costExp,
                            gold: -costGold
                        }
                    }, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, {});
                }
            });

            async.waterfall(task, function (err, result) {
                if (!!err) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
                    });
                    return;
                }
            });
        },
        function (res, cb) {
            //扣除物品数量
            var task = [];
            costItems.forEach(function (el) {
                task.push(function (chres, chcb) {
                    if (!chcb) {
                        chcb = chres;
                    }
                    else {
                        if (!chres) {
                            next(null, {
                                code: consts.RES_CODE.ERR_FAIL,
                                msg: consts.RES_MSG.ERR_NOT_ITEM
                            });
                            return;
                        }
                    }

                    bagDao.useItem(el.id, el.num, false, playerId, areaId, chcb);
                });
            });

            task.push(function (chres, chcb) {
                if (!chcb) {
                    chcb = chres;
                }
                else {
                    if (!chres) {
                        //扣除失败
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_NOT_ITEM
                        });
                        return;
                    }
                }

                //扣除式神
                if (costHeroIds.length > 0) {
                    heroDao.useHeros(costHeroIds, areaId, chcb);
                }
                else {
                    utils.invokeCallback(chcb, null);
                }
            });

            task.push(function (chcb) {
                //阵位属性等级提升
                setlineup(pos, playerId, areaId, cb);
                return;
            });

            async.waterfall(task, function (err, result) {
                if (!!err) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
                    });
                    return;
                }
            });
        },
        (res, cb) => {
            lineup = res;

            //更新战斗力
            playerDao.upPower(playerId, areaId, cb);
        },
        (res, cb) => {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                lineup: lineup,
                costGold: costGold,
                costExp: costExp,
                costItems: reCostItems,
                costHeros: costHeros
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
}

/**
 * 获取强化阵位消耗信息
 */
Handler.prototype.getIntensifyCost = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var getCost, selLineup, lineup, costItems = [], costGold = 0, costExp = 0;
    var type = 1 * msg.type;
    var pos = 1 * msg.pos;
    switch (type) {
        case 1:
            getCost = function (selLineup) {
                return ConfigCache.get.lvCost(selLineup.lv);
            };
            break;
        case 2:
            getCost = function (selLineup) {
                return ConfigCache.get.propCost(selLineup.propLv + 1);
            };
            break;
        case 3:
            getCost = function (selLineup) {
                return ConfigCache.get.skillCost(selLineup.skillLv + 1);
            };
            break;
        case 4:
            getCost = function (selLineup) {
                return ConfigCache.get.starlvCost(selLineup.starLv + 1);
            };
            break;
        default:
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
    }

    async.waterfall([
        function (cb) {
            //获取阵位
            lineupDao.getByPos(playerId, pos, areaId, cb);
        },
        function (res, cb) {
            selLineup = res;

            if (!selLineup) {
                //无效式神位
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HERO_LINEUP_DXDP
                });
                return;
            }

            var cost = getCost(selLineup);
            if (!cost) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }

            //获取消耗
            cost.items.forEach(function (el) {
                switch (el.type) {
                    case 0:
                        break;
                    case 1:
                        costGold += el.num;
                        break;
                    case 2:
                        costExp += el.num;
                        break;
                    default:
                        costItems.push({
                            itemId: el.id,
                            num: el.num
                        });
                        break;
                }
            });

            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                costGold: costGold,
                costExp: costExp,
                costItems: costItems,
                costHeros: cost.heros || []
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
 * 阵位一键升级
 */
Handler.prototype.lineupOneButUpg = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let pos = 1 * msg.pos;
    let player = {};
    let costDic = {};
    let bagItems, bagItemDic = {}, upLv = 0, upCost = {};
    let lineup = {};

    async.waterfall([
        (cb) => {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;

            //获取阵位
            lineupDao.getByPos(playerId, pos, areaId, cb);
        },
        (res, cb) => {
            let selLineup = res;

            if (!selLineup) {
                //无效式神位
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HERO_LINEUP_DXDP
                });
                return;
            }

            //获取当前星级,最大等级前的消耗配置列表
            let costs = getLvCosts(selLineup.starLv, selLineup.lv);

            if (!costs || costs.length <= 0) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }

            let buildC = buildCost(costs);
            costDic = buildC.costDic;
            let costItemIds = buildC.costItemIds;

            if (!!costItemIds && costItemIds.length > 0) {
                //获取玩家背包内拥有的消耗物品
                bagDao.getByItemIds(costItemIds, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, []);
            }
        },
        (res, cb) => {
            bagItems = res;

            bagItemDic = buildBagItemDic(bagItems);

            upCost = getCanUpgradeAndCost(player, costDic, bagItemDic);

            if (upCost.upLv <= 0) {
                //不符合升级条件
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: upCost.msg
                });
                return;
            }

            //扣除经验和金币
            if (upCost.costGold > 0 || upCost.costExp > 0) {
                playerDao.setPlayer({
                    $inc: {
                        exp: -upCost.costExp,
                        gold: -upCost.costGold
                    }
                }, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        },
        (res, cb) => {
            useItem(upCost.costItemsDic, playerId, areaId, cb);
        },
        (res, cb) => {
            if (res.code != consts.RES_CODE.SUC_OK) {
                next(null, res);
                return;
            }

            //更新宝具等级
            lineupDao.setLineup({
                $inc: {
                    lv: upCost.upLv,
                }
            }, pos, playerId, areaId, cb);
        },
        (res, cb) => {
            lineup = res;

            //更新战斗力
            playerDao.upPower(playerId, areaId, cb);
        },
        (res, cb) => {
            let citems = arrayUtil.dictionaryToArray(upCost.costItemsDic, (t) => { return true; });

            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                lineup: {
                    pos: lineup.pos,
                    lv: lineup.lv,
                    starLv: lineup.starLv
                },
                costGold: upCost.costGold,
                costExp: upCost.costExp,
                costItems: citems
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

/**
 * get lv cost config list by starLv and lv
 * @param {*} starLv 
 * @param {*} lv 
 */
function getLvCosts(starLv, lv) {
    let costCfg = ConfigCache.getAll.lvCost();

    let costs = arrayUtil.dictionaryWhere(costCfg, (t) => {
        return (t.starLv === starLv && t.lv >= lv);
    }).sort((a, b) => { return a.lv > b.lv; });

    if (costs.length > 0) {
        //最后一个等级需要升星后提升
        let last = costs[costs.length - 1];
        costs = costs.where((t) => {
            return t.lv !== last.lv;
        });
    }

    return costs;
}

/**
 * build costDic
 * @param {*} costs 
 */
function buildCost(costs) {
    let costDic = {};
    let costItemIds = [];

    for (let i = 0; i < costs.length; i++) {
        let item = costs[i];
        lv = item.lv;
        costDic[lv] = { costGold: 0, costExp: 0, costItems: [] };
        //获取消耗
        for (let j = 0; j < item.items.length; j++) {
            let ele = item.items[j];

            switch (ele.type) {
                case 0:
                    break;
                case 1:
                    costDic[lv].costGold += ele.num;
                    break;
                case 2:
                    costDic[lv].costExp += ele.num;
                    break;
                default:
                    costDic[lv].costItems.push(ele);
                    costItemIds.push(ele.id);
                    break;
            }
        }
    }

    return { costDic: costDic, costItemIds: costItemIds };
}

/**
 * build bagItemDic
 */
function buildBagItemDic(bagItems) {
    let bagItemDic = {};

    for (let i = 0; i < bagItems.length; i++) {
        let bagItem = bagItems[i];
        let tId = bagItem.itemId;

        if (!bagItemDic[tId]) {
            bagItemDic[tId] = { num: 0 };

            bagItemDic[tId].num = bagItems.where((t) => {
                return t.itemId === tId;
            }).sum((t) => { return t.num; });
        }
    }

    return bagItemDic;
}

/**
 * get can upgrade and cost 
 * @param {*} player 
 * @param {*} costDic 
 * @param {*} bagItemDic 
 * @returns upLv: 0, msg: '', costExp: 0, costGold: 0, costItemsDic: {}
 */
function getCanUpgradeAndCost(player, costDic, bagItemDic) {
    //根据玩家等经验、金币、物品计算可以提升的等级
    let gold = player.gold, exp = player.exp;
    let result = { upLv: 0, msg: '', costExp: 0, costGold: 0, costItemsDic: {} };

    for (let i in costDic) {
        let cost = costDic[i];

        if (cost.costExp > exp) {
            result.msg = consts.RES_MSG.ERR_NOT_EXP;
            return result;
        }
        if (cost.costGold > gold) {
            result.msg = consts.RES_MSG.ERR_NOT_GOLD;
            return result;
        }

        if (!hasItem(cost.costItems, bagItemDic)) {
            result.msg = consts.RES_MSG.ERR_NOT_ITEM;
            return result;
        }

        for (let j = 0; j < cost.costItems.length; j++) {
            let costItem = cost.costItems[j];

            //记录消耗的物品和数量
            if (!result.costItemsDic[costItem.id]) {
                result.costItemsDic[costItem.id] = { id: costItem.id, num: costItem.num }
            }
            else {
                result.costItemsDic[costItem.id].num += costItem.num;
            }

            //扩充当前物品数量
            bagItemDic[costItem.id].num -= costItem.num;
        }

        exp -= cost.costExp;
        gold -= cost.costGold;

        result.costExp += cost.costExp;
        result.costGold += cost.costGold;
        result.upLv += 1;
    }

    return result;
}

/**
 * has Item
 */
function hasItem(costItems, bagItemDic) {
    //根据消耗物品的ID判断玩家背包物品数量是否足够
    for (let i = 0; i < costItems.length; i++) {
        let costItem = costItems[i];

        if (!bagItemDic[costItem.id] || costItem.num > bagItemDic[costItem.id].num) {
            return false;
        }
    }

    return true;
}

/**
 * use item
 */
function useItem(costItems, playerId, areaId, next) {
    //扣除物品数量
    let task = [];

    let hasCostItems = false;
    for (let i in costItems) {
        hasCostItems = true;
        let costItem = costItems[i];

        task.push((res, cb) => {
            if (!cb) {
                cb = res;
            }
            else {
                if (!res) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_ITEM
                    });
                    return;
                }
            }

            bagDao.useItem(costItem.id, costItem.num, false, playerId, areaId, cb);
        });
    }

    if (!hasCostItems) {
        next(null, { code: consts.RES_CODE.SUC_OK });
        return;
    }

    task.push(function (res, cb) {
        if (!res) {
            //扣除失败
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NOT_ITEM
            });
            return;
        }
        else {
            //扣除成功
            next(null, { code: consts.RES_CODE.SUC_OK });
            return;
        }
    });

    async.waterfall(task, function (err, result) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
}
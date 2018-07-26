const async = require('async');
const consts = require('../../../util/consts');
const playerDao = require('../../../dao/playerDao');
const towerDao = require('../../../dao/towerDao');
const bagDao = require('../../../dao/bagDao');
const heroDao = require('../../../dao/heroDao');
var illustratedDao = require('../../../dao/illustratedDao');
var lineupDao = require('../../../dao/lineupDao');
const Response = require('../../../domain/entity/response');
const ConfigCache = require('../../../cache/configCache');
const ItemBuilder = require('../../../cache/itemBuilder');
const utils = require('../../../util/utils');
const arrayUtil = require('../../../util/arrayUtil');
const Formula = require('../../../util/formula');
var BattleBuilder = require('../../../cache/battleBuilder');
const playerTaskDao = require('../../../dao/playerTaskDao');
const lifeLikeDao = require('../../../dao/lifeLikeDao');
const playerDailyTaskDao = require('../../../dao/playerDailyTaskDao');
const illAchDao = require('../../../dao/illAchDao');

module.exports = (app) => {
    return new towerHandler(app);
};

class towerHandler {
    constructor(app) {
        this.app = app;
    }

    /**
     * 查看镇妖塔信息
     */
    getTower(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let tower, player, isReset, resetMoney, cfg;

        async.waterfall([
            (cb) => {
                towerDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                tower = res;

                cfg = ConfigCache.get.tower(tower.nowId);
                if (!cfg) {
                    //配置错误
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_INTEN
                    });
                    return;
                }

                let resetPrice = ConfigCache.getVar.const(consts.Keys.TOWER_RESET_PRICE);
                let resetMax = ConfigCache.getVar.const(consts.Keys.TOWER_RESET_MAX);
                let resetNum = tower.resetNum;
                let resetTime = tower.resetTime;
                let now = Date.now();

                if (utils.getZeroHour(resetTime) == utils.getZeroHour(now)) {
                    if (resetNum > resetMax) {
                        resetMoney = 0;
                        isReset = false;
                    }
                    else {
                        resetMoney = resetPrice * (resetNum + 1);
                        isReset = true;
                    }
                }
                else {
                    resetMoney = resetPrice;
                    isReset = true;
                }

                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;

                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    power: player.power,
                    monsterPower: cfg.power,
                    nowTowerId: tower.nowId,
                    highestTowerId: tower.highestId,
                    isReset: isReset,
                    resetMoney: resetMoney,
                    isSweep: (tower.isSweep && tower.nowId < tower.highestId && player.vip > 0)
                }, next);
            }
        ], (err) => {
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
     * 挑战镇妖塔
     */
    combat(msg, session, next) {
        let self = this;
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');

        let exp = 0, gold = 0, money = 0, items = [], getHeros = [], heroIds = [];
        let tower = {}, player = {}, cfg, combatRes = false, combat = null;
        let lineups, heros, illustrateds, lifeLikeProbs, illAch;
        async.waterfall([
            (cb) => {
                towerDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                tower = res;

                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;
                cfg = ConfigCache.get.tower(tower.nowId);
                if (!cfg) {
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TOWER_NO_FOUND
                    });
                }

                exp += cfg.exp;
                gold += cfg.gold;

                if (!!Formula.isHit(cfg.itemsProb)) {
                    let itemMap = new ItemBuilder(cfg.items, ConfigCache.items());
                    exp += itemMap.getExp();
                    gold += itemMap.getGold();
                    money += itemMap.getMoney();
                    items = itemMap.getItem();
                }

                if (!!Formula.isHit(cfg.herosProb)) {
                    heroIds = cfg.heroIds;
                    getHeros = cfg.heros;
                }

                if (items.length > 0) {
                    bagDao.isEnoughItemsBag(items, player, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null, {
                        code: consts.RES_CODE.SUC_OK,
                        msg: ''
                    });
                }
            },
            (res, cb) => {
                if (res.code !== consts.RES_CODE.SUC_OK) {
                    next(null, res);
                    return;
                }

                if (heroIds.length > 0) {
                    heroDao.isEnoughHeroBag([heroIds.length], player, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null, {
                        code: consts.RES_CODE.SUC_OK,
                        msg: ''
                    });
                }
            },
            (res, cb) => {
                if (res.code !== consts.RES_CODE.SUC_OK) {
                    next(null, res);
                    return;
                }
                let inc = consts.Enums.DailyMinInc;
                playerDailyTaskDao.update(consts.Enums.dailyTaskType.DailyTower, inc, playerId, areaId); //每日爬塔完成一次的记录，无论成功还是失败
                if (cfg.monsterId <= 0) {
                    //比较战斗力方式。
                    combatRes = player.power > cfg.power;

                    if (!combatRes) {
                        //挑战失败
                        Response({
                            code: consts.RES_CODE.SUC_OK,
                            msg: '',
                            items: [],
                            heros: [],
                            res: combatRes,
                            combat: combat
                        }, next);
                        return;
                    }
                    else {
                        utils.invokeCallback(cb, null, null);
                    }
                }
                else {
                    lineupDao.getByPlayer(playerId, areaId, (err, res) => {
                        lineups = res;
                        heroDao.getByPlayer(playerId, areaId, (err, res) => {
                            heros = res;
                            illustratedDao.getByPlayer(playerId, areaId, (err, res) => {
                                illustrateds = res;
                                lifeLikeDao.getTotalByPlayerId(playerId, areaId, (err, res) => {
                                    lifeLikeProbs = res;
                                //提交给另一进程处理战斗计算
                                
                                illAchDao.getByPlayer(playerId, areaId, (err, res) => {
                                    illAch = res;
                                    //提交给另一进程处理战斗计算
                                    var playerBattle = BattleBuilder.builPlayer(player, heros, lineups, illustrateds, lifeLikeProbs, illAch);
                                    var monsterBattle = { tid: cfg.monsterId };


                                    self.app.rpc.combat.checkpointRemote.execute(session,
                                        playerBattle,
                                        monsterBattle,
                                        function (err, res) {
                                            if (!!err) {
                                                logger.error('player:%d, checkpoind:%d tower combat error! %s', playerId, cfg.monsterId, err.stack);
                                            }
                                            utils.invokeCallback(cb, err, res);
                                        });
                                });
                                });
                            });
                        });
                    });
                }
            },
            (res, cb) => {
                if (cfg.monsterId > 0) {
                    combat = res;
                    if (!combat) {
                        //挑战失败
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_BOSS_COMBAT
                        });
                        return;
                    }

                    combatRes = combat.res;

                    if (!combat.res) {
                        //挑战失败
                        next(null, {
                            code: consts.RES_CODE.SUC_OK,
                            msg: '',
                            items: [],
                            heros: [],
                            res: combat.res,
                            combat: combat
                        });
                        return;
                    }
                }

                if (!!tower.playerId) {
                    let setter = {
                        $inc: {
                            nowId: 1
                        }
                    };

                    if (tower.nowId >= tower.highestId) {
                        setter.$inc.highestId = 1;
                    }

                    towerDao.set(setter, playerId, areaId, cb);
                }
                else {
                    tower.nowId += 1;
                    tower.highestId += 1;
                    towerDao.create(tower, playerId, areaId, cb);
                }
            },
            (cb) => {
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
            },
            (res, cb) => {
                if (!!res) {
                    player = res;
                }

                if (!!items && items.length > 0) {
                    bagDao.createOrIncBag(items, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null);
                }
            },
            (cb) => {
                if (!!heroIds && heroIds.length > 0) {
                    let creHeros = heroIds.select((t) => {
                        return { hero: { id: t } };
                    });

                    heroDao.createMany(creHeros, player, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null, []);
                }
            },
            (res, cb) => {
                let reItem = getReItem(gold, exp, money, items);

                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: '',
                    items: reItem,
                    heros: getHeros,
                    res: combatRes,
                    combat: combat
                }, next);
            }
        ], (err) => {
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
     * 重置镇妖塔
     */
    reset(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let tower, player, isReset, resetMoney, setter, resetNum, resetTime;
        let resetPrice = ConfigCache.getVar.const(consts.Keys.TOWER_RESET_PRICE);
        let resetMax = ConfigCache.getVar.const(consts.Keys.TOWER_RESET_MAX);

        async.waterfall([
            (cb) => {
                towerDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                tower = res;

                resetNum = tower.resetNum;
                resetTime = tower.resetTime;
                let now = Date.now();
                setter = {
                    $set: {
                        resetTime: now,
                        nowId: 1,
                        isSweep: true
                    }
                };

                if (utils.getZeroHour(resetTime) == utils.getZeroHour(now)) {
                    if (resetNum >= resetMax) {
                        //今日重置上限
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_TOWER_RESET_MAX
                        });
                        return;
                    }
                    else {
                        resetNum += 1;
                        resetMoney = resetPrice * resetNum;
                        setter.$inc = {
                            resetNum: 1
                        };
                    }
                }
                else {
                    resetNum = 1;
                    resetMoney = resetPrice;
                    setter.$set.resetNum = resetNum;
                }

                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;

                if (resetMoney > player.money) {
                    //勾玉不足
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_MENOY
                    });
                    return;
                }

                playerDao.setPlayer({
                    $inc: {
                        money: -resetMoney
                    }
                }, playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;

                towerDao.set(setter, playerId, areaId, cb);
            },
            (cb) => {
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                }, next);
            }
        ], (err) => {
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
     * 扫荡镇妖塔
     */
    sweep(msg, session, next) {
        let playerId = session.get('playerId');
        let areaId = session.get('areaId');
        let tower, player, nowId, highestId, newNowId, setter;
        let nextItems = [], items = [], nextHeros = [], heros = [], nextHeroIds = [], heroIds = [];
        let resetPrice = ConfigCache.getVar.const(consts.Keys.TOWER_RESET_PRICE);
        let resetMax = ConfigCache.getVar.const(consts.Keys.TOWER_RESET_MAX);
        let exp = 0, gold = 0, money = 0, remMatGrid, remPropGrid, remHeroGrid, remsg = '';
        let vipConfig;

        async.waterfall([
            (cb) => {
                towerDao.get(playerId, areaId, cb);
            },
            (res, cb) => {
                tower = res;

                if (!tower.isSweep || tower.nowId == tower.highestId) {
                    //不能扫荡
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TOWER_NO_SWEEP
                    });
                    return;
                }

                playerDao.getPlayer(playerId, areaId, cb);
            },
            (res, cb) => {
                player = res;
                
                if (player.vip == 0) {
                    //不能扫荡
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_TOWER_NO_VIP
                    });
                    return;
                }
                bagDao.count(consts.Enums.ItemType.Prop, playerId, areaId, cb);
            },
            (res, cb) => {
                //剩余道具格子数
                remPropGrid = player.propBagNum - res;

                bagDao.count(consts.Enums.ItemType.Mat, playerId, areaId, cb);
            },
            (res, cb) => {
                //剩余材料格子数
                remMatGrid = player.matBagNum - res;

                heroDao.count(playerId, areaId, cb);
            },
            (res, cb) => {
                //剩余式神格子数
                remHeroGrid = player.heroBagNum - res;

                nowId = tower.nowId;
                highestId = tower.highestId;

                //获取到可以获取到的奖励
                for (nowId; nowId < highestId; nowId++) {
                    let cfg = ConfigCache.get.tower(nowId);

                    let itemMap = null;
                    let hitItem = [];
                    let hitHero = [];
                    let hitHeroId = [];
                    if (!!Formula.isHit(cfg.itemsProb)) {
                        itemMap = new ItemBuilder(cfg.items, ConfigCache.items());
                        hitItem = itemMap.getItem();
                        nextItems.pushArray(hitItem, (t) => { return true; });

                        let needGrid = getItemGrid(nextItems);
                        if (needGrid.matCount > remMatGrid) {
                            remsg = consts.RES_MSG.ERR_SWEEP_MAT_OVERFLOW;
                            break;  //材料格子不足停止扫荡
                        }
                        if (needGrid.propCount > remPropGrid) {
                            remsg = consts.RES_MSG.ERR_SWEEP_PROP_OVERFLOW;
                            break;  //道具格子不足停止扫荡
                        }
                    }

                    if (!!Formula.isHit(cfg.herosProb)) {
                        hitHeroId = cfg.heroIds;
                        hitHero = cfg.heros;
                        nextHeroIds.pushArray(hitHeroId);
                        nextHeros.pushArray(hitHero);

                        if (nextHeroIds.length > remHeroGrid) {
                            remsg = consts.RES_MSG.ERR_SWEEP_HERO_OVERFLOW;
                            break;  //式神格子不足停止扫荡
                        }
                    }

                    exp += cfg.exp;
                    gold += cfg.gold;

                    if (!!itemMap) {
                        exp += itemMap.getExp();
                        gold += itemMap.getGold();
                        money += itemMap.getMoney();
                    }

                    items.pushArray(hitItem);
                    heroIds.pushArray(hitHeroId);
                    heros.pushArray(hitHero);
                }

                setter = {
                    $set: {
                        isSweep: (nowId < highestId),
                        nowId: nowId
                    }
                };

                towerDao.set(setter, playerId, areaId, cb);
            },
            (cb) => {
                //更新任务
                playerTaskDao.upTask(playerId, areaId, cb);
            },
            (res,cb) => {
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
            },
            (res, cb) => {
                if (!!res) {
                    player = res;
                }

                if (!!items && items.length > 0) {
                    items = mergeNum(items, (t) => { return t.id; });
                    bagDao.createOrIncBag(items, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null);
                }
            },
            (cb) => {
                if (!!heroIds && heroIds.length > 0) {
                    let creHeros = heroIds.select((t) => {
                        return { hero: { id: t } };
                    });

                    heroDao.createMany(creHeros, player, playerId, areaId, cb);
                }
                else {
                    utils.invokeCallback(cb, null, []);
                }
            },
            (res, cb) => {
                let reHeros = mergeNum(heros, (t) => { return t.heroId; });
                let reItem = getReItem(gold, exp, money, items);
                Response({
                    code: consts.RES_CODE.SUC_OK,
                    msg: remsg,
                    items: reItem,
                    heros: reHeros
                }, next);
            }
        ], (err) => {
            if (!!err) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
                });
                return;
            }
        });
    }
}

/**
 * 获取物品占用的格子数量
 */
function getItemGrid(items) {
    let matDic = {}, propDic = {}, matCount = 0, propCount = 0;
    for (let i = 0; i < items.length; i++) {
        let t = items[i];
        let itemId = t.id;

        if (utils.getItemType(itemId) < 4) {
            //获取的是经验或金币或勾玉
            continue;
        }

        //记录要添加的道具、材料数量和最大堆叠数
        let dic = propDic[itemId] || matDic[itemId] || null;
        if (!dic) {
            //未记录过的物品
            let itemCfg = ConfigCache.get.item(itemId);

            if (consts.Enums.ItemType.Mat === itemCfg.type) {
                matDic[itemId] = {
                    num: t.num,
                    max: itemCfg.max
                };
            }
            else {
                propDic[itemId] = {
                    num: t.num,
                    max: itemCfg.max
                };
            }
        }
        else {
            //已经记录过的物品,增加数量
            dic.num += t.num;
        }
    }

    //材料需要的格子数量
    for (let matId in matDic) {
        let mat = matDic[matId];
        //该材料需要的格子数量
        let num = Math.ceil(mat.num / mat.max);
        matCount += num;
    }

    //道具需要的格子数量
    for (let propId in propDic) {
        let prop = propDic[propId];
        //该道具需要的格子数量
        let num = Math.ceil(prop.num / prop.max);
        propCount += num;
    }

    return { matCount: matCount, propCount: propCount };
}

function getReItem(gold, exp, money, items) {
    //客户端需要把经验等级勾玉放数据组前面返回
    let enums = consts.Enums;
    let reItem = [];
    if (gold > 0) {
        reItem.push({ id: enums.ItemClassId.Gold, type: enums.ItemClass.Gold, num: gold });
    }
    if (exp > 0) {
        reItem.push({ id: enums.ItemClassId.Exp, type: enums.ItemClass.Exp, num: exp });
    }
    if (money > 0) {
        reItem.push({ id: enums.ItemClassId.Money, type: enums.ItemClass.Money, num: money });
    }

    let item = items.select((t) => {
        return { id: t.id, type: t.type, num: t.num };
    });

    reItem.pushArray(item, (t) => { return true; });

    return reItem;
}

function mergeNum(arr, getId) {
    var reDic = {};
    for (let i = 0; i < arr.length; i++) {
        let t = arr[i];
        let oid = getId(t);

        let dic = reDic[oid];
        if (!dic) {
            //未记录过的物品
            reDic[oid] = t;
        }
        else {
            //已经记录过的物品,增加数量
            dic.num += t.num;
        }
    }

    return arrayUtil.dictionaryToArray(reDic, (t) => { return true; });
}
const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const Bag = require('../domain/entity/bag');
const ConfigCache = require('../../app/cache/configCache');

let bagDao = module.exports;

/**
 * create or inc bag object
 * 
 * @param {Array} items use 'ItemBuilder' get item object
 */
bagDao.createOrIncBag = function (items, playerId, areaId, next) {
    items = neatenItems(items);

    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Bag", function (err, col, close) {
        if (!!err || !items || items.length === 0) {
            close(); //release connect
            utils.invokeCallback(next, err);
            return;
        }
        var insertBag = {};
        var itemIds = [];
        items.forEach(function (item) {
            itemIds.push(item.id);
            insertBag[item.id] = item;
        }, this);

        var savesPending = itemIds.length;
        var saveFinished = function (err, count) {
            count = count || 1;
            savesPending = savesPending - count;
            if (!!err || savesPending == 0) {
                close();
                //console.log('bag db close.');
                utils.invokeCallback(next, err);
            } else {
                logger.debug('bag save no finished, remain count:%d.', savesPending);
            }
        }

        col.find({ playerId: playerId, itemId: { $in: itemIds }, isFull: false }).toArray(function (err, res) {
            if (!!err) {
                saveFinished(err);
                return;
            }
            var bagItem, num, max, remNum;
            var isFull = false;
            var resEachCount = 0;

            if (res.length <= 0) {
                //如果没有未满的格子直接插入物品
                insertItems();
            }

            //从未满格子中增加数量
            res.forEach(function (r) {
                resEachCount++;
                bagItem = insertBag[r.itemId];
                max = !bagItem ? 0 : bagItem.max;
                if (bagItem && max > r.num) {
                    remNum = max - r.num;
                    if (bagItem.num > remNum) {
                        //补满格子
                        num = remNum;
                        isFull = true;
                        //剩余的插入新的一条
                        savesPending++;
                        bagItem.num = bagItem.num - remNum;
                    }
                    else if (bagItem.num == remNum) {
                        //补满格子
                        num = remNum;
                        isFull = true;
                        //从插入列表中删除
                        delete insertBag[r.itemId];
                    }
                    else {
                        isFull = false;
                        num = bagItem.num;
                        //从插入列表中删除
                        delete insertBag[r.itemId];
                    }

                    col.updateOne({ _id: r._id }, { $inc: { num: num }, $set: { isFull: isFull } }, { upsert: true },
                        function (err, result) {
                            if (!!err) {
                                //console.log('bag item[%d] set num:%d error.', r.itemId, num);
                                return;
                            }
                            //todo: debug
                            //console.log('bag item[%d] set num:%d success.', r.itemId, num);
                            saveFinished(null);

                            if (resEachCount == res.length) {
                                //所有未满的格子都计算过以后执行插入物品
                                insertItems();
                            }
                        });
                }
            }, this);

            function insertItems() {
                //insert items
                var addBagItems = [];
                var insertCounter = 0;
                itemIds.forEach(function (itemId) {
                    bagItem = insertBag[itemId];
                    if (!bagItem) return;

                    max = bagItem.max;
                    remNum = bagItem.num;
                    var incNum = -1;
                    do {
                        num = remNum > max ? max : remNum;
                        remNum = remNum > max ? remNum - max : 0;
                        incNum++;

                        var entity = new Bag({
                            playerId: playerId,
                            itemId: itemId,
                            num: num,
                            type: bagItem.itemType,
                            isFull: (num === max)
                        });
                        addBagItems.push(entity);
                    } while (remNum > 0);
                    insertCounter += incNum;

                }, this);
                //拆分多个格子，插入新的一条
                savesPending += insertCounter;

                if (addBagItems.length > 0) {
                    col.insertMany(addBagItems, function (err, result) {
                        //console.log('bag add new %d item.', addBagItems.length);
                        saveFinished(err, addBagItems.length);
                    });
                }
                else {
                    saveFinished(null, addBagItems.length);
                }
            }
        });

    });
};

function neatenItems(items) {
    let itemsDis = {};
    items.select(t => {
        if (!!itemsDis[t.id]) {
            itemsDis[t.id].num += t.num;
        }
        else {
            itemsDis[t.id] = t;
        }
    });
    return arrayUtil.dictionaryToArray(itemsDis);
}

/**
 * use num of item
 * 
 * @param {bool} isemit emit script function when it's use item.
 */
bagDao.useItem = function (itemId, num, isemit, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    var remainNum = num;
    client.connect("Bag", function (err, col, close) {
        if (!!err || !itemId || num === 0) {
            close(); //release connect
            utils.invokeCallback(next, null, false);
            return;
        }

        //优先使用不满的包
        col.find({ playerId: playerId, itemId: itemId }).sort({ isFull: 1 }).toArray(function (err, res) {
            if (!!err || res.length === 0) {
                close(); //release connect
                utils.invokeCallback(next, null, false);
                return;
            }

            var setList = [], remList = [], item = null;

            for (var i = 0; i < res.length; i++) {
                if (remainNum === 0) break;

                item = res[i];
                if (item.num > remainNum) {
                    item.isFull = false;
                    item.inc = remainNum;
                    item.num -= remainNum;
                    remainNum = 0;
                    setList.push(item);
                } else {
                    remainNum = remainNum - item.num;
                    remList.push(item);
                }
            }

            //背包物品不满足
            if (remainNum > 0) {
                close(); //release connect
                utils.invokeCallback(next, null, false);
                return;
            }

            var savesPending = setList.length + remList.length;
            var saveFinished = function (err, count) {
                count = count || 1;
                savesPending = savesPending - count;
                if (!!err || savesPending == 0) {
                    close();
                    //console.log('bag db close.');
                    utils.invokeCallback(next, null, {
                        set: setList,
                        rem: remList
                    });
                }
            }

            setList.forEach(function (el) {
                col.updateOne({ _id: el._id }, { $inc: { num: -el.inc }, $set: { isFull: false } }, { upsert: true },
                    function (err, result) {
                        if (!!err) {
                            //console.log('bag item[%d] set num:%d error.', r.itemId, num);
                            return;
                        }
                        //todo: debug
                        console.log('Use bag item[%d] set num:%d success.', el.itemId, el.inc);
                        saveFinished(null);
                    });
            }, this);

            remList.forEach(function (el) {
                col.deleteOne({ _id: el._id }, function (err, result) {
                    if (!!err) {
                        //console.log('Use bag item[%d] set num:%d error.', r.itemId, num);
                        return;
                    }
                    //todo: debug
                    console.log('Use bag item[%d] rem num:%d success.', el.itemId, el.num);
                    saveFinished(null);
                });
            }, this);
        });
    });
};

/**
 * check num of item
 */
bagDao.checkItem = function (itemId, num, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    var remainNum = num;
    client.connect("Bag", function (err, col, close) {
        if (!!err || !itemId || num === 0) {
            close(); //release connect
            utils.invokeCallback(next, null, false);
            return;
        }

        //优先使用不满的包
        col.find({ playerId: playerId, itemId: itemId }).sort({ isFull: 1 }).toArray(function (err, res) {
            if (!!err || res.length === 0) {
                close(); //release connect
                utils.invokeCallback(next, null, false);
                return;
            }

            var setList = [], remList = [], item = null;

            for (var i = 0; i < res.length; i++) {
                if (remainNum === 0) break;

                item = res[i];
                if (item.num > remainNum) {
                    item.isFull = false;
                    item.inc = remainNum;
                    item.num -= remainNum;
                    remainNum = 0;
                    setList.push(item);
                } else {
                    remainNum = remainNum - item.num;
                    remList.push(item);
                }
            }

            //背包物品不满足
            if (remainNum > 0) {
                close(); //release connect
                utils.invokeCallback(next, null, false);
                return;
            }

            utils.invokeCallback(next, null, true);
        });
    });
};

/**
 * get bag list for player
 */
bagDao.getByPlayer = function (playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Bag", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        var entity = { playerId: playerId };
        col.find(entity).sort({ itemId: 1 }).toArray(function (err, res) {
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
                        itemId: r.itemId,
                        num: r.num,
                        type: r.type,
                        isFull: r.isFull
                    });
                }
            }
            utils.invokeCallback(next, null, roles);
        });
    });
};

/**
 * get bag count for player
 */
bagDao.count = function (type, playerId, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Bag", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        var entity = { playerId: playerId, type: type };
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
 * get item for player by itemId
 */
bagDao.getByItemId = function (itemId, playerId, areaId, next) {
    bagDao.getByItemIds([itemId], playerId, areaId, next);
};

/**
 * get items for player by itemId
 */
bagDao.getByItemIds = function (itemIds, playerId, areaId, next) {
    bagDao.getByQuery({
        playerId: playerId,
        itemId: { $in: itemIds }
    }, areaId, next);
};

/**
 * get items for player by query
 */
bagDao.getByQuery = function (query, areaId, next) {
    var client = dbDriver.get(areaId, consts.DB.Data.name);
    if (!client || !client.connect) {
        utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
        return;
    }
    client.connect("Bag", function (err, col, close) {
        if (!!err) {
            close(); //release connect
            utils.invokeCallback(next, err, null);
            return;
        }

        col.find(query).toArray(function (err, res) {
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
                        itemId: r.itemId,
                        num: r.num,
                        type: r.type
                    });
                }
            }
            utils.invokeCallback(next, null, roles);
        });
    });
};

/**
 * get items for player by itemId and isFull
 */
bagDao.getByItemIdisFull = function (itemIds, isFull, playerId, areaId, next) {
    bagDao.getByQuery({
        playerId: playerId,
        itemId: { $in: itemIds },
        isFull: isFull
    }, areaId, next);
};

/**
 * 物品背包格子是否足够
 * @param {[{id:400000,num:2}]} items
 * @param {*} player 
 * @param {*} playerId 
 * @param {*} areaId 
 * @param {*} next 
 */
bagDao.isEnoughItemsBag = function (items, player, playerId, areaId, next) {
    let matCount = 0;   //占用的材料格子数
    let propCount = 0;  //占用的道具格子数
    let addMat = 0, addProp = 0;

    //要添加的材料,要添加的道具,未满的材料格子数,未满的道具格子数,
    let itemsIds = [];
    let matDic = {}, propDic = {}, noFullMat = 0, noFullProp = 0;
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
                addMat++;
            }
            else {
                propDic[itemId] = {
                    num: t.num,
                    max: itemCfg.max
                };
                addProp++;
            }
            itemsIds.push(itemId);
        }
        else {
            //已经记录过的物品,增加数量
            dic.num += t.num;
        }
    }

    async.waterfall([
        (cb) => {
            //根据要添加物品的Id,获取未满的格子
            bagDao.getByItemIdisFull(itemsIds, false, playerId, areaId, cb);
        },
        (res, cb) => {
            let NoFullBag = res;

            //未满格子的物品数量，累加到添加物品的数量上。并记录未满材料、道具的格子数量。
            NoFullBag.forEach((el) => {
                let dic = propDic[el.itemId] || matDic[el.itemId] || null;
                if (!!dic) {
                    dic.num += el.num;

                    if (consts.Enums.ItemType.Mat === el.type) {
                        noFullMat++;
                    }
                    else {
                        noFullProp++;
                    }
                }
            });

            if (addMat > 0) {
                //获取背包中占用的材料格子数
                bagDao.count(consts.Enums.ItemType.Mat, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, 0);
            }
        },
        (res, cb) => {
            //已经满的格子数=已经占用的格子数-未满的格子数
            matCount = res - noFullMat;

            if (addProp > 0) {
                //获取背包中占用的道具格子数
                bagDao.count(consts.Enums.ItemType.Prop, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, 0);
            }
        },
        (res, cb) => {
            //已经满的格子数=已经占用的格子数-未满的格子数
            propCount = res - noFullProp;

            //计算添加材料后需要的格子数量
            for (let matId in matDic) {
                let mat = matDic[matId];
                //该材料需要的格子数量
                let num = Math.ceil(mat.num / mat.max);
                matCount += num;
            }

            //计算添加道具后需要的格子数量
            for (let propId in propDic) {
                let prop = propDic[propId];
                //该道具需要的格子数量
                let num = Math.ceil(prop.num / prop.max);
                propCount += num;
            }

            if (player.propBagNum < propCount) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_BAG_PROP_OVERFLOW
                });
                return;
            }

            if (player.matBagNum < matCount) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_BAG_MAT_OVERFLOW
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
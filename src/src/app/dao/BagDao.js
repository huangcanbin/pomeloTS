Object.defineProperty(exports, "__esModule", { value: true });
const BaseDao_1 = require("./BaseDao");
const consts = require("../util/consts");
const Bag = require("../domain/entity/Bag");
const ConfigCache = require("../cache/ConfigCache");
const arrayUtil = require("../util/ArrayUtil");
const system = require("system");
const logger = require("pomelo-logger");
class BagDao extends BaseDao_1.BaseDao {
    static getInstance() {
        if (!this.instance) {
            this.instance = new BagDao();
        }
        return this.instance;
    }
    constructor() {
        super();
        this._logger = logger.getLogger(system.__filename);
        this._arrayUtil = arrayUtil.ArrayUtil.getInstance();
        this._configCache = ConfigCache.ConfigCache.getInstance();
    }
    createOrIncBag(itemArr, playerId, areaId, callback, context) {
        let self = this;
        let items = this.neatenItems(itemArr);
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Bag", (err, col, close) => {
            if (!!err || !items || items.length === 0) {
                close();
                callback.call(context, err);
                return;
            }
            let insertBag = {};
            let itemIds = [];
            items.forEach((item) => {
                itemIds.push(item.id);
                insertBag[item.id] = item;
            }, this);
            let savesPending = itemIds.length;
            let saveFinished = function (err, count) {
                count = count || 1;
                savesPending = savesPending - count;
                if (!!err || savesPending == 0) {
                    close();
                    callback.call(context, err);
                }
                else {
                    self._logger.debug('bag save no finished, remain count:%d.', savesPending);
                }
            };
            col.find({ playerId: playerId, itemId: { $in: itemIds }, isFull: false }).toArray((err, res) => {
                if (!!err) {
                    saveFinished(err);
                    return;
                }
                let bagItem, num, max, remNum;
                let isFull = false;
                let resEachCount = 0;
                if (res.length <= 0) {
                    insertItems();
                }
                res.forEach((r) => {
                    resEachCount++;
                    bagItem = insertBag[r.itemId];
                    max = !bagItem ? 0 : bagItem.max;
                    if (bagItem && max > r.num) {
                        remNum = max - r.num;
                        if (bagItem.num > remNum) {
                            num = remNum;
                            isFull = true;
                            savesPending++;
                            bagItem.num = bagItem.num - remNum;
                        }
                        else if (bagItem.num == remNum) {
                            num = remNum;
                            isFull = true;
                            delete insertBag[r.itemId];
                        }
                        else {
                            isFull = false;
                            num = bagItem.num;
                            delete insertBag[r.itemId];
                        }
                        col.updateOne({ _id: r._id }, { $inc: { num: num }, $set: { isFull: isFull } }, { upsert: true }, (err, result) => {
                            if (!!err) {
                                return;
                            }
                            saveFinished(null);
                            if (resEachCount == res.length) {
                                insertItems();
                            }
                            console.log(result);
                        });
                    }
                }, this);
                var insertItems = function () {
                    let addBagItems = [];
                    let insertCounter = 0;
                    itemIds.forEach((itemId) => {
                        bagItem = insertBag[itemId];
                        if (!bagItem)
                            return;
                        max = bagItem.max;
                        remNum = bagItem.num;
                        let incNum = -1;
                        do {
                            num = remNum > max ? max : remNum;
                            remNum = remNum > max ? remNum - max : 0;
                            incNum++;
                            let entity = new Bag.Bag({
                                playerId: playerId,
                                itemId: itemId,
                                num: num,
                                type: bagItem.itemType,
                                isFull: (num === max)
                            });
                            addBagItems.push(entity);
                        } while (remNum > 0);
                        insertCounter += incNum;
                    });
                    savesPending += insertCounter;
                    if (addBagItems.length > 0) {
                        col.insertMany(addBagItems, (err, result) => {
                            saveFinished(err, addBagItems.length);
                            console.log(result);
                        });
                    }
                    else {
                        saveFinished(null, addBagItems.length);
                    }
                };
            });
        });
    }
    useItem(itemId, num, playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        let remainNum = num;
        client.connect("Bag", (err, col, close) => {
            if (!!err || !itemId || num === 0) {
                close();
                callback.call(context, null, false);
                return;
            }
            col.find({ playerId: playerId, itemId: itemId }).sort({ isFull: 1 }).toArray((err, res) => {
                if (!!err || res.length === 0) {
                    close();
                    callback.call(context, null, false);
                    return;
                }
                let setList = [], remList = [], item = null;
                for (let i = 0; i < res.length; i++) {
                    if (remainNum === 0)
                        break;
                    item = res[i];
                    if (item.num > remainNum) {
                        item.isFull = false;
                        item.inc = remainNum;
                        item.num -= remainNum;
                        remainNum = 0;
                        setList.push(item);
                    }
                    else {
                        remainNum = remainNum - item.num;
                        remList.push(item);
                    }
                }
                if (remainNum > 0) {
                    close();
                    callback.call(context, null, false);
                    return;
                }
                let savesPending = setList.length + remList.length;
                var saveFinished = function (err, count) {
                    count = count || 1;
                    savesPending = savesPending - count;
                    if (!!err || savesPending == 0) {
                        close();
                        callback.call(context, null, {
                            set: setList,
                            rem: remList
                        });
                    }
                };
                setList.forEach((el) => {
                    col.updateOne({ _id: el._id }, { $inc: { num: -el.inc }, $set: { isFull: false } }, { upsert: true }, (err, result) => {
                        if (!!err) {
                            return;
                        }
                        console.log('Use bag item[%d] set num:%d success.', el.itemId, el.inc);
                        saveFinished(null);
                        console.log(result);
                    });
                }, this);
                remList.forEach((el) => {
                    col.deleteOne({ _id: el._id }, (err, result) => {
                        if (!!err) {
                            return;
                        }
                        console.log('Use bag item[%d] rem num:%d success.', el.itemId, el.num);
                        saveFinished(null);
                        console.log(result);
                    });
                }, this);
            });
        });
    }
    checkItem(itemId, num, playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        let remainNum = num;
        client.connect("Bag", (err, col, close) => {
            if (!!err || !itemId || num === 0) {
                close();
                callback.call(context, null, false);
                return;
            }
            col.find({ playerId: playerId, itemId: itemId }).sort({ isFull: 1 }).toArray((err, res) => {
                if (!!err || res.length === 0) {
                    close();
                    callback.call(context, null, false);
                    return;
                }
                let setList = [], remList = [], item = null;
                for (let i = 0; i < res.length; i++) {
                    if (remainNum === 0)
                        break;
                    item = res[i];
                    if (item.num > remainNum) {
                        item.isFull = false;
                        item.inc = remainNum;
                        item.num -= remainNum;
                        remainNum = 0;
                        setList.push(item);
                    }
                    else {
                        remainNum = remainNum - item.num;
                        remList.push(item);
                    }
                }
                if (remainNum > 0) {
                    close();
                    callback.call(context, null, false);
                    return;
                }
                callback.call(context, null, true);
            });
        });
    }
    getByPlayer(playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Bag", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId };
            col.find(entity).sort({ itemId: 1 }).toArray((err, res) => {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let roles = [];
                if (!!res && res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        let r = res[i];
                        roles.push({
                            itemId: r.itemId,
                            num: r.num,
                            type: r.type,
                            isFull: r.isFull
                        });
                    }
                }
                callback.call(context, null, roles);
            });
        });
    }
    count(type, playerId, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Bag", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId, type: type };
            col.count(entity, (err, count) => {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                callback.call(context, null, count);
            });
        });
    }
    getByItemId(itemId, playerId, areaId, callback, context) {
        this.getByItemIds([itemId], playerId, areaId, callback, context);
    }
    getByItemIds(itemIds, playerId, areaId, callback, context) {
        this.getByQuery({
            playerId: playerId,
            itemId: { $in: itemIds }
        }, areaId, callback, context);
    }
    getByItemIdisFull(itemIds, isFull, playerId, areaId, callback, context) {
        this.getByQuery({
            playerId: playerId,
            itemId: { $in: itemIds },
            isFull: isFull
        }, areaId, callback, context);
    }
    getByQuery(query, areaId, callback, context) {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect) {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Bag", (err, col, close) => {
            if (!!err) {
                close();
                callback.call(context, err, null);
                return;
            }
            col.find(query).toArray((err, res) => {
                if (!!err) {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let roles = [];
                if (!!res && res.length > 0) {
                    for (let i = 0; i < res.length; i++) {
                        let r = res[i];
                        roles.push({
                            itemId: r.itemId,
                            num: r.num,
                            type: r.type
                        });
                    }
                }
                callback.call(context, null, roles);
            });
        });
    }
    isEnoughItemsBag(items, player, playerId, areaId, callback, context) {
        let matCount = 0;
        let propCount = 0;
        let addMat = 0;
        let addProp = 0;
        let itemsIds = [];
        let matDic = {}, propDic = {}, noFullMat = 0, noFullProp = 0;
        for (let i = 0; i < items.length; i++) {
            let t = items[i];
            let itemId = t.id;
            if (this.utils.getItemType(itemId) < 4) {
                continue;
            }
            let dic = propDic[itemId] || matDic[itemId] || null;
            if (!dic) {
                let itemCfg = this._configCache.getItem(itemId);
                if (consts.default.consts.Enums.ItemType.Mat === itemCfg.type) {
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
                dic.num += t.num;
            }
        }
        this.getPromise1(itemsIds, false, playerId, areaId).then((res) => {
            return new Promise((resolve, reject) => {
                if (res) {
                    let NoFullBag = res;
                    NoFullBag.forEach((el) => {
                        let dic = propDic[el.itemId] || matDic[el.itemId] || null;
                        if (!!dic) {
                            dic.num += el.num;
                            if (consts.default.consts.Enums.ItemType.Mat === el.type) {
                                noFullMat++;
                            }
                            else {
                                noFullProp++;
                            }
                        }
                    });
                    if (addMat > 0) {
                        this.count(consts.default.consts.Enums.ItemType.Mat, playerId, areaId, (err, count) => {
                            if (err) {
                                reject(count);
                            }
                            else {
                                resolve(count);
                            }
                        }, this);
                    }
                    else {
                        resolve(0);
                    }
                }
                else {
                    reject();
                }
            });
        }).then((count) => {
            return new Promise((resolve, reject) => {
                if (count) {
                    matCount = count - noFullMat;
                    if (addProp > 0) {
                        this.count(consts.default.consts.Enums.ItemType.Prop, playerId, areaId, (err, c) => {
                            if (err) {
                                reject();
                            }
                            else {
                                resolve(c);
                            }
                        }, this);
                    }
                    else {
                        resolve(0);
                    }
                }
                else {
                    reject();
                }
            });
        }).then((count) => {
            propCount = count - noFullProp;
            for (let matId in matDic) {
                let mat = matDic[matId];
                let num = Math.ceil(mat.num / mat.max);
                matCount += num;
            }
            for (let propId in propDic) {
                let prop = propDic[propId];
                let num = Math.ceil(prop.num / prop.max);
                propCount += num;
            }
            if (player.propBagNum < propCount) {
                callback.call(context, null, {
                    code: consts.default.consts.RES_CODE.ERR_FAIL,
                    msg: consts.default.consts.RES_MSG.ERR_BAG_PROP_OVERFLOW
                });
                return;
            }
            if (player.matBagNum < matCount) {
                callback.call(context, null, {
                    code: consts.default.consts.RES_CODE.ERR_FAIL,
                    msg: consts.default.consts.RES_MSG.ERR_BAG_PROP_OVERFLOW
                });
                return;
            }
            callback.call(context, null, {
                code: consts.default.consts.RES_CODE.SUC_OK,
                msg: ''
            });
            return;
        }).catch((err) => {
            if (!!err) {
                callback.call(context, null, {
                    code: consts.default.consts.RES_CODE.ERR_FAIL,
                    msg: consts.default.consts.RES_MSG.ERR_BAG_PROP_OVERFLOW
                });
                return;
            }
        });
    }
    getPromise1(itemsIds, isFull, playerId, areaId) {
        return new Promise((resolve, reject) => {
            this.getByItemIdisFull(itemsIds, isFull, playerId, areaId, (err, res) => {
                if (err) {
                    reject();
                }
                else if (res) {
                    resolve(res);
                }
            }, this);
        });
    }
    neatenItems(items) {
        let itemsDis = {};
        items.select((t) => {
            if (!!itemsDis[t.id]) {
                itemsDis[t.id].num += t.num;
            }
            else {
                itemsDis[t.id] = t;
            }
        });
        return this._arrayUtil.dictionaryToArray(itemsDis);
    }
}
exports.BagDao = BagDao;

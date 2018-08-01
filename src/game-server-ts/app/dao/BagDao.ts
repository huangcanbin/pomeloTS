import { BaseDao } from "./BaseDao";
import mongoClient = require('mongodb');
import consts = require('../util/consts');
import Bag = require('../domain/entity/Bag');
import ConfigCache = require('../cache/ConfigCache');
import arrayUtil = require('../util/ArrayUtil');
import system = require('system');
import logger = require('pomelo-logger');

/**
 * 背包
 * @author Andrew_Huang
 * @export
 * @class BagDao
 * @extends {BaseDao}
 */
export class BagDao extends BaseDao
{
    public static instance: BagDao;
    public static getInstance(): BagDao
    {
        if (!this.instance)
        {
            this.instance = new BagDao();
        }
        return this.instance
    }

    private _logger: logger.ILogger;
    private _arrayUtil: arrayUtil.ArrayUtil;
    private _configCache: ConfigCache.ConfigCache;

    public constructor()
    {
        super();
        this._logger = logger.getLogger(system.__filename);
        this._arrayUtil = arrayUtil.ArrayUtil.getInstance();
        this._configCache = ConfigCache.ConfigCache.getInstance();
    }

    /**
     * 创建数据
     * @author Andrew_Huang
     * @param {*} items
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BagDao
     */
    public createOrIncBag(itemArr: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let self = this;
        let items: any = this.neatenItems(itemArr);
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        client.connect("Bag", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err || !items || items.length === 0)
            {
                close();
                callback.call(context, err);
                return;
            }
            let insertBag: any = {};
            let itemIds: any = [];
            items.forEach((item: any) =>
            {
                itemIds.push(item.id);
                insertBag[item.id] = item;
            }, this);

            let savesPending: number = itemIds.length;
            //数据保存完成
            let saveFinished = function (err: any, count?: number)
            {
                count = count || 1;
                savesPending = savesPending - count;
                if (!!err || savesPending == 0)
                {
                    close();
                    callback.call(context, err);
                } else
                {
                    self._logger.debug('bag save no finished, remain count:%d.', savesPending);
                }
            }

            col.find({ playerId: playerId, itemId: { $in: itemIds }, isFull: false }).toArray((err: any, res: any) =>
            {
                if (!!err)
                {
                    saveFinished(err);
                    return;
                }
                let bagItem, num, max, remNum;
                let isFull: boolean = false;
                let resEachCount: number = 0;
                if (res.length <= 0)
                {
                    //如果没有未满的格子直接插入物品
                    insertItems();
                }
                //从未满格子中增加数量
                res.forEach((r: any) =>
                {
                    resEachCount++;
                    bagItem = insertBag[r.itemId];
                    max = !bagItem ? 0 : bagItem.max;
                    if (bagItem && max > r.num)
                    {
                        remNum = max - r.num;
                        if (bagItem.num > remNum)
                        {
                            //补满格子
                            num = remNum;
                            isFull = true;
                            //剩余的插入新的一条
                            savesPending++;
                            bagItem.num = bagItem.num - remNum;
                        }
                        else if (bagItem.num == remNum)
                        {
                            //补满格子
                            num = remNum;
                            isFull = true;
                            //从插入列表中删除
                            delete insertBag[r.itemId];
                        }
                        else
                        {
                            isFull = false;
                            num = bagItem.num;
                            //从插入列表中删除
                            delete insertBag[r.itemId];
                        }
                        col.updateOne({ _id: r._id }, { $inc: { num: num }, $set: { isFull: isFull } }, { upsert: true }, (err: any, result: any) =>
                        {
                            if (!!err)
                            {
                                //console.log('bag item[%d] set num:%d error.', r.itemId, num);
                                return;
                            }
                            //todo: debug
                            //console.log('bag item[%d] set num:%d success.', r.itemId, num);
                            saveFinished(null);
                            if (resEachCount == res.length)
                            {
                                //所有未满的格子都计算过以后执行插入物品
                                insertItems();
                            }
                            console.log(result);
                        });
                    }
                }, this);

                var insertItems = function ()
                {
                    //insert items
                    let addBagItems: any = [];
                    let insertCounter = 0;
                    itemIds.forEach((itemId: any) =>
                    {
                        bagItem = insertBag[itemId];
                        if (!bagItem) return;
                        max = bagItem.max;
                        remNum = bagItem.num;
                        let incNum: number = -1;
                        do
                        {
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
                    //拆分多个格子，插入新的一条
                    savesPending += insertCounter;
                    if (addBagItems.length > 0)
                    {
                        col.insertMany(addBagItems, (err: any, result: any) =>
                        {
                            //console.log('bag add new %d item.', addBagItems.length);
                            saveFinished(err, addBagItems.length);
                            console.log(result);
                        });
                    }
                    else
                    {
                        saveFinished(null, addBagItems.length);
                    }
                }
            });
        });
    }

    /**
     * 使用物品
     * @author Andrew_Huang
     * @param {number} itemId
     * @param {number} num
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BagDao
     */
    public useItem(itemId: number, num: number, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        let remainNum: number = num;
        client.connect("Bag", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err || !itemId || num === 0)
            {
                close();
                callback.call(context, null, false);
                return;
            }
            //优先使用不满的包
            col.find({ playerId: playerId, itemId: itemId }).sort({ isFull: 1 }).toArray((err: any, res: any) =>
            {
                if (!!err || res.length === 0)
                {
                    close();
                    callback.call(context, null, false);
                    return;
                }
                let setList: any = [], remList: any = [], item = null;
                for (let i: number = 0; i < res.length; i++)
                {
                    if (remainNum === 0) break;
                    item = res[i];
                    if (item.num > remainNum)
                    {
                        item.isFull = false;
                        item.inc = remainNum;
                        item.num -= remainNum;
                        remainNum = 0;
                        setList.push(item);
                    } else
                    {
                        remainNum = remainNum - item.num;
                        remList.push(item);
                    }
                }
                //背包物品不满足
                if (remainNum > 0)
                {
                    close();
                    callback.call(context, null, false);
                    return;
                }
                let savesPending: number = setList.length + remList.length;
                var saveFinished = function (err: any, count?: number)
                {
                    count = count || 1;
                    savesPending = savesPending - count;
                    if (!!err || savesPending == 0)
                    {
                        close();
                        callback.call(context, null, {
                            set: setList,
                            rem: remList
                        });
                    }
                }
                setList.forEach((el: any) =>
                {
                    col.updateOne({ _id: el._id }, { $inc: { num: -el.inc }, $set: { isFull: false } }, { upsert: true }, (err: any, result: any) =>
                    {
                        if (!!err)
                        {
                            //console.log('bag item[%d] set num:%d error.', r.itemId, num);
                            return;
                        }
                        //todo: debug
                        console.log('Use bag item[%d] set num:%d success.', el.itemId, el.inc);
                        saveFinished(null);
                        console.log(result);
                    });
                }, this);

                remList.forEach((el: any) =>
                {
                    col.deleteOne({ _id: el._id }, (err: any, result: any) =>
                    {
                        if (!!err)
                        {
                            //console.log('Use bag item[%d] set num:%d error.', r.itemId, num);
                            return;
                        }
                        //todo: debug
                        console.log('Use bag item[%d] rem num:%d success.', el.itemId, el.num);
                        saveFinished(null);
                        console.log(result);
                    });
                }, this);
            });
        });
    }

    /**
     * 检查物品数量是否足够
     * @author Andrew_Huang
     * @param {number} itemId
     * @param {number} num
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BagDao
     */
    public checkItem(itemId: number, num: number, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        let remainNum: number = num;
        client.connect("Bag", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err || !itemId || num === 0)
            {
                close();
                callback.call(context, null, false);
                return;
            }
            //优先使用不满的包
            col.find({ playerId: playerId, itemId: itemId }).sort({ isFull: 1 }).toArray((err: any, res: any) =>
            {
                if (!!err || res.length === 0)
                {
                    close();
                    callback.call(context, null, false);
                    return;
                }
                let setList: any = [], remList: any = [], item = null;
                for (let i: number = 0; i < res.length; i++)
                {
                    if (remainNum === 0) break;
                    item = res[i];
                    if (item.num > remainNum)
                    {
                        item.isFull = false;
                        item.inc = remainNum;
                        item.num -= remainNum;
                        remainNum = 0;
                        setList.push(item);
                    } else
                    {
                        remainNum = remainNum - item.num;
                        remList.push(item);
                    }
                }
                //背包物品不满足
                if (remainNum > 0)
                {
                    close();
                    callback.call(context, null, false);
                    return;
                }
                callback.call(context, null, true);
            });
        });
    }

    /**
     * 根据玩家ID获取背包列表数据
     * @author Andrew_Huang
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @returns {void}
     * @memberof BagDao
     */
    public getByPlayer(playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        client.connect("Bag", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId };
            col.find(entity).sort({ itemId: 1 }).toArray((err: any, res: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let roles: any = [];
                if (!!res && res.length > 0)
                {
                    for (let i: number = 0; i < res.length; i++)
                    {
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

    /**
     * 获取某类物品的数量
     * @author Andrew_Huang
     * @param {number} type
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BagDao
     */
    public count(type: number, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        client.connect("Bag", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            let entity = { playerId: playerId, type: type };
            col.count(entity, (err: any, count: number) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                callback.call(context, null, count);
            });
        });
    }

    public getByItemId(itemId: number, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        this.getByItemIds([itemId], playerId, areaId, callback, context);
    }

    public getByItemIds(itemIds: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        this.getByQuery({
            playerId: playerId,
            itemId: { $in: itemIds }
        }, areaId, callback, context);
    }

    /**
     * 判断某个物品是否堆满
     * @author Andrew_Huang
     * @param {*} itemIds
     * @param {boolean} isFull
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BagDao
     */
    public getByItemIdisFull(itemIds: any, isFull: boolean, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        this.getByQuery({
            playerId: playerId,
            itemId: { $in: itemIds },
            isFull: isFull
        }, areaId, callback, context);
    }

    /**
     * 获取背包列表数据
     * @author Andrew_Huang
     * @param {*} query
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @returns {void}
     * @memberof BagDao
     */
    public getByQuery(query: any, areaId: number, callback: Function, context: Object): void
    {
        let client = this.dbDriver.get(areaId, consts.default.consts.DB.Data.name);
        if (!client || !client.connect)
        {
            callback.call(context, consts.default.consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE)
            return;
        }
        client.connect("Bag", (err: any, col: mongoClient.Collection, close: Function) =>
        {
            if (!!err)
            {
                close();
                callback.call(context, err, null);
                return;
            }
            col.find(query).toArray((err: any, res: any) =>
            {
                if (!!err)
                {
                    close();
                    callback.call(context, err, null);
                    return;
                }
                close();
                let roles: any = [];
                if (!!res && res.length > 0)
                {
                    for (let i: number = 0; i < res.length; i++)
                    {
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

    /**
     * 物品背包格子是否足够
     * @author Andrew_Huang
     * @param {[{id:400000,num:2}]} items
     * @param {*} player
     * @param {string} playerId
     * @param {number} areaId
     * @param {Function} callback
     * @param {Object} context
     * @memberof BagDao
     */
    public isEnoughItemsBag(items: any, player: any, playerId: string, areaId: number, callback: Function, context: Object): void
    {
        let matCount: number = 0;   //占用的材料格子数
        let propCount: number = 0;  //占用的道具格子数
        let addMat: number = 0;
        let addProp: number = 0;

        //要添加的材料,要添加的道具,未满的材料格子数,未满的道具格子数,
        let itemsIds: any = [];
        let matDic: any = {}, propDic: any = {}, noFullMat: number = 0, noFullProp: number = 0;
        for (let i: number = 0; i < items.length; i++)
        {
            let t = items[i];
            let itemId = t.id;
            if (this.utils.getItemType(itemId) < 4)
            {
                //获取的是经验或金币或勾玉
                continue;
            }
            //记录要添加的道具、材料数量和最大堆叠数
            let dic = propDic[itemId] || matDic[itemId] || null;
            if (!dic)
            {
                //未记录过的物品
                let itemCfg: any = this._configCache.getItem(itemId);
                if (consts.default.consts.Enums.ItemType.Mat === itemCfg.type)
                {
                    matDic[itemId] = {
                        num: t.num,
                        max: itemCfg.max
                    };
                    addMat++;
                }
                else
                {
                    propDic[itemId] = {
                        num: t.num,
                        max: itemCfg.max
                    };
                    addProp++;
                }
                itemsIds.push(itemId);
            }
            else
            {
                //已经记录过的物品,增加数量
                dic.num += t.num;
            }
        }
        //瀑布流
        this.getPromise1(itemsIds, false, playerId, areaId).then((res: any) =>
        {
            //未满格子的物品数量，累加到添加物品的数量上。并记录未满材料、道具的格子数量
            return new Promise((resolve: any, reject: any) =>
            {
                if (res)
                {
                    let NoFullBag: any = res;
                    NoFullBag.forEach((el: any) =>
                    {
                        let dic = propDic[el.itemId] || matDic[el.itemId] || null;
                        if (!!dic)
                        {
                            dic.num += el.num;
                            if (consts.default.consts.Enums.ItemType.Mat === el.type)
                            {
                                noFullMat++;
                            }
                            else
                            {
                                noFullProp++;
                            }
                        }
                    });
                    if (addMat > 0)
                    {
                        //获取背包中占用的材料格子数
                        this.count(consts.default.consts.Enums.ItemType.Mat, playerId, areaId, (err: any, count: number) =>
                        {
                            if (err)
                            {
                                reject(count);
                            } else
                            {
                                resolve(count);
                            }
                        }, this);
                    }
                    else
                    {
                        resolve(0);
                    }
                } else
                {
                    reject();
                }
            });
        }).then((count: number) =>
        {
            return new Promise((resolve: any, reject: any) =>
            {
                if (count)
                {
                    //已经满的格子数=已经占用的格子数-未满的格子数
                    matCount = count - noFullMat;
                    if (addProp > 0)
                    {
                        //获取背包中占用的道具格子数
                        this.count(consts.default.consts.Enums.ItemType.Prop, playerId, areaId, (err: any, c: number) =>
                        {
                            if (err)
                            {
                                reject();
                            } else
                            {
                                resolve(c);
                            }
                        }, this);
                    }
                    else
                    {
                        resolve(0);
                    }
                } else
                {
                    reject();
                }
            });
        }).then((count: number) =>
        {
            //已经满的格子数=已经占用的格子数-未满的格子数
            propCount = count - noFullProp;
            //计算添加材料后需要的格子数量
            for (let matId in matDic)
            {
                let mat = matDic[matId];
                //该材料需要的格子数量
                let num = Math.ceil(mat.num / mat.max);
                matCount += num;
            }
            //计算添加道具后需要的格子数量
            for (let propId in propDic)
            {
                let prop = propDic[propId];
                //该道具需要的格子数量
                let num = Math.ceil(prop.num / prop.max);
                propCount += num;
            }
            if (player.propBagNum < propCount)
            {
                callback.call(context, null, {
                    code: consts.default.consts.RES_CODE.ERR_FAIL,
                    msg: consts.default.consts.RES_MSG.ERR_BAG_PROP_OVERFLOW
                });
                return;
            }
            if (player.matBagNum < matCount)
            {
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
        }).catch((err: any) =>
        {
            if (!!err)
            {
                callback.call(context, null, {
                    code: consts.default.consts.RES_CODE.ERR_FAIL,
                    msg: consts.default.consts.RES_MSG.ERR_BAG_PROP_OVERFLOW
                });
                return;
            }
        });
    }

    /**
     * 根据要添加物品的Id,获取未满的格子
     */
    private getPromise1(itemsIds: any, isFull: boolean, playerId: string, areaId: number): Promise<any>
    {
        return new Promise((resolve: any, reject: any) =>
        {
            this.getByItemIdisFull(itemsIds, isFull, playerId, areaId, (err: any, res: any) =>
            {
                if (err)
                {
                    reject();
                } else if (res)
                {
                    resolve(res);
                }
            }, this);
        });
    }

    /**
     * 整理 items 列表
     * @author Andrew_Huang
     * @private
     * @param {*} items
     * @returns {*}
     * @memberof BagDao
     */
    private neatenItems(items: any): any
    {
        let itemsDis: any = {};
        items.select((t: any) =>
        {
            if (!!itemsDis[t.id])
            {
                itemsDis[t.id].num += t.num;
            }
            else
            {
                itemsDis[t.id] = t;
            }
        });
        return this._arrayUtil.dictionaryToArray(itemsDis);
    }
}
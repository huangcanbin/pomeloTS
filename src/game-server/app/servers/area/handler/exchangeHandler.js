var consts = require('../../../util/consts');
var utils = require('../../../util/utils');
var async = require('async');
var ConfigCache = require('../../../cache/configCache');
var playerDao = require('../../../dao/playerDao');
var Response = require('../../../domain/entity/response');
var ItemBuilder = require('../../../cache/itemBuilder');
var bagDao = require('../../../dao/bagDao');
var heroDao = require('../../../dao/heroDao');
var PushConsumeModel = require('../../../domain/entity/pushConsumeModel');
var pushDataToSdService = require('../../../services/pushDataToSdService');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 物品兑换
 */
Handler.prototype.exchangeItems = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let itemId = 1 * msg.id;
    let MaterialNum = 1 * msg.num;
    let exchangeNeedMoney = ConfigCache.getVar.const(consts.Keys.EXCHANGE_NEED_MONEY) * MaterialNum;
    let exchangeNeedGold = ConfigCache.getVar.const(consts.Keys.EXCHANGE_AWARD_GOLD);
    let exchangeNeedExp = ConfigCache.getVar.const(consts.Keys.EXCHANGE_AWARD_EXP);
    let exchangeNeedLifeLike = ConfigCache.getVar.const(consts.Keys.EXCHANGE_AWARD_LIFELIKE);
    let itemCnt = MaterialNum;
    let exp = 0, gold = 0, money = 0, lifelike = 0, items;
    let player,itemMap,itemArray;
    let vipConfig;
    let consumetype;
    let itemType;
    let price = ConfigCache.const.getVar(consts.Keys.EXCHANGE_NEED_MONEY);

    switch (itemId) {
        case 100000:
            MaterialNum = MaterialNum * exchangeNeedGold;
            consumetype = consts.Enums.consumeType.exchangglod;
            itemType = exchangeNeedGold;
            break;
        case 200000:
            MaterialNum = MaterialNum * exchangeNeedExp;
            consumetype = consts.Enums.consumeType.exchangexp;
            itemType = exchangeNeedExp;
            break;
        case 900000:
            MaterialNum = MaterialNum * exchangeNeedLifeLike;
            break;
        default:
            break;
    }

    items = [{itemId: itemId ,num:MaterialNum}]
    
    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;
            vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);
            exchangeNeedMoney = Math.floor(exchangeNeedMoney * vipConfig.exchange);
            price = Math.floor(price * vipConfig.exchange)
            if (player.money < exchangeNeedMoney) {
                //勾玉不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                });
                return;
            }

            items = items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            })
            itemMap = new ItemBuilder(items, ConfigCache.items());
            exp += itemMap.getExp();
            gold += itemMap.getGold();
            money += itemMap.getMoney();
            lifelike += itemMap.getLifeLike();
            itemArray = itemMap.getItem();

            if (itemArray.length > 0) {
                bagDao.isEnoughItemsBag(itemArray, player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                });
            }
            
        }, 
        function(res,cb){
            if (res.code !== consts.RES_CODE.SUC_OK) {
                next(null, res);
                return;
            }
            
            //扣除勾玉
            playerDao.setPlayer({
                $inc: {
                    money: -exchangeNeedMoney,
                }
            }, playerId, areaId, cb);
        },
        function(res,cb){
            player = res;
            if(exchangeNeedMoney > 0){
                let pushModel = new PushConsumeModel({
                    serverID: areaId,     //areaId
                    type: consumetype,
                    accountID: playerId,
                    number: exchangeNeedMoney,
                    itemType: itemType,
                    price: price,
                    itemCnt: itemCnt
                });
    
                pushDataToSdService.pushConsume(pushModel);
            }
            if (gold > 0 || exp > 0 || money > 0 || lifelike > 0) {
                playerDao.setPlayer({
                    $inc: {
                        gold: gold,
                        exp: exp,
                        lifeLike: lifelike,
                    }
                }, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        },
        function (res,cb) {
            if(!!res){
                player = res;
            }
            if (!!itemArray && itemArray.length > 0) {
                bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null);
            }
        },
        function (res,cb) {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                money: player.money,
                exp: player.exp,
                gold: player.gold,
                items: items
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
 * 兑换式神
 */
Handler.prototype.exchangeHeros = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let heroId = 1 * msg.id;
    let MaterialNum = 1 * msg.num;
    let exchangeNeedMoney = ConfigCache.getVar.const(consts.Keys.EXCHANGE_NEED_MONEY) * MaterialNum;
    //let exchangeNeedGold = ConfigCache.getVar.const(consts.Keys.EXCHANGE_AWARD_GOLD);
    let heros = [{heroId: heroId,num:MaterialNum}]
    let heroIds=[];
    let player;
    let vipConfig;
    let consumetype = consts.Enums.consumeType.exchanghero;
    let price = ConfigCache.const.getVar(consts.Keys.EXCHANGE_NEED_MONEY);
    
    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;
            vipConfig = ConfigCache.get.vipPrivilege(player.vip + 1);
            exchangeNeedMoney = Math.floor(exchangeNeedMoney * vipConfig.exchange);
            price = Math.floor(price * vipConfig.exchange);
            if (player.money < exchangeNeedMoney) {
                //勾玉不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                });
                return;
            }

            for (let i = 0; i < heros.length; i++) {
                let hero = heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
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
        function(res,cb){
            if (res.code !== consts.RES_CODE.SUC_OK) {
                next(null, res);
                return;
            }

            //扣除勾玉
            playerDao.setPlayer({
                $inc: {
                    money: -exchangeNeedMoney,
                }
            }, playerId, areaId, cb);
        },
        function (res,cb) {
            player = res;
            if(exchangeNeedMoney > 0){
                let pushModel = new PushConsumeModel({
                    serverID: areaId,     //areaId
                    type: consumetype,
                    accountID: playerId,
                    number: exchangeNeedMoney,
                    itemType: heroId,
                    price: price,
                    itemCnt: MaterialNum
                });
    
                pushDataToSdService.pushConsume(pushModel);
            }
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
        function (res,cb) {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                money: player.money,
                heros: heros
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
 * 创建物品对象
 * @param {number} item item id
 * @param {number} num 
 * @param {number} weight 
 */
var parseAndCreateItem = function (item, num, weight) {
    /*以前5位ID和第6位组成（如物品ID为111，类型为物品：则组合为：400111）
    1为金币，后5位写0，数量写在num上
    2为经验，后5位写0，数量写在num上
    3为代币，后5位写0，数量写在num上
    >3为物品，后5位写物品ID，数量写在num上    
    编号全局定义，400111 也是物品ID
    */
    var itemType = utils.getItemType(item);
    if (weight) {
        return {
            id: item,
            //itemId: itemId,
            type: itemType,
            weight: weight,
            num: num || 1
        };
    }

    return {
        id: item,
        //itemId: itemId,
        type: itemType,
        num: num || 0
    };
};
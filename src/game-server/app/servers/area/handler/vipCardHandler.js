const async = require('async');
const consts = require('../../../util/consts');
const playerDao = require('../../../dao/playerDao');
const cardDao = require('../../../dao/cardDao');
const bagDao = require('../../../dao/bagDao');
const Response = require('../../../domain/entity/response');
const ConfigCache = require('../../../cache/configCache');
const ItemBuilder = require('../../../cache/itemBuilder');
const utils = require('../../../util/utils');

module.exports = (app) => {
    return new Handler(app);
};

let Handler = function (app) {
    this.app = app;
};

/**
 * 获取特权卡使用情况
 */
Handler.prototype.getUseInfo = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');

    async.waterfall([
        (cb) => {
            cardDao.get(playerId, areaId, cb);
        },
        (res, cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                monValTime: res.monValTime,
                getMonEvydayAward: res.isGetMonEvydayAward(),
                buyEte: res.isBuyEte(),
                getEteEvydayAward: res.isGetEteEvydayAward()
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
};

/**
 * 获取特权卡价格和奖励信息
 */
Handler.prototype.getPriceAndAward = (msg, session, next) => {
    let monCfg = ConfigCache.get.card(1);   //月卡配置信息
    let eteCfg = ConfigCache.get.card(2);   //终身卡配置信息

    Response({
        code: consts.RES_CODE.SUC_OK,
        msg: '',
        monPrice: monCfg.price,
        etePrice: eteCfg.price,
        buyMonAward: monCfg.buyAward,
        buyEteAward: eteCfg.buyAward,
        monEvydayAward: monCfg.evydayAward,
        eteEvydayAward: eteCfg.evydayAward
    }, next);
};

/**
 * 购买特权卡
 */
Handler.prototype.buy = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let type = 1 * msg.type;
    let card = {};

    let cfg = ConfigCache.get.card(type);   //配置信息
    let incGold = 0, incExp = 0, incMoney = 0, incItem = [];
    let now = Date.now();

    if (!cfg) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
        });
        return;
    }

    let itemMap = new ItemBuilder(cfg.buyAward, ConfigCache.items());
    incGold = itemMap.getGold();
    incExp = itemMap.getExp();
    incMoney = itemMap.getMoney();
    incItem = itemMap.getItem();
    const addTime = 1000 * 3600 * 24 * 30; //月卡有效期30天

    async.waterfall([
        (cb) => {
            cardDao.get(playerId, areaId, cb);
        },
        (res, cb) => {
            card = res;

            if (!!card.playerId) {
                //更新
                let setter;
                if (type == 1) {    //月卡
                    let monValTime = now + addTime;
                    if (card.monValTime > now) {
                        //有效期内继续充值
                        monValTime = card.monValTime + addTime; //累加30天
                    }

                    setter = {
                        $set: {
                            monBuyTime: now,
                            monValTime: monValTime
                        }
                    };
                }
                else {  //终身卡
                    if (card.isBuyEte()) {
                        //已经购买终身卡
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_BUY_ETE_CARD
                        });
                        return;
                    }

                    //终身卡
                    setter = {
                        $set: {
                            eteBuyTime: now
                        }
                    };
                }

                cardDao.setCard(setter, playerId, areaId, cb);
            }
            else {
                //添加
                let entity = {};
                if (type == 1) {    //月卡
                    entity.monBuyTime = now;
                    entity.monValTime = now + addTime;
                }
                else {   //年卡
                    entity.eteBuyTime = now;
                }

                cardDao.create(entity, playerId, areaId, cb);
            }
        },
        (cb) => {
            //更新勾玉/金币/经验
            if (incGold > 0 || incExp > 0 || incMoney > 0) {
                playerDao.setPlayer({
                    $inc: {
                        gold: incGold,
                        exp: incExp,
                        money: incMoney
                    }
                }, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        },
        (res, cb) => {
            if (!!incItem && incItem.length > 0) {
                bagDao.createOrIncBag(incItem, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null);
            }
        },
        (cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                items: cfg.buyAward
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
};

/**
 * 领取特权卡每日奖励
 */
Handler.prototype.getAward = (msg, session, next) => {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let type = 1 * msg.type;
    let player = {}, card = {}, cardset = {};
    let incGold = 0, incExp = 0, incMoney = 0, incItem = [];
    let cfg = ConfigCache.get.card(type);   //配置信息
    let now = Date.now();

    if (!cfg) {
        //配置信息错误
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
        });
        return;
    }

    async.waterfall([
        (cb) => {
            cardDao.get(playerId, areaId, cb);
        },
        (res, cb) => {
            card = res;
            if (!card.playerId) {
                //未购买特权卡
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_BUY_CARD
                });
                return;
            }

            if (type == 1) {    //月卡                
                if (card.monValTime < now) {
                    //月卡未购买或已过期
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_MON_CARD_OUT_TIME
                    });
                    return;
                }

                if (card.isGetMonEvydayAward()) {
                    //月卡奖励今天已经领取过
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_CARD_TODAY_AWARD
                    });
                    return;
                }

                //需要更新月卡领奖时间
                cardset = { $set: { monEvydayAwardTime: now } };
            }
            else {  //终身卡
                if (!card.isBuyEte()) {
                    //未购买终身卡
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_NOT_BUY_ETE_CARD
                    });
                    return;
                }

                if (card.isGetEteEvydayAward()) {
                    //终身卡奖励今天已经领取过
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_CARD_TODAY_AWARD
                    });
                    return;
                }

                //需要更新终身卡领奖时间
                cardset = { $set: { eteEvydayAwardTime: now } };
            }

            let itemMap = new ItemBuilder(cfg.evydayAward, ConfigCache.items());
            incGold = itemMap.getGold();
            incExp = itemMap.getExp();
            incMoney = itemMap.getMoney();
            incItem = itemMap.getItem();

            if (!!incItem && incItem.length > 0) {
                playerDao.getPlayer(playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        },
        (res, cb) => {
            if (!!incItem && incItem.length > 0) {
                if (!!res) {
                    bagDao.isEnoughItemsBag(incItem, player, playerId, areaId, cb);
                }
                else {
                    //玩家信息获取失败
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_INTEN
                    });
                    return;
                }
            }
            else {
                //无物品,无需验证背包数量
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

            //更新领奖时间
            cardDao.setCard(cardset, playerId, areaId, cb);
        },
        (cb) => {
            //更新勾玉/金币/经验
            if (incGold > 0 || incExp > 0 || incMoney > 0) {
                playerDao.setPlayer({
                    $inc: {
                        gold: incGold,
                        exp: incExp,
                        money: incMoney
                    }
                }, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        },
        (res, cb) => {
            if (!!incItem && incItem.length > 0) {
                bagDao.createOrIncBag(incItem, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null);
            }
        },
        (cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                items: cfg.evydayAward
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
};
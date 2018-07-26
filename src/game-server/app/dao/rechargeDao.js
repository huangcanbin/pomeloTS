const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const consts = require('../util/consts');
const Recharge = require('../domain/entity/recharge');

/**
 * 玩家充值奖励Dao
 */
class rechargeDao {
    /**
     * 购买时创建或更新特权卡
     */
    static create(recharge, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Recharge", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            recharge.playerId = playerId;
            let entity = new Recharge(recharge);

            col.insertOne(entity, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
                close();
                utils.invokeCallback(next, null);
            });
        });
    }

    /**
     * 修改玩家充值奖励
     */
    static set(setter, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Recharge", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.updateOne({ playerId: playerId }, setter, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
                close();
                utils.invokeCallback(next, null);
            });
        });
    }

    /**
     * 修改玩家充值奖励状态
     */
    static setStatus(status, playerId, areaId, next) {
        rechargeDao.set({
            $set: {
                status: status
            }
        }, playerId, areaId, next);
    }

    /**
     * 获取玩家充值奖励
     */
    static get(playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Recharge", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId };
            col.findOne(entity, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();

                let entity = new Recharge(res);

                utils.invokeCallback(next, null, entity);
            });
        });
    }

    /**
     * 是否达到充值金额
     */
    static isCompleteRecharge(rechargeCfg, recMoney) {
        if (!rechargeCfg) {
            return false;
        }
        
        if (recMoney >= rechargeCfg.needMoney && recMoney > 0) {
            return true;
        }
        else {
            return false;
        }
    }
}

/**
 * 玩家充值奖励Dao
 */
module.exports = rechargeDao;
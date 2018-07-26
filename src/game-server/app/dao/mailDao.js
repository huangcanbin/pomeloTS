const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const Mail = require('../domain/entity/mail');
const ConfigCache = require('../../app/cache/configCache');
const playerDao = require('./playerDao');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');

/**
 * 玩家关卡奖励领取记录
 */
class mailDao {
    /**
     * 创建记录
     */
    static create(entity, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Mail", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }
            if(!entity){
                entity = [];
                entity.push(new Mail({playerId: playerId,items: [{"id":600100,"type":6,"num":1}]}));
            }
            col.insertMany(entity, (err, res) => {
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
     * 创建邮件
     */
    static creatMail(mail, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("Mail", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            mail.playerId = playerId;
            let entity = new Mail(mail);
            col.insertOne(entity, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
                close();
                playerDao.setPlayer({
                    $inc: {
                        hasNewMail: 1
                    }
                }, playerId, areaId, next);
                // utils.invokeCallback(next, null);
            });
        });
    }

    /**
     * 根据玩家id获取邮件记录
     */
    static getByPlayerId(playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Mail", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            col.deleteMany({ playerId: playerId,deltime: {$lt:Date.now()} }, function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
            });

            let entity = { playerId: playerId };
            col.find(entity).toArray(function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();

                var result = res.select((t) => {
                    let entity1 = new Mail(t);
                    entity1.id = t._id;
                    return entity1;
                });

                utils.invokeCallback(next, null, result);
            });
        });
    }

    /**
     * 根据ID获取邮件记录
    */
    static getByID(mailIdArray, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Mail", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId, _id: { $in: mailIdArray }  };
            col.find(entity).toArray(function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();

                var result = res.select((t) => {
                    let entity1 = new Mail(t);
                    entity1.id = t._id;
                    return entity1;
                });

                utils.invokeCallback(next, null, result);
            });
        });
    }

    /**
     * 根据ID删除邮件
    */
   static delByID(mailIdArray, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Mail", function (err, col, close) {
            if (!!err) {
                close(); //release connect
                utils.invokeCallback(next, err, null);
               return;
           }

           col.deleteMany({ playerId: playerId,_id: { $in: mailIdArray } }, function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
            });
            close();
        });
    }

    /**
     * 修改已读状态
     */
    static upReadMailStatus(mailId, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Mail", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let setter = {
                $set: {
                    isread: 1
                }
            };
            col.findOneAndUpdate({ playerId: playerId, _id: mailId }, setter, (err, res) => {
                close();

                if (!!err) {
                    utils.invokeCallback(next, err);
                    return;
                }

                utils.invokeCallback(next, null);
            });
        });
    }

    /**
     * 根据奖励配置ID更新领取一次性充值25元额外奖记录
     */
    static upOnceStatusByAwaId(awaId, status, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("Mail", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let setter = {
                $set: {
                    onceStatus: status
                }
            };
            col.updateOne({ playerId: playerId, awardId: awaId }, setter, (err, res) => {
                close();

                if (!!err) {
                    utils.invokeCallback(next, err);
                    return;
                }

                utils.invokeCallback(next, null);
            });
        });
    }
}

/**
 * 玩家关卡奖励领取记录
 */
module.exports = mailDao;
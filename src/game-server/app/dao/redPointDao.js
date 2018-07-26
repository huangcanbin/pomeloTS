const pomelo = require('pomelo');
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
const arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const RedPoint = require('../domain/entity/redPoint');
const playerDao = require('./playerDao');
var messageService = require('../domain/messageService');
/**
 * 玩家红点状态状态记录
 */
class redPointDao {
    /**
     * 根据玩家id获取红点状态记录
     */
    static getByPlayerId( playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("RedPoint", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId };
            col.find(entity).toArray(function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();
                var rpRecords = [];
                if (!!res && res.length > 0) {
                    for (var i = 0; i < res.length; i++) {
                        var r = res[i];
                        rpRecords.push({
                            type: r.type,
                            id: r.id,
                            status: r.status
                        });
                    }
                }

                utils.invokeCallback(next, null, rpRecords);
            });
        });
    }

    /**
     * 根据玩家id获取红点状态记录
     */
    static getByPlayerIdAndType( playerId, type, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("RedPoint", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err, null);
                return;
            }

            let entity = { playerId: playerId ,type: type};
            col.findOne(entity, (err, res) => {
                close();
                if (!!err) {
                    utils.invokeCallback(next, err, null);
                    return;
                }

                let entity;
                if(!!res){
                    entity = new RedPoint(res);
                }
                else{
                    entity = null                    
                }

                utils.invokeCallback(next, null, entity);
            });
        });
    }

    /**
     * 根据玩家id更新红点状态记录(服务端)
     */
    static upStatus(msg, playerId, areaId, next) {
        let type = msg.type;
        let id = msg.id || 0;
        let status = msg.status;
        let bPush = false;
        let entity = new RedPoint({
            playerId: playerId,
            type: type,
            status: status,
            id: id
        });

        let condition = {
            playerId:playerId,
            type:type,
            id: id
        }

        let setter = {
            $set: {
                status: status,
            }
        };

        let client = dbDriver.get(areaId, consts.DB.Data.name);
        if (!client || !client.connect) {
            utils.invokeCallback(next, consts.RES_MSG.ERR_NO_DATABASE_AVAILABLE);
            return;
        }
        client.connect("RedPoint", (err, col, close) => {
            if (!!err) {
                console.log('push rpmesseage to %s error! %s', uid, err.stack);
            }

            col.findOne(condition, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                if(!!res){
                    if(res.status != status){
                        col.updateOne(condition, setter, (err, res) => {
                            close();
            
                            if (!!err) {
                                utils.invokeCallback(next, err);
                                return;
                            }
            
                            utils.invokeCallback(next, null, true);
                        });
                        
                    }else{
                        utils.invokeCallback(next, null, false);
                    }
                }
                else{
                    col.insertOne(entity, (err, res) => {
                        if (!!err) {
                            close();
                            utils.invokeCallback(next, err);
                            return;
                        }
                        close();
                        if(status == 1){
                            utils.invokeCallback(next, null, true);
                        }else{
                            utils.invokeCallback(next, null, false);
                        }
                    });     
                    
                    
                }
            }); 
        });
    }

    
}

module.exports = redPointDao;
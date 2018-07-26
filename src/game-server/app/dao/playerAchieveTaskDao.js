const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
var arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const PlayerAchieveTask = require('../domain/entity/playerAchieveTask');
const ConfigCache = require('../../app/cache/configCache');
const playerDao = require('./playerDao');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');
const towerDao = require('./towerDao');



/**
 * 玩家成就任务Dao
 */
class playerAchieveTaskDao {
    /**
     * 创建成就任务
     */
    static createMany(tasks, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerAchieveTask", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let entitys = [];
            for (let i = 0; i < tasks.length; i++) {
                let task = Object.assign({ playerId: playerId }, tasks[i]);
                entitys.push(new PlayerAchieveTask(task));
            }

            col.insertMany(entitys, (err, res) => {
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
     * 设置
     */
    static setMany(whereStr, setter, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerAchieveTask", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.updateMany(whereStr, setter, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();
                utils.invokeCallback(next, null, null);
            });
        });
    }



    /**
     * 获取成就任务
     */
    static getOne(taskId, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerAchieveTask", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.findOne({ playerId: playerId, type: taskId }, (err, res) => {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err);
                    return;
                }
                close();
                utils.invokeCallback(next, err, res);
            });
        });
    }


    /**
     * 获取所有成就任务
     */
    static getAll(playerId, areaId, next) {
        var self = this;
        var client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerAchieveTask", function (err, col, close) {
            if (!!err) {
                close(); //release connect
                utils.invokeCallback(next, err, null);
                return;
            }

            var entity = { playerId: playerId };
            col.find(entity).sort({ type: 1 }).toArray(function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();
                var tasks = []; //存放成就任务情况
                if (!!res && res.length > 0) {
                    for (var i = 0; i < res.length; i++) {
                        var r = res[i];
                        tasks.push({
                            id: r.type,
                            status: r.status,
                            finishTime: r.finishTime,
                        });
                    }
                }

                let taskLack = [];  //存放用户未建立的成就任务记录
                let taskAll = [];
                let achieveTask = ConfigCache.getAll.achieveTask();

                arrayUtil.dictionaryToArray(achieveTask).select((t) => {
                        taskAll.push(t);
                });

                //补充字段，并判断任务记录是否已创建
                for(var j=0; j<taskAll.length; j++)
                {
                    for(var k = 0; k < tasks.length; k++)
                    {
                        if(taskAll[j].id == tasks[k].id)    
                        {
                            tasks[k].type = taskAll[j].type;  
                            tasks[k].score = taskAll[j].score;  
                            tasks[k].items = taskAll[j].items;  
                            tasks[k].heros = taskAll[j].heros;  
                            tasks[k].heroIds = taskAll[j].heroIds;  
                            break;
                        }
                        
                    }
                    if( k == tasks.length)  //未建立的记录
                    {
                        taskLack.push(taskAll[j]);
                        tasks.push({
                            id: taskAll[j].id,
                            type: taskAll[j].type,
                            status: 0,
                            finishTime: 0,
                            score: taskAll[j].score, 
                            items: taskAll[j].items,
                            heros: taskAll[j].heros,
                            heroIds: taskAll[j].heroIds,
                        });
                    }
                }

                if(taskLack.length > 0){    //存在未创建的记录时
                    self.createMany(taskLack, playerId, areaId, function() {
                        utils.invokeCallback(next, null, tasks);
                    });  //创建记录
                }
                else{
                    utils.invokeCallback(next, null, tasks);
                }
            });
        });
    }

}

/**
 * 玩家任务Dao
 */
module.exports = playerAchieveTaskDao;
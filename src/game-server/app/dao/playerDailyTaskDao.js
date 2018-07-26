const pomelo = require('pomelo');
const logger = require('pomelo-logger').getLogger(__filename);
const dbDriver = require('../drive/dbDriver');
const utils = require('../util/utils');
var arrayUtil = require('../util/arrayUtil');
const consts = require('../util/consts');
const async = require('async');
const PlayerDailyTask = require('../domain/entity/playerDailyTask');
const ConfigCache = require('../../app/cache/configCache');
const playerDao = require('./playerDao');
const lineupDao = require('./lineupDao');
const heroDao = require('./heroDao');
const towerDao = require('./towerDao');



/**
 * 玩家日常任务Dao
 */
class playerDailyTaskDao {
    /**
     * 创建日常任务
     */
    static createMany(tasks, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerDailyTask", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            let entitys = [];
            for (let i = 0; i < tasks.length; i++) {
                let task = Object.assign({ playerId: playerId }, tasks[i]);
                entitys.push(new PlayerDailyTask(task));
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
     * 设置某个日常任务情况
     */
    static set(setter, playerId, taskId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerDailyTask", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.updateOne({ playerId: playerId, type: taskId }, setter, (err, res) => {
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
     * 重置操作
     */
    static reset(condition, setter, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerDailyTask", (err, col, close) => {
            if (!!err) {
                close();
                utils.invokeCallback(next, err);
                return;
            }

            col.updateMany(condition, setter, (err, res) => {
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
     * 筛选重置项
     */
    static isReset(task, award, playerId, areaId, next) {
        var resetTime = 1000 * (consts.Vars.DAILY_TASK_RESET_HOUR * 3600 + consts.Vars.DAILY_TASK_RESET_MIN * 60 + consts.Vars.DAILY_TASK_RESET_SEC); //重置时间点对应的偏移时间戳
        var remedialList = []; //待补领奖励的登记
        let condition = {};
        let lastActivity = 0; //前日总活跃值
        condition.playerId = playerId;
        condition.type = {"$in": new Array()};
        for(var i=0; i<task.length;i++)
        {
            if (!utils.isSameDate(task[i].finishTime - resetTime, Date.now() - resetTime ))  //上次完成时间与当前时间非同一个计日周期内，需要重置的
            {
                logger.debug(utils.getZeroHour(Date.now()));
                logger.debug(utils.getZeroHour(task[i].finishTime));
                if (task[i].completeTimes > 0 && utils.getZeroHour(Date.now() - resetTime) - utils.getZeroHour(task[i].finishTime - resetTime) <= 24*60*60*1000 )  //前一天的活跃值累计
                {
                    lastActivity += task[i].completeTimes * task[i].activity; 
                }
                condition.type["$in"].push(task[i].type);   //赋予重置条件
                task[i].finishTime = Date.now();
                task[i].completeTimes = 0;
            }
        }

        for(var i=0; i<award.length; i++)
        {
            if(!utils.isSameDate(award[i].finishTime - resetTime, Date.now() - resetTime ))  //上次完成时间与当前时间非同一个日周期内，需要重置的
            {
                if (award[i].completeTimes == 0 && utils.getZeroHour(Date.now() - resetTime) - utils.getZeroHour(award[i].finishTime - resetTime) <= 24*60*60*1000 && lastActivity > award[i].activity)    //对于前日未领取的奖励进行判断：跨天数不超过一天的，未领取,活跃值大于需求活跃值
                {
                    remedialList.push(award[i].type);
                }
                
                condition.type["$in"].push(award[i].type);   //赋予重置条件
                award[i].finishTime = Date.now();
                award[i].completeTimes = 0;
            }
        }
            
        if(condition.type["$in"].length > 0) {  //表内重置
            playerDailyTaskDao.reset(condition, {
                $set: {
                    finishTime: Date.now(),
                    completeTimes: 0
                }
            }, playerId, areaId, function () {
                playerDao.setPlayer({$set:{ remedialList : remedialList , isRemedial : false }}, playerId, areaId, next); //无论如何重置时候都要重置补领列表
            });
        }else {
            utils.invokeCallback(next, null, null);
        }
    }
  

    /**
     * 修改玩家任务完成次数
     */
    static update(taskId, inc, playerId, areaId, next) {
        let dailyTask = ConfigCache.get.dailyTask(taskId);
        var self = this;
        playerDailyTaskDao.getAll(playerId, areaId, function(){   //每次完成任务都需对重置条件进行判定
            self.getOne(taskId, playerId, areaId, function(err, res){
                var dailyTaskOne = res;
                if(dailyTaskOne.completeTimes <= dailyTask.limit) {
                    if (taskId == consts.Enums.dailyTaskType.DailyOnline)    //每日持续在线只能设置不能累加
                    {
                        playerDailyTaskDao.set({
                            $set: {
                                completeTimes: inc,
                                finishTime: Date.now()
                            }
                        }, playerId, taskId, areaId, next);

                    }else {
                        if(dailyTaskOne.completeTimes + inc >= dailyTask.limit)  
                        {
                            inc = dailyTask.limit - dailyTaskOne.completeTimes; //严格控制不可超出最大值
                        }
                        playerDailyTaskDao.set({
                            $inc: {
                                completeTimes: inc
                            },
                            $set: {
                                finishTime: Date.now()
                            }
                        }, playerId, taskId, areaId, next);
                    }
                }else {
                    utils.invokeCallback(next, err, null);
                }
            });
        });
    }

    /**
     * 获取日常任务
     */
    static getOne(taskId, playerId, areaId, next) {
        let client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerDailyTask", (err, col, close) => {
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
     * 获取玩家所有日常任务(同时进行重置判定及未建表的建立)
     */
    static getAll(playerId, areaId, next) {
        var self = this;
        var client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerDailyTask", function (err, col, close) {
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

                var datas = []; //存放最终处理结果
                var tasks = []; //存放日常任务情况
                var awards = []; //存放奖励领取情况

                if (!!res && res.length > 0) {
                    for (var i = 0; i < res.length; i++) {
                        var r = res[i];
                        if(r.type < 1000) {   //任务
                            tasks.push({
                                id: r.type,
                                type: r.type,
                                completeTimes: r.completeTimes,
                                finishTime: r.finishTime,
                            });
                        }else {
                            awards.push({       //奖励
                                id: r.type,
                                type: r.type,
                                completeTimes: r.completeTimes,
                                finishTime: r.finishTime,
                            });
                        }
                    }
                }


                let taskLack = [];  //存放用户未建立的日常任务和奖励领取任务记录

                let taskAll = [];
                let taskAwardAll = [];
                let dailyTask = ConfigCache.getAll.dailyTask();
                let dailyTaskAward = ConfigCache.getAll.dailyTaskAward();

                arrayUtil.dictionaryToArray(dailyTask).select((t) => {
                        taskAll.push(t);
                });

                arrayUtil.dictionaryToArray(dailyTaskAward).select((t) => {
                    taskAwardAll.push(t);
                });
                
                //补充字段，并判断任务记录是否已创建
                for(var j=0; j<taskAll.length; j++)
                {
                    for(var k = 0; k < tasks.length; k++)
                    {
                        if(taskAll[j].type == tasks[k].type)    
                        {
                            tasks[k].limit = taskAll[j].limit;  //完成次数上限
                            tasks[k].activity = taskAll[j].activity;  //单次活跃值
                            break;
                        }
                        
                    }
                    if( k == tasks.length)
                    {
                        taskLack.push(taskAll[j]);
                        tasks.push({
                            id: taskAll[j].type,
                            type: taskAll[j].type,
                            completeTimes: 0,
                            finishTime: Date.now(),
                            limit: taskAll[j].limit,
                            activity: taskAll[j].activity,
                        });
                    }
                }

                //补充字段，并判断领奖情况记录是否已创建
                for(var j=0; j<taskAwardAll.length; j++)
                {
                    for(var k = 0; k < awards.length; k++)
                    {
                        if(taskAwardAll[j].id == awards[k].type)
                        {
                            awards[k].activity = taskAwardAll[j].activity;  //需求活跃值
                            awards[k].items = taskAwardAll[j].items;  
                            awards[k].heros = taskAwardAll[j].heros;
                            break;
                        }
                        
                    }
                    if( k == awards.length)
                    {
                        taskAwardAll[j].type = taskAwardAll[j].id;
                        taskLack.push(taskAwardAll[j]);
                        awards.push({
                            id: taskAwardAll[j].id,
                            type: taskAwardAll[j].id,
                            completeTimes: 0,
                            finishTime: Date.now(),
                            activity: taskAwardAll[j].activity,
                            items: taskAwardAll[j].items,
                            heros: taskAwardAll[j].heros
                        });
                    }
                }

                //对需要重置的任务进行重置
                self.isReset(tasks, awards, playerId, areaId , function (err,res) {
                    if(res)
                    {
                        datas['player'] = res;
                    }
                    datas['task'] = tasks;
                    datas['award'] = awards;
                    if(taskLack.length > 0){    //存在未创建的记录时
                        self.createMany(taskLack, playerId, areaId, function() {
                            utils.invokeCallback(next, null, datas);
                        });  //创建记录
                    }
                    else{
                        utils.invokeCallback(next, null, datas);
                    }
                });
            });
        });
    }





    /**
     * 统计总活跃值
     */
    static count(playerId, areaId, next) {
         var client = dbDriver.get(areaId, consts.DB.Data.name);
        client.connect("PlayerDailyTask", function (err, col, close) {
            if (!!err) {
                close(); //release connect
                utils.invokeCallback(next, err, null);
                return;
            }

            var entity = { playerId: playerId , type: { $lt:1000 } };
            col.find(entity).sort({ type: 1 }).toArray(function (err, res) {
                if (!!err) {
                    close();
                    utils.invokeCallback(next, err, null);
                    return;
                }
                close();

                var totalActivity = 0; //存放日常任务情况

                if (!!res && res.length > 0) {
                    for (var i = 0; i < res.length; i++) {
                        var r = res[i];
                        if(r.type < 1000) {   
                            totalActivity = totalActivity + r.completeTimes * ConfigCache.get.dailyTask(r.type).activity;
                        }
                    }
                }
                utils.invokeCallback(next, null, totalActivity);
            });
        });
    }
}

/**
 * 玩家任务Dao
 */
module.exports = playerDailyTaskDao;
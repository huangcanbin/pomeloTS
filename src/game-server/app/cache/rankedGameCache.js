var CommandMode = require("nbframe-storage").CommandMode;
const pomelo = require('pomelo');
const storage = require('../drive/cacheStorage').default;
var utils = require('../util/utils');
var async = require('async');
var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../util/consts');
var arrayUtil = require('../util/arrayUtil');
const ConfigCache = require('./configCache');
var syntax = 'bgyx';

/**
 * 排位赛redis Cache
 */
let handle = module.exports;





/**
 * 获取玩家排名信息
 */
handle.getRank = (key,val,next) => {
    let commandOptions = {
        mode: CommandMode.SortSet,
        filter:{ id:val}
    }

    let database = storage.connect(syntax);
    database.query
    var res = database.query(key,commandOptions).then(
        res => {
            utils.invokeCallback(next,null,res);
        }
    ).catch(err => {
        utils.invokeCallback(next,err,null);
    })
};


/**
 * 获取玩家分数信息
 */
handle.getScore = (key,val,next) => {

    let commandOptions = {
        mode: CommandMode.SortSet,
        filter:{ id:val,where:{ withscores:true}}
    }

    let database = storage.connect(syntax);
    var res = database.query(key,commandOptions).then(
        res => {
            utils.invokeCallback(next,null,res);
        }
    ).catch(err => {
        utils.invokeCallback(next,err,null);
    })
};



/**
 * 根据玩家排名获取玩家id
 */
handle.getRankingIds = (key,rankList,next) => {

    let commandOptions = {
        mode: CommandMode.SortSet,
        filter:{ where:{ withscores:true, min:rankList[0], max:rankList[2]}, offset:0,limit:2000}
    }

    let database = storage.connect(syntax);

    var res = database.query(key,commandOptions).then(
        res => {
            utils.invokeCallback(next,null,res);
        }
    ).catch(err => {
        utils.invokeCallback(next,err,null);
    })
};



/**
 * 获取玩家redis信息
 */
handle.getPlayerByIds = (key,next) => {

    let commandOptions = {
        mode: CommandMode.String,
    }
    let database = storage.connect(syntax);

    var res = database.query(key,commandOptions).then(
        res => {
            utils.invokeCallback(next,null,res);
        }
    ).catch(err => {
        utils.invokeCallback(next,err,null);
    })
};


/**
 * 设置玩家redis中排行
 */
handle.setRank = (key,val,score, next) => {

    let database = storage.connect(syntax);
    let commandOptions = {
        upsert: [val],
        score:[score],
        mode: CommandMode.SortSet,
    }

    database.setOrAdd(key,commandOptions).then(
        res => {
            utils.invokeCallback(next,null,res);
        }
    ).catch(err => {
        utils.invokeCallback(next,err,null);
    });
    
};



/**
 * 更新玩家redis中排位赛信息
 */
handle.update = (key,val,expireSec,next) => {

    let database = storage.connect(syntax);
    let commandOptions = {
        upsert: val,
        expired: expireSec,
        mode: CommandMode.String,
    }
    database.setOrAdd(key,commandOptions).then(
        res => {
            utils.invokeCallback(next,null,res);
        }
    ).catch(err => {
        utils.invokeCallback(next,err,null);
    });
    
};


/**
 * 获取所有玩家
 */
handle.getAll = (key,next) => {

    let commandOptions = {
        mode: CommandMode.SortSet,
        filter:{ where:{ withscores:true, min:0, max:9000000000000},offset:0,limit:100000 } //max要覆盖所有时间戳
    }

    let database = storage.connect(syntax);

    var res = database.query(key,commandOptions).then(
        res => {
            utils.invokeCallback(next,null,res);
        }
    ).catch(err => {
        utils.invokeCallback(next,err,null);
    })
};




var dbLoader = require('./dbLoader');
var utils = require('../util/utils');
var async = require('async');
var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../util/consts');
var arrayUtil = require('../util/arrayUtil');

var refreshConf = module.exports;

//更新配置表
refreshConf.refresh = function (table , next) {
    dbLoader.queryConfig(table ,function (err, res) {

        if(!!err) {
            logger.error('config cache load error:%s', err.stack);
        }

        //配置分项的情况,最后一位为标志位
        if(res[res.length-1] == 'branchFlag')
        {
            let idxKey = []; //索引表的key值
            for(var i=0; i<res.length-1; i++)
            {
                if (!res[i]) continue;
                idxKey.push(i);
                dbLoader.updateConfig(table+'.'+i,res[i],function (err, res) {

                    if(!!err) {
                        logger.error('config cache load error:%s', err.stack);
                    }

                });
            }
            dbLoader.updateConfig(table,idxKey,function (err, res) {

                if(!!err) {
                    logger.error('config cache load error:%s', err.stack);
                }
                
            });
            utils.invokeCallback(next, null, 1);
        }
        //未分项
        else
        {
            dbLoader.updateConfig(table,res,function (err, res) {
    
                if(!!err) {
                    logger.error('config cache load error:%s', err.stack);
                }
                utils.invokeCallback(next, null, res);
            });
        } 
    });
}








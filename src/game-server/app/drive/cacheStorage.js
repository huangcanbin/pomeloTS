"use strict";
exports.__esModule = true;
/**
 * 定义一个静态的Storage实例，提供给当前项目全局使用
 */
var logger = require('pomelo-logger').getLogger(__filename);
var CommandMode = require("nbframe-storage").CommandMode;
//TODO
// logger.error('================stroage test==========')
var nbframe_storage_1 = require("nbframe-storage");
var redis = require("redis");
var accountConfig = require("../../../shared/config/account-reids");

var syntax = 'bgyx';
var storage = new nbframe_storage_1["default"]();
storage.driveModule.redis = redis;
var env = process.env.NODE_ENV || "production";
var accountSetting = accountConfig[env] || [];
storage.connectError = function (err) {
    logger.error('redis connect to accountdb fail:%j.', err);
};
var db = storage.configure(syntax, accountSetting);
db.checkConnect();

// storage.connect(syntax).query("xxx", {
//     mode: CommandMode.SortSet,
//     filter:{ id:'val'}
// }).then(function(res){
//     logger.error('==============val');
// }).catch(function(err){

//     logger.error('===================err:%j', err);
// });
//TODO
// logger.error('================stroage test end==========')
exports.default  = storage;

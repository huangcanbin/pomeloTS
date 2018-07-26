
/**
 * 定义一个静态的Storage实例，提供给当前项目全局使用
 */
import logger from '../util/logger';
import NbframeStorage, { Database } from "nbframe-storage";
import mongodb = require('mongodb');
import redis = require("redis");
import mysql = require('mysql');
import dbConfig from "./config/";


let storage = new NbframeStorage();
storage.driveModule.mysql = mysql;
storage.driveModule.mongodb = mongodb;
storage.driveModule.redis = redis;
storage.connectError = function (err) {
    logger.error('redis connect to accountdb fail:%j.', err);
};

let mysqlDb = storage.configure("bgx-config", dbConfig.config);
mysqlDb.checkConnect();


let redisDb = storage.configure("bgx-cache", dbConfig.cache);
redisDb.checkConnect();


export function connectCache(): Database {
    return storage.connect("bgx-cache");
};

export function connectConfig(): Database {
    return storage.connect("bgx-config");
};

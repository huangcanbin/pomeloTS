var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);

var consts = require('../util/consts');
var utils = require('../util/utils');


var userDao = module.exports;

/**
 * get user infomation by userId
 * @param {Number} uid UserId
 * @param {function} cb Callback function
 */
userDao.getUserById = function (uid, cb) {
    var sql = 'select id,name from account where id = ?';
    var args = [uid];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('get user for userDao failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, null);
            return;
        }

        if (!!res && res.length > 0) {
            var user = res[0];
            utils.invokeCallback(cb, null, { id: user.id, name: user.name });
        } else {
            utils.invokeCallback(cb, 'not exist user', { id: 0, name: '' });
        }
    });
};

/**
 * 账号登出
 */
userDao.userLogout = function (uid, cb) {

    var sql = 'update account set last_logout = ? where id = ?';
    var args = [Date.now(), uid];
    pomelo.app.get(consts.DB.Shared.name).update(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('userLogout for userDao failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, null);
            return;
        }

        utils.invokeCallback(cb, null);
    });
}

/**
 * 
 * @param {Number} uid UserId
 * @param {Number} areaId areaId
 * @param {function} cb Callback function
 */
userDao.checkRole = function (uid, areaId, cb) {
    var sql = 'select id,name from user_role where account_id = ? and area_id = ?';
    var args = [uid, areaId];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('get role for userDao failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, null);
            return;
        }

        if (!!res && res.length > 0) {
            var user = res[0];
            utils.invokeCallback(cb, null, { id: user.id, name: user.name });
        } else {
            utils.invokeCallback(cb, null, null);
        }
    });
};

/**
 * 创建全区角色
 * 
 * @param {String} name playerName
 * @param {Number} roleType roleType
 * @param {Number} uid UserId
 * @param {Number} areaId areaId
 * @param {function} cb Callback function
 */
userDao.createRole = function (name, roleType, uid, areaId, cb) {

    var time = Date.now();
    var sql = 'INSERT INTO `user_role` (role_type,account_id,name,lv,area_id,last_login) values(?,?,?,?,?,?)';

    var args = [roleType, uid, name, 1, areaId, time];
    pomelo.app.get(consts.DB.Shared.name).insert(sql, args, function (err, res) {
        if (err !== null) {
            utils.invokeCallback(cb, { code: err.number, msg: err.message }, null);
        } else {
            var playerId = parseInt(uid);//res.insertId;  各区采用相同的id
            utils.invokeCallback(cb, null, playerId);
        }
    });
};

/**
 * @param {Number} uid UserId
 * @param {function} cb Callback function
 */
userDao.getHistoryRoleAreas = function (uid, areaType, cb) {
    var sql = 'select a.id,a.area_no,a.area_name,a.area_type,a.status,a.start_time,b.id as playerId,b.account_id,b.last_login from area_list a INNER JOIN user_role b on b.area_id = a.id where b.account_id = ? and a.area_type = ? and a.status > 0 order by b.last_login desc';
    var args = [uid, areaType];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('get role for userDao failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, null);
            return;
        }

        var areas = [];
        if (!!res && res.length > 0) {
            for (var i = 0; i < res.length; i++) {
                var r = res[i];
                areas.push({
                    id: r.id,
                    no: r.area_no,
                    name: r.area_name,
                    status: r.status,
                    start: r.start_time,
                    playerId: r.account_id //TODO: 多个区之间id相同
                });
            }
        }
        utils.invokeCallback(cb, null, areas);
    });
};

userDao.getAreas = function (areaType, skip, take, cb) {
    var sql = 'select id,area_no,area_name,area_type,status,start_time from area_list where area_type = ? and status > 0 order by area_no desc limit ' + skip + ',' + take;
    var args = [areaType];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('get area for userDao failed! ' + err.stack);
            cb(err.message, null);
            return;
        }

        if (!!res && res.length > 0) {
            var areas = [];
            for (var i = 0; i < res.length; i++) {
                var r = res[i];
                areas.push({
                    id: r.id,
                    no: r.area_no,
                    name: r.area_name,
                    status: r.status,
                    start: r.start_time
                });
            }
            cb(null, areas);
        } else {
            cb(' area not exist ', null);
        }
    });
};


userDao.getAreaDbConfig = function (areaId, cb) {
    var sql = 'select area_no,area_name,db_con_data,db_con_log from area_list where id = ?';
    var args = [areaId];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('get area DbConfig for userDao failed! ' + err.stack);
            cb(err.message, null);
            return;
        }

        if (!!res && res.length > 0) {
            var con = {
                dataConfig: res[0].db_con_data,
                logConfig: res[0].db_con_log,
                areaName: res[0].area_name
            }
            cb(null, con);
        } else {
            cb(' area not exist ', null);
        }
    });
};
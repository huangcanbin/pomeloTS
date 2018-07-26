var mysql = require('./mysql/mysql-cli');
var crypto = require('crypto');

//定义静态调用的方法集合
var userDao = module.exports;


userDao.encodePassword = function (pwd) {
  return crypto.createHash('md5').update(pwd, 'utf8').digest('hex');
}
/**
 * Get userInfo by username
 * @param {String} username
 * @param {function} cb
 */
userDao.getUserByName = function (username, cb) {
  var sql = 'select id,name,password from account where name = ?';
  var args = [username];
  mysql.query(sql, args, function (err, res) {
    if (err !== null) {
      cb(err.message, null);
    } else {
      if (!!res && res.length === 1) {
        var rs = res[0];
        var user = {
          id: rs.id,
          name: rs.name,
          password: rs.password
        };
        cb(null, user);
      } else {
        cb(' user not exist ', null);
      }
    }
  });
};

/**
 * 
 * @param {String} username
 * @param {function} cb
 */
userDao.loginSucess = function (uid, cb) {
  var sql = 'update account set last_login = ? where id = ?';
  var args = [Date.now(), uid];
  mysql.update(sql, args, function (err, res) {
    if (err !== null) {
      cb(err.message);
    } else {
      cb(null);
    }
  });
};

/**
 * Create a new user
 * @param {String} username
 * @param {String} password
 * @param {function} cb Call back function.
 */
userDao.createUser = function (username, password, cb) {
  var sql = 'insert into account (name,password,channel,channel_uid,first_login,last_login,last_logout) values(?,?,?,?,?,?,?)';
  var loginTime = Date.now();
  var args = [username, password, 0, 0, loginTime, loginTime, 0];
  mysql.insert(sql, args, function (err, res) {
    if (err !== null) {
      cb({ code: err.number, msg: err.message }, null);
    } else {
      var userId = res.insertId;
      var user = {
        id: userId,
        name: username
      };
      cb(null, user);
    }
  });
};

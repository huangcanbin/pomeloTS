var pools = require('generic-pool');
var mysqlConfig = require('../../../../shared/config/mysql');
var mysql = require('mysql');

var env = process.env.NODE_ENV || 'development';
if (mysqlConfig[env]) {
    mysqlConfig = mysqlConfig[env];
}

exports.createPool = function () {
    var opts = {
        name: 'mysql',
        max: 10, // maximum size of the pool
        min: 2, // minimum size of the pool
        idleTimeoutMillis : 30000,
        log: true
    };
    const factory = {
        create: function () {
            var client = mysql.createPool({
                host: mysqlConfig.host,
                user: mysqlConfig.user,
                port: mysqlConfig.port,
                password: mysqlConfig.password,
                database: mysqlConfig.database
            });
            //这里若使用Promise对象，执行查询不会被触发
            return client;
        },
        destroy: function (client) {
            client.end();
        }
    };
    return pools.createPool(factory, opts);
};
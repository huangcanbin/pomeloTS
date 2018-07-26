var pools = require('generic-pool');
var mysql = require('mysql');

/**
 * create mysql client pool.
 * 
 * @param {Ojbject} con mysql config
 */
exports.createPool = function (con) {
    var opts = {
        name: 'mysql',
        max: 10, // maximum size of the pool
        min: 2, // minimum size of the pool,
        idleTimeoutMillis: 30000,
        log: true
    };
    const factory = {
        create: function () {
            var client = mysql.createPool({//mysql.createConnection({
                host: con.host,
                user: con.user,
                port: con.port,
                password: con.password,
                database: con.database,
                //自定义字段类型转换
                typeCast: function (field, useDefaultTypeCasting) {
                    if ((field.type === "BIT") && (field.length === 1)) {
                        var bytes = field.buffer();
                        return (bytes[0] === 1);
                    }
                    return (useDefaultTypeCasting());
                }
            });
            //这里若使用Promise对象，执行查询不会被触发
            //return client;
            return new Promise(function (resolve, reject) {
                resolve(client)
            })
        },
        destroy: function (client) {
            client.end();
        }
    };
    return pools.createPool(factory, opts);
};
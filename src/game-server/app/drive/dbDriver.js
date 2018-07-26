var MysqlClient = require('./mysql/mysql');
var MongodbClient = require('./mongodb/mongodb');

var exp = module.exports;

var clientPool = {};

/**
 * init db connect string.
 * 
 * @param {Functoin} cb  load config callback
 */
exp.init = function (cb) {
    var client;
    if (cb) {
        cb(function (type, con, next) {
            switch (type) {
                case 'mysql':
                    client = new MysqlClient(con);
                    break;
                case 'mongodb':
                    client = new MongodbClient(con);
                    break;
                default:
                    break;
            }
            if (next) {
                next(null, client);
            }
        });
    }
};

/**
 * set client to pool.
 * 
 * @param {Number} areaId areaId
 * @param {String} name pool name
 * @param {Object} client db client
 */
exp.set = function (areaId, name, client) {
    var key = name + '|' + areaId;
    clientPool[key] = client;
};

/**
 *
 * @param {Number} areaId areaId
 * @param {String} name pool name
 */
exp.get = function (areaId, name) {
    var key = name + '|' + areaId;
    return clientPool[key];
};

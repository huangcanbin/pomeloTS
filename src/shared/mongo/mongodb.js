/*no use*/
var MongoClient = require('mongodb').MongoClient;
var Db = require('mongodb').Db,
    ReplSetServers = require('mongodb').ReplSet,
    Server = require('mongodb').Server;

var exp = module.exports;

var mongoConfig = null;
var replSet = null;
exp.init = function (json) {
    if (!!mongoConfig) {
        return;
    }

    if (!replSet && json && json.servers) {
        mongoConfig = { database: json.database };
        var ServerArray = [];
        (json.servers || []).forEach(function (v, i) {
            var ser = new Server(v.host, v.port, {});
            ServerArray.push(ser);
        });
        replSet = new ReplSetServers(ServerArray);
    } else if (json) {
        mongoConfig = { url: json.url, options: json.options };
    } else {
        mongoConfig = { url: '' };
    }
};
/**
 * use pool connect to mongodb
 * 
 * @param table collection name
 * @param cb
 */
exp.connect = function (table, cb) {
    if (!!replSet) {
        var db = new Db(mongoConfig.database, replSet, { native_parser: true });
        db.open(function (err, db) {
            // Get an additional db
            if (!!err) {
                cb(err, null, function () { });
                return;
            }
            var col = db.collection(table);
            cb(err, col, function () {
                db.close();
            });
        });
        return;
    }

    MongoClient.connect(mongoConfig.url, (mongoConfig.options || {}), function (err, db) {
        if (!!err) {
            cb(err, null, function () { });
            return;
        }
        var col = db.collection(table);
        cb(err, col, function () {
            db.close();
        })
    });
};

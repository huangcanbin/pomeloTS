var mysqlPool = require('./mysqlPool');
var logger = require('pomelo-logger').getLogger(__filename);

/**
 * init mysql client.
 * 
 * @param {Object} con config of mysql
 */
var mysqlClient = function (con) {

    if (typeof (con) === "string") {
        con = JSON.parse(con);
    }
    this._pool = mysqlPool.createPool(con);
};

module.exports = mysqlClient;


/*
* close client for database.
*/
mysqlClient.prototype.shutdown = function () {
    this._pool.shutdown();
};


mysqlClient.prototype.query = function (sql, args, cb) {
    var self = this;
    this._pool.acquire().then(function (client) {
        client.query(sql, args, function (err, res) {
            // return object back to pool
            self._pool.release(client);
            logger.debug('exe sql:' + sql);
            cb(err, res);
        });
    })
        .catch(function (err) {
            // handle error - this is generally a timeout or maxWaitingClients 
            // error        
            if (!!err) {
                logger.error('[sqlqueryErr: %s] %s', sql, err.stack);
                return;
            }
        });
};

mysqlClient.prototype.insert = function (sql, args, cb) {
    this.query(sql, args, cb);
}

mysqlClient.prototype.update = function (sql, args, cb) {
    this.query(sql, args, cb);
}

mysqlClient.prototype.delete = function (sql, args, cb) {
    this.query(sql, args, cb);
}

mysqlClient.prototype.shutdown = function () {
    this._pool.destoryAllNow();
};

mysqlClient.prototype.clear = function () {
    var self = this;
    self._pool.drain().then(function () {
        self._pool.clear();
    });
}


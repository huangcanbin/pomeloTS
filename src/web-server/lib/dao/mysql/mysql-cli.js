
var _pool;
var handle = {};

handle.init = function () {
    _pool = require('./dao-pool').createPool();
};

handle.query = function (sql, args, cb) {
    _pool.acquire().then(function (client) {
        client.query(sql, args, function (err, res) {
            // return object back to pool
            _pool.release(client);
            //TODO: print sql
            //console.log('exe sql:' + sql);
            cb(err, res);
        });
    })
        .catch(function (err) {
            // handle error - this is generally a timeout or maxWaitingClients 
            // error        
            if (!!err) {
                console.error('[sqlqueryErr] ' + err.stack);
                return;
            }
        });
};

handle.shutdown = function () {
    _pool.destoryAllNow();
};

handle.clear = function () {
    _pool.drain().then(function () {
        _pool.clear();
    });
}

var sqlclient = module.exports;
/*
* init client for database, mutil call only once instense.
*/
sqlclient.init = function () {
    if (!!_pool) {
        return sqlclient;
    }
    handle.init();
    //extend new methond
    sqlclient.insert = handle.query;
    sqlclient.update = handle.query;
    sqlclient.delete = handle.query;
    sqlclient.query = handle.query;
    return sqlclient;
};
/*
* close client for database.
*/
sqlclient.shutdown = function () {
    _pool.shutdown();
};

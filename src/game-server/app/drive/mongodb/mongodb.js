var MongoClient = require('mongodb').MongoClient;

/**
 * init mongodb client.
 * 
 * @param {Object} con config of mongodb
 */
var mongodbClient = function (con) {
    this._config = {};

    if (typeof (con) === "string") {
        con = JSON.parse(con);
    }

    if (con && con.url) {
        this._config = { url: con.url, options: (con.options || {}) };
    }
};

module.exports = mongodbClient;

/**
 * use pool connect to mongodb
 * 
 * @param table collection name
 * @param cb
 */
mongodbClient.prototype.connect = function (table, cb) {
    var self = this;

    MongoClient.connect(self._config.url, self._config.options || {}, function (err, db) {
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



  // var mongoClient = require('../shared/mongo/mongodb');
  // app.set('mongo', mongoClient);
  // mongoClient.connect('Player', function (err, col, next) {
  //   if (!!err) {
  //     console.log('monodb connect err:' + err.message);
  //     next();
  //     return;
  //   }
  //   var where = { "name": 'test4' };
  //   col.find(where).toArray(function (err, items) {
  //     if (!!err) {

  //     }
  //     console.log('monodb find success. result:' + items.length);
  //     if (items.length === 0) {
  //       col.insertMany([{ name: 'test4', lv: 2 }], function (err, r) {
  //         if (r) {

  //         }
  //         console.log('monodb insert success. result:' + r.insertedCount);
  //         next();
  //       });
  //     } else {

  //       console.log('monodb find result:' + items[0].name);
  //       next();
  //     }
  //   });

  // });
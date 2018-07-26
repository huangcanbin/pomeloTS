var pomelo = require('pomelo');
var fs = require('fs');
var consts = require('./app/util/consts');
var routeUtil = require('./app/util/routeUtil');
var scene = require('./app/domain/area/scene');
var dbDriver = require('./app/drive/dbDriver');
var userDao = require('./app/dao/userDao');
var ConfigCache = require('./app/cache/configCache');
var sync = require('pomelo-sync-plugin');
const exceptionFilter = require('./app/util/exceptionFilter');
// var masterhaPlugin = require('pomelo-masterha-plugin');
var onlineServer = require('./app/services/onlineService');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'bgyx');


app.configure('production|development', function () {
  app.before(pomelo.filters.toobusy());
  app.enable('systemMonitor');
  // route configures
  app.route('area', routeUtil.area);
  app.route('connector', routeUtil.connector);

  // proxy configures
  app.set('proxyConfig', {
    cacheMsg: true,
    interval: 30,
    lazyConnection: true
    // enableRpcLog: true
  });
  // handler 热更新开关 
  app.set('serverConfig', {
    reloadHandlers: true
  });
  // remote 热更新开关 
  app.set('remoteConfig', {
    cacheMsg: true,
    interval: 30,
    reloadRemotes: true
  });

  //每一个游戏区独立一个进程
  if (app.serverType !== 'master') {
    var areas = app.get('servers').area;
    var areaIdMap = {};
    for (var id in areas) {
      var item = areas[id];
      areaIdMap[item.area] = item.id;
    }
    app.set('areaIdMap', areaIdMap);
  }

  app.loadConfig('mysql', app.getBase() + '/../shared/config/mysql.json');
  app.filter(pomelo.filters.timeout(8000, consts.RES_MSG.ERR_HANDLE_TIMEOUT));
  app.filter(exceptionFilter());

  app.loadConfig('zookeeper', app.getBase() + '/config/zookeeper.json');
  // TODO:master high availability
  // var zk = app.get('zookeeper');
  // app.use(masterhaPlugin, {
  //   zookeeper: {
  //     server: zk.host,
  //     path: zk.path
  //   }
  // });


});


// Configure database
app.configure('production|development', function () {
  var serverId = app.serverId;
  //全局的db配置
  // var dbclient = require('../shared/mysql/mysql-cli').init();
  // app.set('dbclient', dbclient);

  dbDriver.init(function (next) {
    var con = app.get('mysql');
    next(consts.DB.Shared.type, con, function (err, client) {
      app.set(consts.DB.Shared.name, client);
    });
  });
});

app.configure('production|development', 'area|combat|connector|master', function () {
  app.use(sync, {
    sync: {
      path: __dirname + '/app/dao/mapping', dbclient: dbDriver
    }
  });
});

// Configure database
app.configure('production|development', 'area|activity', function () {
  var serverId = app.serverId;
  var server = app.curServer;
  var areaId = server.area || 1;
  //var servers = app.getServersByType(app.serverType);
  //独立服的db配置
  dbDriver.init(function (next) {
    userDao.getAreaDbConfig(areaId, function (err, con) {
      next(consts.DB.Data.type, con.dataConfig, function (err, client) {
        dbDriver.set(areaId, consts.DB.Data.name, client);
        console.log('init mongodb config for areaId:' + areaId);
      });

      next(consts.DB.Log.type, con.logConfig, function (err, client) {
        dbDriver.set(areaId, consts.DB.Log.name, client);
        console.log('init mysql log config for areaId:' + areaId);
      });

      if (app.serverType == "area") {
        onlineServer.start(server.area, con.areaName);
      }
    })

    
    
  });

  ConfigCache.set(function(){
    ConfigCache.refreshTimer(); //进行配置缓存监听
  });
  scene.init({ id: areaId, app: app });

  //TODO: whenther saved dbDriver
  //app.set(consts.DB.driver, dbDriver);
});

// Load configure of database
app.configure('production|development', 'chat|combat', function () {
  var serverId = app.serverId;
  var servers = app.getServersByType(app.serverType);
  //独立的db配置

  ConfigCache.set(function(){
    ConfigCache.refreshTimer(); //进行配置缓存监听
  });
  
  ConfigCache.load(); //旧的
});

app.configure('production|development', 'gate', function () {
  app.set('connectorConfig',
    {
      connector: pomelo.connectors.hybridconnector,
      useProtobuf: true
    });
});

// app configuration
app.configure('production|development', 'connector', function () {
  var dictionary = app.components['__dictionary__'];
  var dict = null;
  if (!!dictionary) {
    dict = dictionary.getDict();
  }

  app.set('connectorConfig',
    {
      connector: pomelo.connectors.hybridconnector,
      heartbeat: 30,
      useDict: true,
      useProtobuf: true,
      handshake: function (msg, cb) {
        cb(null, {});
      },
      //客户端连接服务器采用ssl安全连接
     /*  ssl: {
        type: 'tls',
        key: fs.readFileSync('../shared/server.key'),
        cert: fs.readFileSync('../shared/server.crt'),
        ca: [fs.readFileSync('../shared/server.crt')],
        handshakeTimeout: 5000
      } */
    });
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + (err.stack || err));
});

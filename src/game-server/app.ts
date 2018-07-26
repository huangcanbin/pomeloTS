import pomelo = require('pomelo');
// import fs = require('fs');
import consts from './app/util/consts';
import routeUtil from './app/util/routeUtil';
// import scene = require('./app/domain/area/scene');
// import dbDriver = require('./app/drive/dbDriver');
// import userDao = require('./app/dao/userDao');
// import ConfigCache = require('./app/cache/configCache');
// import sync = require('pomelo-sync-plugin');
import exceptionFilter = require('./app/util/exceptionFilter');
// // let masterhaPlugin = require('pomelo-masterha-plugin');
// import onlineServer = require('./app/services/onlineService');
/**
 * Init app for client.
 */
let app = pomelo.createApp();
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
        let areas = app.get('servers').area;
        let areaIdMap = {};
        for (let _id in areas) {
            // let item = areas[id];
            // areaIdMap[item.area] = item.id;
        }
        app.set('areaIdMap', areaIdMap);
    }

    app.loadConfig('mysql', app.getBase() + '/../shared/config/mysql.json');
    app.filter(pomelo.filters.timeout(8000, consts.RES_MSG.ERR_HANDLE_TIMEOUT));
    app.filter(exceptionFilter());

    app.loadConfig('zookeeper', app.getBase() + '/config/zookeeper.json');
    // TODO:master high availability
    // let zk = app.get('zookeeper');
    // app.use(masterhaPlugin, {
    //   zookeeper: {
    //     server: zk.host,
    //     path: zk.path
    //   }
    // });


});


// Configure database
app.configure('production|development', function () {
    // let serverId = app.serverId;
    //全局的db配置
    // let dbclient = require('../shared/mysql/mysql-cli').init();
    // app.set('dbclient', dbclient);

    // dbDriver.init(function (next: any) {
    //     let con = app.get('mysql');
    //     next(consts.DB.Shared.type, con, function (err: any, client: any) {
    //         app.set(consts.DB.Shared.name, client);
    //     });
    // });
});

app.configure('production|development', 'area|combat|connector|master', function () {
    // app.use(sync, {
    //     sync: {
    //         path: __dirname + '/app/dao/mapping', dbclient: dbDriver
    //     }
    // });
});

// Configure database
app.configure('production|development', 'area|activity', function () {
    // let serverId = app.serverId;
    // let server = app.curServer;
    // let areaId = server.area || 1;
    //let servers = app.getServersByType(app.serverType);
    //独立服的db配置
    // dbDriver.init(function (next: any) {
    //     userDao.getAreaDbConfig(areaId, function (err: any, con: any) {
    //         next(consts.DB.Data.type, con.dataConfig, function (err: any, client: any) {
    //             dbDriver.set(areaId, consts.DB.Data.name, client);
    //             console.log('init mongodb config for areaId:' + areaId);
    //         });

    //         next(consts.DB.Log.type, con.logConfig, function (err: any, client: any) {
    //             dbDriver.set(areaId, consts.DB.Log.name, client);
    //             console.log('init mysql log config for areaId:' + areaId);
    //         });

    //         if (app.serverType == "area") {
    //             onlineServer.start(server.area, con.areaName);
    //         }
    //     })



    // });

    // ConfigCache.set(function () {
    //     ConfigCache.refreshTimer(); //进行配置缓存监听
    // });
    // scene.init({ id: areaId, app: app });

    //TODO: whenther saved dbDriver
    //app.set(consts.DB.driver, dbDriver);
});

// Load configure of database
app.configure('production|development', 'chat|combat', function () {
    // let serverId = app.serverId;
    // let servers = app.getServersByType(app.serverType);
    //独立的db配置

    // ConfigCache.set(function () {
    //     ConfigCache.refreshTimer(); //进行配置缓存监听
    // });

    // ConfigCache.load(); //旧的
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
    // let dictionary = app.components['__dictionary__'];
    // let _dict = null;
    // if (!!dictionary) {
    //     _dict = dictionary.getDict();
    // }

    app.set('connectorConfig',
        {
            connector: pomelo.connectors.hybridconnector,
            heartbeat: 30,
            useDict: true,
            useProtobuf: true,
            handshake: function (_msg: any, cb: any) {
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

process.on('uncaughtException', function (err: any) {
    console.error(' Caught exception: ' + (err.stack || err));
});

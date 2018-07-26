/////////////////////////////////////////////////////////////
var WebSocket = require('ws');
var Protocol = require('pomelo-protocol');
var Package = Protocol.Package;
var Message = Protocol.Message;
var EventEmitter = require('events').EventEmitter;
var protocol = require('pomelo-protocol');
var protobuf = require('pomelo-protobuf');
var cwd = process.cwd();
var utils = require(cwd + '/app/script/utils');
var moveStat = require(cwd + '/app/script/statistic').moveStat;
var attackStat = require(cwd + '/app/script/statistic').attackStat;
var areaStat = require(cwd + '/app/script/statistic').areaStat;
var util = require('util');

if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F() { }
    F.prototype = o;
    return new F();
  };
}

var JS_WS_CLIENT_TYPE = 'js-websocket';
var JS_WS_CLIENT_VERSION = '0.0.1';

var RES_OK = 200;
var RES_FAIL = 500;
var RES_OLD_CLIENT = 501;

if (typeof Object.create !== 'function') {
  Object.create = function (o) {
    function F() { }
    F.prototype = o;
    return new F();
  };
}

var root = {};
var pomelo = Object.create(EventEmitter.prototype); // object extend from object
root.pomelo = pomelo;
var socket = null;
var reqId = 0;
var callbacks = {};
var handlers = {};
//Map from request id to route
var routeMap = {};

var heartbeatInterval = 0;
var heartbeatTimeout = 0;
var nextHeartbeatTimeout = 0;
var gapThreshold = 100;   // heartbeat gap threashold
var heartbeatId = null;
var heartbeatTimeoutId = null;

var handshakeCallback = null;

var handshakeBuffer = {
  'sys': {
    type: JS_WS_CLIENT_TYPE,
    version: JS_WS_CLIENT_VERSION
  },
  'user': {
  }
};

var initCallback = null;

pomelo.init = function (params, cb) {
  initCallback = cb;
  var host = params.host;
  var port = params.port;

  var url = 'ws://' + host;
  if (port) {
    url += ':' + port;
  }

  handshakeBuffer.user = params.user;
  handshakeCallback = params.handshakeCallback;
  initWebSocket(url, cb);
};

var initWebSocket = function (url, cb) {
  // console.log('connect to ' + url);
  var onopen = function (event) {
    var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
    send(obj);
  };
  var onmessage = function (event) {
    processPackage(Package.decode(event.data), cb);
    // new package arrived, update the heartbeat timeout
    if (heartbeatTimeout) {
      nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
    }
  };
  var onerror = function (event) {
    pomelo.emit('io-error', event);
    console.error('socket error: ', event);
  };
  var onclose = function (event) {
    // console.error('socket close: ', event.type);
    pomelo.emit('close', event);
  };
  socket = new WebSocket(url);
  socket.binaryType = 'arraybuffer';
  socket.onopen = onopen;
  socket.onmessage = onmessage;
  socket.onerror = onerror;
  socket.onclose = onclose;
};

pomelo.disconnect = function () {
  if (socket) {
    if (socket.disconnect) socket.disconnect();
    if (socket.close) socket.close();
    // console.log('disconnect');
    socket = null;
  }

  if (heartbeatId) {
    clearTimeout(heartbeatId);
    heartbeatId = null;
  }
  if (heartbeatTimeoutId) {
    clearTimeout(heartbeatTimeoutId);
    heartbeatTimeoutId = null;
  }
};

pomelo.request = function (route, msg, cb) {
  if (arguments.length === 2 && typeof msg === 'function') {
    cb = msg;
    msg = {};
  } else {
    msg = msg || {};
  }
  route = route || msg.route;
  if (!route) {
    return;
  }

  reqId++;
  sendMessage(reqId, route, msg);

  callbacks[reqId] = cb;
  routeMap[reqId] = route;
};

pomelo.notify = function (route, msg) {
  msg = msg || {};
  sendMessage(0, route, msg);
};

var sendMessage = function (reqId, route, msg) {
  var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

  //compress message by protobuf
  var protos = !!pomelo.data.protos ? pomelo.data.protos.client : {};
  if (!!protos[route]) {
    msg = protobuf.encode(route, msg);
  } else {
    msg = Protocol.strencode(JSON.stringify(msg));
  }


  var compressRoute = 0;
  if (pomelo.dict && pomelo.dict[route]) {
    route = pomelo.dict[route];
    compressRoute = 1;
  }

  msg = Message.encode(reqId, type, compressRoute, route, msg);
  var packet = Package.encode(Package.TYPE_DATA, msg);
  send(packet);
};

var send = function (packet) {
  //socket.send(packet.buffer);
  socket.send(packet, { binary: true, mask: true });
};


var handler = {};

var heartbeat = function (data) {
  if (!heartbeatInterval) {
    // no heartbeat
    return;
  }

  var obj = Package.encode(Package.TYPE_HEARTBEAT);
  if (heartbeatTimeoutId) {
    clearTimeout(heartbeatTimeoutId);
    heartbeatTimeoutId = null;
  }

  if (heartbeatId) {
    // already in a heartbeat interval
    return;
  }

  heartbeatId = setTimeout(function () {
    heartbeatId = null;
    send(obj);

    nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
    heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
  }, heartbeatInterval);
};

var heartbeatTimeoutCb = function () {
  var gap = nextHeartbeatTimeout - Date.now();
  if (gap > gapThreshold) {
    heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
  } else {
    console.error('server heartbeat timeout');
    pomelo.emit('heartbeat timeout');
    pomelo.disconnect();
  }
};

var handshake = function (data) {
  data = JSON.parse(Protocol.strdecode(data));
  if (data.code === RES_OLD_CLIENT) {
    pomelo.emit('error', 'client version not fullfill');
    return;
  }

  if (data.code !== RES_OK) {
    pomelo.emit('error', 'handshake fail');
    return;
  }

  handshakeInit(data);

  var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
  send(obj);
  if (initCallback) {
    initCallback(socket);
    initCallback = null;
  }
};

var onData = function (data) {
  //probuff decode
  var msg = Message.decode(data);

  if (msg.id > 0) {
    msg.route = routeMap[msg.id];
    delete routeMap[msg.id];
    if (!msg.route) {
      return;
    }
  }

  msg.body = deCompose(msg);

  processMessage(pomelo, msg);
};

var onKick = function (data) {
  pomelo.emit('onKick');
};

handlers[Package.TYPE_HANDSHAKE] = handshake;
handlers[Package.TYPE_HEARTBEAT] = heartbeat;
handlers[Package.TYPE_DATA] = onData;
handlers[Package.TYPE_KICK] = onKick;

var processPackage = function (msg) {
  handlers[msg.type](msg.body);
};

var processMessage = function (pomelo, msg) {
  if (!msg.id) {
    // server push message
    pomelo.emit(msg.route, msg.body);
    return;
  }

  //if have a id then find the cb function with the request
  var cb = callbacks[msg.id];

  delete callbacks[msg.id];
  if (typeof cb !== 'function') {
    return;
  }

  cb(msg.body);
  return;
};

var processMessageBatch = function (pomelo, msgs) {
  for (var i = 0, l = msgs.length; i < l; i++) {
    processMessage(pomelo, msgs[i]);
  }
};

var deCompose = function (msg) {
  var protos = !!pomelo.data.protos ? pomelo.data.protos.server : {};
  var abbrs = pomelo.data.abbrs;
  var route = msg.route;

  //Decompose route from dict
  if (msg.compressRoute) {
    if (!abbrs[route]) {
      return {};
    }

    route = msg.route = abbrs[route];
  }
  if (!!protos[route]) {
    return protobuf.decode(route, msg.body);
  } else {
    return JSON.parse(Protocol.strdecode(msg.body));
  }

  // return msg;
};

var handshakeInit = function (data) {
  if (data.sys && data.sys.heartbeat) {
    heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
    heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
  } else {
    heartbeatInterval = 0;
    heartbeatTimeout = 0;
  }

  initData(data);

  if (typeof handshakeCallback === 'function') {
    handshakeCallback(data.user);
  }
};

//Initilize data used in pomelo client
var initData = function (data) {
  if (!data || !data.sys) {
    return;
  }
  pomelo.data = pomelo.data || {};
  var dict = data.sys.dict;
  var protos = data.sys.protos;

  //Init compress dict
  if (dict) {
    pomelo.data.dict = dict;
    pomelo.data.abbrs = {};

    for (var route in dict) {
      pomelo.data.abbrs[dict[route]] = route;
    }
  }

  //Init protobuf protos
  if (protos) {
    pomelo.data.protos = {
      server: protos.server || {},
      client: protos.client || {}
    };
    if (!!protobuf) {
      protobuf.init({ encoderProtos: protos.client, decoderProtos: protos.server });
    }
  }
};


/////////////////////////////////////////////////////////////
//TODO: Request logic
var requestify = require('requestify');
var queryHero = require(cwd + '/app/data/mysql').queryHero;
var envConfig = require(cwd + '/app/config/env.json');
var config = require(cwd + '/app/config/mysql.json');
var serConfig = require(cwd + '/app/config/server.json');
config = config[envConfig.env];
serConfig = serConfig[envConfig.env];
var mysql = require('mysql');

pomelo.player = null;
pomelo.uid = null;

var client = mysql.createConnection({
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  password: config.password
});

var START = 'start';
var END = 'end';

var ActFlagType = {
  ENTRY: 0,
  ENTER_SCENE: 1,
  Checkpoint_ATTACK: 2,
  Checkpoint_Extract: 3,
  ENTER_GOBLIN: 4
};

var monitor = function (type, name, reqId) {
  if (typeof actor !== 'undefined') {
    actor.emit(type, name, reqId);
  } else {
    console.error(Array.prototype.slice.call(arguments, 0));
  }
}
var channelId = 1;
var connected = false;

var offset = (typeof actor !== 'undefined') ? actor.id : 1;

if (typeof actor !== 'undefined') {
  console.log('offset:%d, actorId:%d', offset, actor.id);
}

// temporary code
queryHero(client, 1, offset, function (error, users) {
  client.end();
  //queryHero(client, 1, 0, function (error, users) {
  // temporary code
  // console.log('QueryHero ~ offset = ', offset);
  if (users.length === 0) {
    console.log('QueryHero not user');
    return;
  }
  var user = users[0];
  if (!!error) {
    console.log('QueryHero is error:%s', error.stack);
    return;
  }
  //console.log('QueryHero is running ...');
  //console.log('QueryHero ~ user = %j', user);

  var url = 'http://' + serConfig.auth[0].host + ':' + serConfig.auth[0].port + '/api/login';
  var param = {
    username: user.username,
    password: user.passwd
  };
  //console.log('POST:%s->body:%j', url, param);
  requestify.post(url, param).then(function (response) {
    // Get the response body
    var result = response.getBody();
    //console.log('Login auth result:%j', result);
    if (result && result.code === RES_OK) {

      // monitor(START, 'enterScene', ActFlagType.ENTER_SCENE);
      queryEntry(result.token, function (host, port) {
        entry(user, host, port, result.token, function (code) {
          connected = true;
        });
      });
    }
  }).fail(function (response) {
    var code = response.getCode();
    console.log('Login auth error:%d', code);
  });

});

function queryEntry(token, cb) {
  pomelo.init({
    host: serConfig.gate[0].host,
    port: serConfig.gate[0].port,
    log: true
  }, function () {
    pomelo.request('gate.gateHandler.queryEntry', { token: token, channel: channelId }, function (data) {
      //console.log('gate result:%j, reset connector.', data);
      pomelo.disconnect();
      if (data.code !== RES_OK) {
        console.log('Servers error!');
        return;
      }
      if (cb) cb(data.host, data.port);
    });
  });
}

function entry(user, host, port, token, cb) {

  if (!!socket) {
    return;
  }
  // 初始化socketClient
  // console.log('connector:%s:%d', host, port);
  pomelo.init({ host: host, port: port, log: true }, function () {
    // monitor(START, 'entry', ActFlagType.ENTRY);
    pomelo.request('connector.entryHandler.entry', { token: token, channel: channelId }, function (data) {
      // monitor(END, 'entry', ActFlagType.ENTRY);
      //console.log('connector result:%j', data);

      if (cb) {
        cb(data.code);
      }

      if (data.code != 200) {
        console.log('Login Fail!');
        return;
      }

      afterLogin(pomelo, user, data);
    });
  });
}

var afterLogin = function (pomelo, user, data) {
  pomelo.player = {};
  var fightedMap = {};
  var areaId = 2; //进入2区测试
  var roleId = 90001;//主角ID

  pomelo.on('onKick', function () {
    console.log('You have been kicked offline for the same account login in other place.');
  });

  pomelo.on('disconnect', function (reason) {
    console.log('disconnect invoke!' + reason);
  });

  pomelo.on('onUserLeave', function (data) {
    var playerId = data.playerId;
    console.log('playerId:%d onLeave', playerId);
  });

  /**
   * 处理登录请求
   */

  var queryArea = function (cb) {
    pomelo.request('connector.areaHandler.query', {
      channel: channelId,
      page: 1,
      size: 20
    }, function (data) {
      if (data.code === RES_OK) {
        if (cb) cb(data);
      } else {
        console.log('queryArea result:%j', data);
      }
    });
  };
  var checkRole = function (areas) {
    for (var i = 0; i < areas.length; i++) {
      if (areas[i].id === areaId) {
        return true;
      }
    }
    return false;
  };
  var login = function (data) {
    pomelo.player.uid = data.uid;
    pomelo.player.id = 0;
    pomelo.player.username = user.username;

    var areas = data.areas;
    if (!areas || areas.length === 0 || !checkRole(areas)) {
      queryArea(function (res) {
        if (res && res.areas.length > 0) {
          pomelo.player.areaId = areaId;
          setTimeout(function () {
            createRole(function () {
              enterScene();
            });
          }, 0);
        }
      });

    } else {
      //已经有角色，直接进入游戏服
      pomelo.player.areaId = areaId;
      pomelo.player.id = data.uid;
      setTimeout(function () {
        enterScene();
      }, 0);
    }
  };

  login(data);

  var createRole = function (next) {
    pomelo.request('area.playerHandler.create', {
      areaId: pomelo.player.areaId,
      roleId: roleId,
      name: pomelo.player.username
    }, function (data) {
      if (data.code === RES_OK) {
        pomelo.player.id = data.playerId;
        next();
      } else {
        console.log('createRole[%d] result:%j', pomelo.player.uid, data);
      }
    });
  };

  var enterScene = function () {
    var msg = {
      playerId: pomelo.player.id,
      areaId: pomelo.player.areaId
    };
    monitor(START, 'enterScene', ActFlagType.ENTER_SCENE);
    pomelo.request("area.playerHandler.entry", msg, function (data) {
      monitor(END, 'enterScene', ActFlagType.ENTER_SCENE);
      // console.log('enterScene result:%j', data);

      if (data.code === RES_OK) {
        initPlayer(data);
      } else {
        console.log('enterScene result:%j', data);
      }
    });
  };

  var isEnterScene = false;

  var initPlayer = function (data) {
    isEnterScene = true;
    pomelo.player.lv = data.player.lv;
    pomelo.player.exp = data.player.exp;
    pomelo.player.gold = data.player.gold;
    pomelo.player.money = data.player.money;
    pomelo.player.roleId = data.player.roleId;
    pomelo.player.checkpointId = data.player.checkpointId;
    pomelo.player.exprise = data.player.exprise;
    pomelo.player.goldrise = data.player.goldrise;
    pomelo.player.power = data.player.power;
    pomelo.player.energy = data.player.energy;
    pomelo.player.maxenergy = data.player.maxenergy;
    pomelo.player.heros = data.heros || [];
    pomelo.player.bags = data.bags || [];
  };


  //随机操作
  var intervalTime = Math.floor(Math.random() * 10000 + 10000);
  // console.log('combatTimer:%d', intervalTime);
  setInterval(function () {
    if (isEnterScene) {
      //doCheckpointCombat();
      enterGoblin();
    }
  }, intervalTime);

  var doCheckpointCombat = function () {
    if (!pomelo.player.checkpointId) {
      return;
    }
    var msg = {};
    monitor(START, 'combatCheckpoint', ActFlagType.Checkpoint_ATTACK);
    pomelo.request("area.checkpointHandler.combat", msg, function (data) {
      monitor(END, 'combatCheckpoint', ActFlagType.Checkpoint_ATTACK);
      if (data.code === RES_OK) {
        //console.log('combatCheckpoint:%d result:%s', data.checkpointId, data.combat.res);

      } else {
        console.log('combatCheckpoint[%d] result:%j', pomelo.player.id, data);
      }
    });
  };

  var enterGoblin = function () {
    var post = {};
    monitor(START, 'enterGoblin', ActFlagType.ENTER_GOBLIN);
    pomelo.request('area.goblinHandler.entry', post, function (data) {
      monitor(END, 'enterGoblin', ActFlagType.ENTER_GOBLIN);
      if (data.code === RES_OK) {
        //console.log('combatCheckpoint:%d result:%s', data.checkpointId, data.combat.res);

      } else {
        console.log('enterGoblin[%d] result:%j', (pomelo.player.id || 0), data);
      }
    });
  };

};


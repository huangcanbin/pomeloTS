// update express 4.x version.
var express = require('express');
var errorhandler = require('errorhandler');
var notifier = require('node-notifier');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var mysql = require('./lib/dao/mysql/mysql-cli');
var log4js = require('log4js');

var app = express();

//log4js.configure(__dirname + '/config/log4js.json', { cwd: __dirname });
//var logger = log4js.getLogger('api-logger');
var logger = log4js.getLogger();
logger.level = 'debug';

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(methodOverride('_method'));
// app.use(app.router);
app.set('view engine', 'jade');
app.set('views', __dirname + '/public');
app.set('view options', { layout: false });
app.set('basepath', __dirname + '/public');

if (app.get('env') === 'development') {
  app.use(express.static(__dirname + '/public'));
  //log use console print.
  // app.use(errorhandler({ log: true }));
  app.use(errorhandler({ log: errorNotification }));
}

if (app.get('env') === 'production') {
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(errorHandler());
}

function errorNotification(err, str, req) {
  var title = 'Error in ' + req.method + ' ' + req.url;

  notifier.notify({
    title: title,
    message: str
  });
}

//allow custom header and CORS
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method == 'OPTIONS') {
    res.send(200);
  }
  else {
    next();
  }
});

//add api interface
require('./api/reg')(app);
require('./api/login')(app);
require('./api/startthe')(app);

mysql.init();

var port = 7650;
app.listen(port);

process.on('uncaughtException', function (err) {
  logger.error(' Caught exception: ' + err.stack);
});

logger.info("Web server has started.\nPlease log on http://127.0.0.1:" + port + "/index.html");
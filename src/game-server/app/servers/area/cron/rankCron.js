var consts = require('../../../util/consts');
var async = require('async');
var worldBossDao = require('../../../dao/worldBossDao');
var mailDao = require('../../../dao/mailDao');
var utils = require('../../../util/utils');
var ConfigCache = require('../../../cache/configCache');
var arrayUtil = require('../../../util/arrayUtil');
var Mail = require('../../../domain/entity/mail');

module.exports = function (app) {
  return new Handler(app);
};

var Handler = function (app) {
  this.app = app;
};
/**
 * 发邮件
 */
Handler.prototype.sendAwardMail = function (cb) {
  var server = this.app.curServer;
  var areaId = server.area || 1;
  var now = Date.now();
  var yestoday = utils.getZeroHour(now) - 1;
  var weekDay = new Date(now).getDay() - 1;
  var worldBossAward;
  var hasRecord = false;
  var bossCfgs = ConfigCache.getAll.worldBoss();
  var bossAwardsCfgs = ConfigCache.getAll.worldBossAward();
  var bossId;
  var bossAwardCfg = [];
  var PlayerRankRecords;
  var isSendMail = false;

  async.waterfall([function (cb) {
    worldBossDao.getWorldBossAward(weekDay, areaId, cb);
  }, function (res,cb) {
    if(!!res){
      worldBossAward = res;
      hasRecord = true;
    }
    worldBossDao.get(yestoday, areaId, cb);
  }, function (res,cb) {
    PlayerRankRecords = res || [];
    if (!!hasRecord) {
      if(!utils.isSameDate(now,worldBossAward.updateTime)){
        //修改状态
        worldBossDao.updateWorldBossAward(weekDay, areaId, cb);
        isSendMail = true;
      }else{
        utils.invokeCallback(cb,null);
      }
      
    }
    else {
      //添加记录
      worldBossDao.createWorldBossAward(weekDay, areaId, cb);
      isSendMail = true;
    }
  }, function (cb) {
    if(isSendMail && PlayerRankRecords.length > 0){
      arrayUtil.dictionaryToArray(bossCfgs).select((t) => {
        if(t.weekday == weekDay){
          bossId = t.id;
        }
      });

      arrayUtil.dictionaryToArray(bossAwardsCfgs).select((t) => {
        if(t.bossid == bossId){
          bossAwardCfg.push(t);
        }
      });
      let i = 0;
      let entitys = PlayerRankRecords.select((t) => {
          return new Mail({
            playerId: t.playerId,
            items: bossAwardCfg[i].items
        });
        i++;
      });
      mailDao.create(entitys,null,areaId);
    }
  }], function (err) {
    if (!!err) {
        console.log('world boss send rankaward mail: ' + err); 
        return;
    }
  });
}
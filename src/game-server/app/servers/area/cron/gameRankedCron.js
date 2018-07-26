var consts = require('../../../util/consts');
const logger = require('pomelo-logger').getLogger(__filename);
var async = require('async');
var mailDao = require('../../../dao/mailDao');
var utils = require('../../../util/utils');
var ConfigCache = require('../../../cache/configCache');
var arrayUtil = require('../../../util/arrayUtil');
var Mail = require('../../../domain/entity/mail');
const rankedGameCache = require('../../../cache/rankedGameCache');

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
    var gameRankedAward;
    var playerRanks = [];
    var hasRecord = false;
    var awardsCfgs = ConfigCache.getAll.rankedGameAward();
    var isSendMail = false;
    var rankOne,awardId

    async.waterfall([function (cb) {
        rankedGameCache.getAll('ranking', cb);   //无排名，则插入
    }, function (res,cb) {
        // console.log(res)
        // 筛选非机器人及其排名
        if(!!res){
            for(var i=0; i<res.length; i++)
            {
                if (i%2 == 0 && res[i].indexOf('r') == -1 )
                {
                    rankOne = Math.floor(i/2) + 1
                    if (rankOne <= 3) {
                        awardId = rankOne;
                    }else if(rankOne >= 4 && rankOne < 10) {
                        awardId = 10;
                    }else if(rankOne >= 10 && rankOne < 50) {
                        awardId = 50;
                    }else if(rankOne >= 50 && rankOne < 100) {
                        awardId = 100;
                    }else if(rankOne >= 100 && rankOne < 500) {
                        awardId = 500;
                    }else if(rankOne >= 500 && rankOne < 1000) {
                        awardId = 1000;
                    }else {
                        awardId = 100000;
                    }
                    playerRanks.push({
                        id: res[i],
                        rank: rankOne,
                        awardId: awardId
                    })
                } 
            }
        }

        if(playerRanks.length > 0){
            let entitys = playerRanks.select((t) => {
                return new Mail({
                    playerId: parseInt(t.id),
                    // items: '[{"id":300000,"type":3,"num":'+ ConfigCache.get.rankedGameAward(t.awardId).money + '}]' });
                    items: [{
                        "id":300000,
                        "type":3,
                        "num":ConfigCache.get.rankedGameAward(t.awardId).money
                    }]
                });
            });
            // console.log(entitys)
            mailDao.create(entitys,null,areaId);
            logger.info('game ranked awards send in :' + now);
        }
    }], function (err) {
    if (!!err) {
        logger.info('game ranked send rankaward mail: ' + err); 
        return;
    }
    });
}
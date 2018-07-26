
var util = require('util');
var Entity = require('./entity');
var Daily = require('./daily');
var OffEarRec = require('./offEarRec');
var Goblin = require('./goblin');
const consts = require('../../util/consts');
/**
 * Player entity object
 * 
 * @param {object} opts init opts.
 */
var Player = function (opts) {
    Entity.call(this, opts);

    this.playerId = opts.playerId;
    this.name = opts.name;
    this.roleId = opts.roleId;
    //account id
    this.uid = opts.uid;
    //式神占位
    this.maxPos = opts.maxPos;
    this.lv = opts.lv || 1;
    this.exp = opts.exp || 0;
    this.gold = opts.gold || 0;
    this.money = opts.money || 0;
    //战力
    this.power = opts.power || 0;
    //体力
    this.energy = opts.energy || 0;
    //仙豆
    this.bean = opts.bean || 0;
    //最大关卡ID
    this.maxStage = opts.maxStage || 0;
    //当前关卡ID
    this.nowStage = opts.nowStage || 0;
    this.expRise = opts.expRise;
    this.goldRise = opts.goldRise;
    this.firstLogin = opts.firstLogin;
    this.lastLogin = opts.lastLogin;
    this.lastLogout = opts.lastLogout;
    //最大关卡完成时间
    this.lastStage = opts.lastStage || 0;
    //体力最后恢复时间
    this.lastEnergy = opts.lastEnergy || 0;
    //仙豆最后恢复时间
    this.lastBean = opts.lastBean || 0;
    this.daily = new Daily();
    this.goblin = opts.goblin || new Goblin();
    //式神背包格子数量
    this.heroBagNum = opts.heroBagNum || 0;
    //式神背包扩充次数
    this.heroBagExt = opts.heroBagExt || 0;
    //式神碎片
    this.heroFragment = opts.heroFragment || 0;
    //式神最大阵位编号,默认开启5个
    this.maxHeroLineup = opts.maxHeroLineup;
    //道具背包格子数
    this.propBagNum = opts.propBagNum || 30;
    //道具背包已经扩充次数
    this.propBagExt = opts.propBagExt || 0;
    //材料背包格子数
    this.matBagNum = opts.matBagNum || 30;
    //材料背包已经扩充次数
    this.matBagExt = opts.matBagExt || 0;
    //身份证号码
    this.idNumber = opts.idNumber;
    //是否成年
    this.isAdult = opts.isAdult || false;
    //今日收益时间,防沉迷系统使用
    this.lucreTime = opts.lucreTime || 0;
    //上次收益更新时间,防沉迷系统使用
    this.lucreUpTime = opts.lucreUpTime || 0;
    //离线收益记录
    this.OffEarRec = opts.offEarRec || new OffEarRec();
    //式神数量
    this.heroNum = opts.heroNum || 1;
    //完成一次百鬼标志
    this.goblinFlag = opts.goblinFlag || 0;
    //最后一次完成式神碎片雨时间
    this.lastHeroPieceRain = opts.lastHeroPieceRain || 0;
    //完成式神碎片活动次数
    this.heroPieceRainNum = opts.heroPieceRainNum || 0;
    //有没有新邮件
    this.hasNewMail = opts.hasNewMail || 0;
    //vip等级
    this.vip = opts.vip || 0;
    //最近一次领每日vip奖励的时间
    this.lastVipAwardTime = opts.lastVipAwardTime || 0;
    //最近一次领每日vip奖励的时间
    this.firstDayOnLineTime = opts.firstDayOnLineTime || 0;
    //命格值
    this.lifeLike = opts.lifeLike || 0;
    //命格等级
    this.lifeLikeLevel = opts.lifeLikeLevel || 1;
    //是否补领过前日日常任务奖励
    this.isRemedial = opts.isRemedial || false;
    //待补领奖励id列表
    this.remedialList = opts.remedialList || [];
    //当日在线时长
    this.onlineTime = opts.onlineTime || 0;
    //排位赛剩余挑战令
    this.rankedCard = opts.rankedCard || consts.Enums.RankedCard;
    //排位赛挑战历史
    this.rankedHistory = opts.rankedHistory || [];
    //排位赛上一次满5张挑战令的时间
    this.lastFullCard = opts.lastFullCard || 0;
    //排位赛上一次满5张挑战令的时间
    this.nextFullCard = opts.nextFullCard || 0;
    //上一次进入排位赛界面并进行redis更新的时间
    this.lastRanked = opts.lastFullCard || 0;
};

util.inherits(Player, Entity);

module.exports = Player;

//extend methods.


const consts = require('../../../util/consts');
const logger = require('pomelo-logger').getLogger(__filename);
const utils = require('../../../util/utils');
const arrayUtil = require('../../../util/arrayUtil');
const async = require('async');
const Formula = require('../../../util/formula');
const ConfigCache = require('../../../cache/configCache');
const playerDao = require('../../../dao/playerDao');
const playerLog = require('../../../dao/log/playerDao');
var heroDao = require('../../../dao/heroDao');
var illustratedDao = require('../../../dao/illustratedDao');
var bagDao = require('../../../dao/bagDao');
var lineupDao = require('../../../dao/lineupDao');
const bagLog = require('../../../dao/log/bagDao');
const Response = require('../../../domain/entity/response');
const ItemBuilder = require('../../../cache/itemBuilder');
var BattleBuilder = require('../../../cache/battleBuilder');
const Goblin = require('../../../domain/entity/goblin');
const playerTaskDao = require('../../../dao/playerTaskDao');
const illAchDao = require('../../../dao/illAchDao');
const mailDao = require('../../../dao/mailDao');
const rankedGameCache = require('../../../cache/rankedGameCache');

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 进入排位赛界面
 */
Handler.prototype.entry = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player;
    var playerList=[],myRanking,card,cardCD = 0;
    var lastFullCard = 0; //上一次满5张挑战令的时间
    var nextFullCard = 0; //下一次满5张挑战令的时间
    var lastRanked; //上一次进入排位赛界面并进行redis更新的时间点
    var redisUpdate = false; //玩家redis信息更新标志位
    var myRankingArea;
    var playerRanking;  //非前三名的对手名次列表
    var chanllenge;//所有挑战对手名次列表
    var totalPlayerId = [];//所有挑战对手ID
    var now = Date.now();
    
    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;

        lastRanked = player.lastRanked;
        if(lastRanked > 0) { 
            utils.invokeCallback(cb,null,null);
        }else { //初次进入，则添加排名记录
            rankedGameCache.setRank('ranking', playerId, now + parseInt( Math.random()*10 ) ,cb);   //无排名，则插入
        }
    }, function (res, cb) {
        //判定玩家redis信息是否需要更新
        if(now - lastRanked > 1000 * consts.Enums.RankedRedisUpdate)
        {
            redisUpdate = true;
            lastRanked = now;
        }

        card = player.rankedCard;
        //挑战令未达到上限，则判定挑战令变动情况并统计下一张挑战令恢复CD
        if (card < consts.Enums.RankedCard)
        {
            lastFullCard = player.lastFullCard; //上一次满5张挑战令的时间
            nextFullCard = player.nextFullCard; //下一次满5张挑战令的时间
            let oneCardCD = 1000 * consts.Enums.RankedCardCD; //一张挑战令恢复CD(毫秒)
            if (now < lastFullCard) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_CARD_CD
                });
                return;
            } 
            else if(now > nextFullCard) {   //恢复满
                card = 5;           //卡数置满
                cardCD = 0;
                lastFullCard = 0;   //挑战令CD判定参数置0
                nextFullCard = 0;
            }else {                 //未恢复满的区间内
                let cardRecovery = Math.floor((now - lastFullCard) / oneCardCD); //与最小卡相比的恢复卡数
                card = consts.Enums.RankedCard - Math.floor((nextFullCard - lastFullCard + 10)/oneCardCD) + cardRecovery; //卡数设置(进行了偏差处理)
                let passCD = now - (lastFullCard + oneCardCD * cardRecovery); //当前卡已走完的CD
                cardCD = parseInt((oneCardCD - passCD) / 1000); //剩余CD
            }
        }

        playerDao.setPlayer({
            $set: {
                rankedCard: card,
                lastFullCard: lastFullCard,
                nextFullCard: nextFullCard,
                lastRanked: lastRanked, 
                lastHeroPieceRain: now,
            }
        }, playerId, areaId, cb);

    }, function (res, cb) {
        player = res;

        if (redisUpdate) //更新玩家redis信息
        {
            var key = consts.Enums.RankedRedisPlayerPrefix + playerId;
            var value = JSON.stringify({
                name: player.name,
                power: player.power,
                headerCode: player.roleId
            })
            rankedGameCache.update( key, value, 0, cb);
        }else{
            utils.invokeCallback(cb,null,null)
        }

    }, function (res, cb) {
        //从redis获取玩家排名
        rankedGameCache.getRank('ranking',playerId,cb);
    }, function (res, cb) {

        myRanking = parseInt(res) + 1;

        //获取匹配范围
        if (myRanking == 1) {
            myRankingArea = consts.Enums.RankedMatchArea.Area1;
        }else if(myRanking == 2) {
            myRankingArea = consts.Enums.RankedMatchArea.Area2;
        }else if(myRanking == 3) {
            myRankingArea = consts.Enums.RankedMatchArea.Area3;
        }else if(myRanking >= 4 && myRanking < 10) {
            myRankingArea = consts.Enums.RankedMatchArea.Area4;
        }else if(myRanking >= 10 && myRanking < 50) {
            myRankingArea = consts.Enums.RankedMatchArea.Area5;
        }else if(myRanking >= 50 && myRanking < 100) {
            myRankingArea = consts.Enums.RankedMatchArea.Area6;
        }else if(myRanking >= 100 && myRanking < 200) {
            myRankingArea = consts.Enums.RankedMatchArea.Area7;
        }else if(myRanking >= 200 && myRanking < 500) {
            myRankingArea = consts.Enums.RankedMatchArea.Area8;
        }else if(myRanking >= 500 && myRanking < 1000) {
            myRankingArea = consts.Enums.RankedMatchArea.Area9;
        }else if(myRanking >= 1000 && myRanking < 2000) {
            myRankingArea = consts.Enums.RankedMatchArea.Area10;
        }else if(myRanking >= 2000 && myRanking < 5000) {
            myRankingArea = consts.Enums.RankedMatchArea.Area11;
        }else if(myRanking >= 5000 && myRanking < 10000) {
            myRankingArea = consts.Enums.RankedMatchArea.Area12;
        }else if(myRanking >= 10000) {
            myRankingArea = consts.Enums.RankedMatchArea.Area13;
        }

        //随机获取对手名次
        playerRanking = matchPlayerRanking(myRanking,myRankingArea);

        playerRanking = playerRanking.sort((a,b) => {
            return a-b;
        })

        if (myRanking <= 3) {
            totalPlayerRanking = playerRanking; //前三名只列出三个对手
        }else {
            totalPlayerRanking = [1,2,3].concat(playerRanking); //前三名固定会出现
        }

        if (myRanking > 3)
        {
            //根据对手排名、从redis获取前三名玩家id
            rankedGameCache.getRankingIds('ranking',[1,2,3],cb);
        }else{
            utils.invokeCallback(cb,null,null);
        }

    }, function (res, cb) {
        var rankingIds = res;
        if (rankingIds)
        {
            for (var i = 0; i<rankingIds.length; i++)
            {
                if(i % 2 ==0)
                totalPlayerId.push(rankingIds[i])
            }
        }

        //根据对手排名、从redis获取玩家id
        rankedGameCache.getRankingIds('ranking',playerRanking,cb);

    }, function (res, cb) {
        var rankingIds = res;
        for (var i = 0; i<rankingIds.length; i++)
        {
            for (var j = 0; j<playerRanking.length; j++)
            {
                if(playerRanking[j]+'' == rankingIds[i])
                {
                    totalPlayerId.push(rankingIds[i-1])
                }
            }
        }        

        //根据对手ID、从redis获取玩家信息
        var rankedKeys = [];
        totalPlayerId.forEach(el => {
            rankedKeys.push(consts.Enums.RankedRedisPlayerPrefix + el);
        });
        rankedGameCache.getPlayerByIds(rankedKeys,cb);
    }, function (res, cb) {
        var rankedList = res;

        //整理玩家列表，并判断CD
        for (var i=0;i<rankedList.length; i++)
        {
            var rId = totalPlayerId[i]
            var robotFlag = false
            if(!rankedList[i])
            {
                //若无数据，说明是怪物，直接获取怪物ID
                rId = totalPlayerId[i].split(":")[1]
                rankedList[i] = ConfigCache.get.robot(rId);
                rankedList[i].power = ConfigCache.get.monster(rankedList[i].monsterId).power
                robotFlag = true
            }else{
                rankedList[i] = JSON.parse(rankedList[i]);
            }
            
            playerList.push({
                id: rId,
                name: rankedList[i].name,
                power: rankedList[i].power,
                ranking: totalPlayerRanking[i],
                headerCode: rankedList[i].headerCode,
                CDTime: 0,
                isRobot: robotFlag
            });

            if(i>=3 || myRanking <=3)
            {
                player.rankedHistory.forEach(item => {
                    if (totalPlayerId[i] == item.id && now - item.lastTime < consts.Enums.RankedFightCD * 1000)
                    {
                        playerList[i].CDTime = consts.Enums.RankedFightCD - parseInt((now - item.lastTime)/1000)
                    }
                });
            }
        }

        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            playerList: playerList,
            myRanking: myRanking,
            card: card,
            cardCD: cardCD,
            // lastFullCard: lastFullCard,
            // nextFullCard: nextFullCard,
            // redisUpdate: redisUpdate,
            // lastRanked: lastRanked,
            // myRankingArea: myRankingArea,
            // playerRanking: playerRanking,
            // totalPlayerRanking: totalPlayerRanking,
            // totalPlayerId: totalPlayerId,
            // history: player.rankedHistory,
        });
        return;

    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_ENTRY_RANKED_GAME_FAIL
        });
        return;
    });
};


/**
 * 排位赛挑战
 */
Handler.prototype.combat = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player,combat;
    var playerList,myRanking,card,cardCD = 0;
    var lastFullCard = 0; //上一次满5张挑战令的时间
    var nextFullCard = 0; //下一次满5张挑战令的时间
    var oneCardCD = 1000 * consts.Enums.RankedCardCD; //一张挑战令恢复CD(毫秒)
    var now = Date.now();
    var lineups,heros,illustrateds,combatResult;
    var combatId = 1 * msg.id;
    var isRobot = 1 * msg.isRobot;  //挑战对象是否机器人
    var isChallenge = 1 * msg.isChallenge; //是否消耗5张挑战令挑战前三名
    var playerIdx;
    var myScore,playerScore;
    var award, awardCfg, items = [], itemMap, heroIds = [], heros = [];
    var exp, gold, money;
    var self = this;

    if (isRobot)
    {
        var robotId = "r:" + combatId;  //机器人ID
        playerIdx = playerId;
    } else{
        playerIdx ={"$in": [playerId,combatId]};
    }
    
    async.waterfall([function (cb) {
        if(!combatId || isNaN(combatId))
        {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ENEMY_ID_ERR
            });
            return;
        }
        playerDao.getPlayer(playerId, areaId, cb);
    }, function (res, cb) {
        player = res;
        //若为消耗5张挑战令挑战前三名,判断挑战令是否足够
        if (isChallenge)
        {
            if(player.rankedCard < consts.Enums.RankedCard)
            {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_CARD_NOT_ENOUGH
                });
                return;
            }
        }

        if(!isRobot) {
            playerDao.getPlayer(combatId, areaId, cb);
        }else {
            utils.invokeCallback(cb,null,null);
        }
    }, function (res, cb) {
        combat = res;
        //判断对手是否在冻结时间内
        for (var i=0; i<player.rankedHistory.length;i++)
        {
            if ((robotId == player.rankedHistory[i].id || combatId == player.rankedHistory[i].id) && now - player.rankedHistory[i].lastTime < consts.Enums.RankedFightCD * 1000)
            {
                break;
            }   
        }
        if (i < player.rankedHistory.length)
        {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_IN_CD
            });
            return;
        }
        
        card = player.rankedCard;
        //挑战令未达到上限，则判定等待期间是否有恢复卡
        if (card < consts.Enums.RankedCard)
        {
            lastFullCard = player.lastFullCard; //上一次满5张挑战令的时间
            nextFullCard = player.nextFullCard; //下一次满5张挑战令的时间
            if (now < lastFullCard) {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_CARD_CD
                });
                return;
            } 
            else if(now > nextFullCard) {   //恢复满
                card = 5;           //卡数置满
                lastFullCard = 0;   //挑战令CD判定参数置0
                nextFullCard = 0;
            }else {                 //未恢复满的区间内
                let cardRecovery = Math.floor((now - lastFullCard) / oneCardCD); //与最小卡相比的恢复卡数
                let cardNow = consts.Enums.RankedCard - Math.floor((nextFullCard - lastFullCard + 10)/oneCardCD) + cardRecovery; //卡数设置(进行了偏差处理)
                let cardOffSet = cardNow - card; //排位赛界面等待期间恢复的卡数
                if(cardOffSet > 0) //若无恢复，则无需处理，若有恢复，则需要同步冻结区间
                {
                    card = cardNow;
                    lastFullCard = lastFullCard + cardOffSet * oneCardCD; //cd区间压缩
                }else if(cardOffSet < 0){
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_CARD_NUM
                    });
                    return;
                }
            }
        }

        if (card <=0)
        {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_CARD_NOT_ENOUGH
            });
            return;
        }


    // *****************************战斗部分*******************************
        lineupDao.getByPlayer(playerIdx, areaId, cb);
    }, function (res, cb) {
        
        if (!isRobot) {
            lineups = [];
            lineups['player'] = [];
            lineups['combat'] = [];
            res.forEach(el => {
                if(el.playerId == playerId)
                {
                    lineups['player'].push(el)
                }else {
                    lineups['combat'].push(el)
                }
            });

        }else {
            lineups = res;
        }
        
        //获取玩家的出战式神
        heroDao.getByPlayer(playerIdx, areaId, cb);
        
    }, function (res, cb) {

        if (!isRobot) {
            heros = [];
            heros['player'] = [];
            heros['combat'] = [];
            res.forEach(el => {
                if(el.playerId == playerId)
                {
                    heros['player'].push(el)
                }else {
                    heros['combat'].push(el)
                }
            });
        }else {
            heros = res;
        }

        illustratedDao.getByPlayer(playerIdx, areaId, cb);
    }, function (res, cb) {
        if (!isRobot) {
            illustrateds = [];
            illustrateds['player'] = [];
            illustrateds['combat'] = [];
            res.forEach(el => {
                if(el.playerId == playerId)
                {
                    illustrateds['player'].push(el)
                }else {
                    illustrateds['combat'].push(el)
                }
            });
        }else {
            illustrateds = res;
        }

        //提交给另一进程处理战斗计算
        
        if (isRobot) {
            var playerBattle = BattleBuilder.builPlayer(player, heros, lineups, illustrateds);
            let monsterCfg = ConfigCache.get.robot(combatId)
            if(!monsterCfg)
            {
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_FOUND_INTEN
                });
                return;
            }
            var monsterBattle = { tid: monsterCfg.monsterId };
        }else {
            var playerBattle = BattleBuilder.builPlayer(player, heros['player'], lineups['player'], illustrateds['player']);
            var monsterBattle = BattleBuilder.builPlayer(combat, heros['combat'], lineups['combat'], illustrateds['combat']);
        }

        self.app.rpc.combat.checkpointRemote.execute(session,
            playerBattle,
            monsterBattle,
            function (err, res) {
                if (!!err) {
                    logger.error('player:%d, checkpoind:%d combat error! %s', playerId, combatId, err.stack);
                }
                utils.invokeCallback(cb, err, res);
            });

    }, function (res, cb) {
        combatResult = res;

    // *****************************战斗部分(结束)*******************************

        //获取双方分数,如果战斗失败，分数不变，如果胜利且对方分数靠前，则交换分数
        //从redis获取玩家分数
        rankedGameCache.getScore('ranking',playerId,cb);
    }, function (res, cb) {
        myScore = parseInt(res);
        if(isRobot) {
            rankedGameCache.getScore('ranking',robotId,cb);
        }else {
            rankedGameCache.getScore('ranking',combatId,cb);
        }
    }, function (res, cb) {
        playerScore = res;
        if (playerScore < myScore && combatResult.res)
        {
            rankedGameCache.setRank('ranking', playerId, playerScore ,cb);   
        } else {
            utils.invokeCallback(cb,null,null);
        }
    }, function (res, cb) {
        if (playerScore < myScore && combatResult.res)
        {
            if(isRobot){
                rankedGameCache.setRank('ranking', robotId, myScore ,cb);   
            }else {
                rankedGameCache.setRank('ranking', combatId, myScore ,cb);  
            }
        } else {
            utils.invokeCallback(cb,null,null);
        }

    }, function (res, cb) {
        //若挑战成功，且对手为玩家，则发送通知邮件
        if (combatResult.res && !isRobot)
        {
            let msg = player.name + "在排位赛中与阁下浴血奋战数十回合，阁下不幸落败。"
            mailDao.creatMail({title: "排位赛名次变动",content: msg},combatId, areaId, cb);
        } else {
            utils.invokeCallback(cb,null,null);
        }
    }, function (res, cb) {
        //获取玩家挑战后的排名
        rankedGameCache.getRank('ranking', playerId, cb);
    }, function (res, cb) {
        myRanking = parseInt(res) + 1;
        var awardId 
        //根据排名，获取参与奖ID
        if (myRanking <= 3) {
            awardId = myRanking;
        }else if(myRanking >= 4 && myRanking < 10) {
            awardId = 10;
        }else if(myRanking >= 10 && myRanking < 50) {
            awardId = 50;
        }else if(myRanking >= 50 && myRanking < 100) {
            awardId = 100;
        }else if(myRanking >= 100 && myRanking < 500) {
            awardId = 500;
        }else if(myRanking >= 500 && myRanking < 1000) {
            awardId = 1000;
        }else {
            awardId = 100000;
        }
        //下发奖励
        awardCfg = ConfigCache.get.rankedGameAward(awardId);
        if (!awardCfg) {
            //配置错误
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_INTEN
            });
            return;
        }

        utils.invokeCallback(cb,null,null);
    }, function (res, cb) {
        items = awardCfg.items;
        itemMap = new ItemBuilder(items, ConfigCache.items());

        exp = itemMap.getExp();
        gold = itemMap.getGold();
        money = itemMap.getMoney();

        if (gold > 0 || exp > 0 || money > 0) {
            playerDao.setPlayer({
                $inc: {
                    gold: gold,
                    exp: exp,
                    money: money
                }
            }, playerId, areaId, cb);
        }
        else {
            playerDao.getPlayer(playerId, areaId, cb);
        }
    }, function (res, cb) {
        player = res;

        let itemArray = itemMap.getItem();
        if (!!itemArray && itemArray.length > 0) {
            bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null);
        }
    }, function (cb) {
        heroIds = awardCfg.heroIds;

        if (!!heroIds && heroIds.length > 0) {
            heros = heroIds.select((t) => {
                return { hero: { id: t } };
            });

            heroDao.createMany(heros, player, playerId, areaId, cb);
        }
        else {
            utils.invokeCallback(cb, null, {});
        }
    }, function (res, cb) {
        heros = res;
        
        if (isChallenge)
        {
            card = 0;
            lastFullCard = now;
            nextFullCard = now + 5 * oneCardCD;
        }else {
            card -= 1; //消耗一张卡
            if (lastFullCard == 0 && nextFullCard == 0) //满卡的情况
            {
                lastFullCard = now;
                nextFullCard = now + oneCardCD;
            } else {
                nextFullCard += oneCardCD; //延长一份CD
            }
        }

        var newHistory = [];

        if (!isRobot)
        {
            newHistory.push({
                id: combatId,
                lastTime: now
            });
        }else {
            newHistory.push({
                id: robotId,
                lastTime: now
            });    
        }
        
        //保留CD时间内的历史对手
        player.rankedHistory.forEach(el => {
            if (now - el.lastTime < consts.Enums.RankedFightCD * 1000)
            {
                newHistory.push(el);
            }
        })

        playerDao.setPlayer({
            $set: {
                rankedCard: card,
                lastFullCard: lastFullCard,
                nextFullCard: nextFullCard,
                rankedHistory: newHistory
            }
        }, playerId, areaId, cb);

    }, function (res, cb) {
        player = res;
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            myRanking: myRanking,
            card: card,
            // lastFullCard: lastFullCard,
            // nextFullCard: nextFullCard,
            items: items,
            heros: heros,
            combat: combatResult,
        });
        return;

    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_ENTRY_RANKED_GAME_FAIL
        });
        return;
    });
};



/**
 * 购买挑战令
 */
Handler.prototype.buy = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player;
    var costMoney = 0;

    async.waterfall([function (cb) {
        playerDao.getPlayer(playerId, areaId, cb);

    }, function (res, cb) {
        player = res;

        if (player.rankedCard >= consts.Enums.RankedCard) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_CARD_LIMIT
            });
            return;
        }
        costMoney = consts.Enums.RankedPrice;

        if (player.money < costMoney) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_NOT_MENOY
            });
            return;
        }

        var nextFullCardSub = 1000 * consts.Enums.RankedCardCD;

        playerDao.setPlayer({
            $inc: {
                rankedCard: 1,
                money: -costMoney,
                nextFullCard: -nextFullCardSub,
            },
        }, playerId, areaId, cb);

    }, function (res, cb) {
        player = res;
        //增加日志记录
        var ops = {
            lv: player.lv,
            exp: player.exp,
            gold: player.gold,
            money: player.money,
            energy: player.energy,
            bean: player.bean,
            incMoney: -costMoney,
        };
        playerLog.write(ops, 'BuyRankedCard', playerId, areaId, cb);

    }, function (cb) {
        next(null, {
            code: consts.RES_CODE.SUC_OK,
            msg: '',
            money: player.money,
            card: player.rankedCard,
        });

    }], function (err) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_BUY_BEAN_FAIL
        });
        return;
    });
};


//随机匹配挑战对手排名
var matchPlayerRanking = (rank, area) => {
    let matchRanking = [];
    switch (area)
    {
        case consts.Enums.RankedMatchArea.Area1:
            matchRanking = [2,3,4];    
            break;
        case consts.Enums.RankedMatchArea.Area2:
            matchRanking = [1,3,4];
            break;
        case consts.Enums.RankedMatchArea.Area3:
            matchRanking = [1,2,4];
            break;
        default:    //除了前三名的情况
            while (matchRanking.length < 3)
            {
                let rand = Math.random();
                if (rand == 0){
                    continue;
                }else {
                    rand = Math.floor(rank - rand*area);
                    for (var i=0; i<matchRanking.length; i++)
                    {
                        if(rand == matchRanking[i])
                        break;
                    }
                    if(i == matchRanking.length)
                    {
                        matchRanking.push(rand);
                    }
                }
            }
            break;
    }
    return matchRanking;
}
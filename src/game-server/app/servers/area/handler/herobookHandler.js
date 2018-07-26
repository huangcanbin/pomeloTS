const async = require('async');
const utils = require('../../../util/utils');
const consts = require('../../../util/consts');
const heroDao = require('../../../dao/heroDao');
const illAchDao = require('../../../dao/illAchDao');
const playerDao = require('../../../dao/playerDao');
const illustratedDao = require('../../../dao/illustratedDao');
const bagDao = require('../../../dao/bagDao');
const heroLogDao = require('../../../dao/heroLogDao');
const ConfigCache = require('../../../../app/cache/configCache');
const Formula = require('../../../util/formula');
const ObjectID = require('mongodb').ObjectID;
const Hero = require('../../../domain/entity/hero');
const arrayUtil = require('../../../util/arrayUtil');
const Response = require('../../../domain/entity/response');
const ItemBuilder = require('../../../cache/itemBuilder');
const logger = require('pomelo-logger').getLogger(__filename);

module.exports = function (app) {
    return new Handler(app);
};

var Handler = function (app) {
    this.app = app;
};

/**
 * 获取玩家式神列表
 */
Handler.prototype.query = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player = {};

    async.waterfall([
        function (cb) {
            //获取player
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;
            //获取玩家式神列表
            heroDao.getByPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                heroBagNum: player.heroBagNum,
                heroBagExt: player.heroBagExt,
                heros: res
            });
        }
    ], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};

/**
 * 扩充式神背包
 */
Handler.prototype.addHeroBags = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player = {};
    var addCell = 10;   //每次扩充增加的格子数

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            if (player.heroBagExt >= ConfigCache.getVar.const(consts.Keys.HERO_BAG_EXT_MAX)) {
                //扩充上限
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_EXT_MAX
                });
                return;
            }

            //扩充价格为：（已扩充次数+1）*基础价
            var price = (player.heroBagExt + 1) * ConfigCache.getVar.const(consts.Keys.HERO_BAG_EXT_PRICE);

            if (player.money < price) {
                //勾玉不足
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_MENOY
                });
                return;
            }

            playerDao.setPlayer({
                $inc: {
                    money: -price,
                    heroBagExt: 1,
                    heroBagNum: addCell
                }
            }, playerId, areaId, cb);
        },
        function (res, cb) {
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                money: res.money,
                heroBagNum: res.heroBagNum,
                heroBagExt: res.heroBagExt
            });
        }
    ], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};

/**
 * 式神熔炼
 */
Handler.prototype.smelt = function (msg, session, next) {
    var playerId = session.get('playerId');
    var areaId = session.get('areaId');
    var player = {};
    var heros = [];
    var getHeros = [];      //熔炼后得到的式神
    var heroFragment = 0;    //式神碎片数量
    var ids = msg.ids.split(',');
    var selHeros = [];      //选择熔炼的式神

    async.waterfall([
        function (cb) {
            playerDao.getPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            player = res;

            //获取玩家式神列表
            heroDao.getByPlayer(playerId, areaId, cb);
        },
        function (res, cb) {
            heros = res;

            heros.forEach(function (el) {
                ids.forEach(function (hid) {
                    if (el.id.equals(hid)) {
                        selHeros.push(el);
                        return;
                    }
                });
            });

            if (selHeros.length != ids.length) {
                //包含无效的式神ID
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_HERO_NOT_EXIST
                });
                return;
            }

            var noSmelt = false;
            selHeros.forEach(function (el) {
                if (el.pos > 0 && el.pos < player.maxHeroLineup) {
                    noSmelt = true;
                    return;
                }
            });

            if (!!noSmelt) {
                //熔炼的式神中,包含主角或出阵的式神
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_SMELT
                });
                return;
            }

            //获取式神品质配置
            var qualitys = [];
            var cfgHero = ConfigCache.getAll.hero();
            selHeros.forEach(function (el) {
                var cfg = cfgHero[el.heroId];
                if (!!cfg) {
                    qualitys.push(cfg.quality);
                }
            });

            //获取熔炼配置
            var heroSmelt = ConfigCache.getAll.heroSmelt();
            //获取抽奖配置
            var hitSet = ConfigCache.getAll.heroLottery();
            var forResult = true;

            qualitys.forEach(function (el) {
                var hs = heroSmelt[el];
                if (!hs) {
                    //熔炼配置不存在
                    logger.error('At HeroTakeTen heroId:%d is not found.', heroId);
                    next(null, {
                        code: consts.RES_CODE.ERR_FAIL,
                        msg: consts.RES_MSG.ERR_SUMMON_TAKE
                    });
                    forResult = false;
                    return;
                }

                if (!!Formula.isHit(hs.lotteryRatio)) {
                    //抽取式神
                    var hitItem = Formula.hitOneFromDict(hitSet, function (p) { return p.type === hs.lotteryType; });
                    heroId = hitItem.heroId;
                    var hero = ConfigCache.get.hero(heroId);
                    if (!hero) {
                        //式神不存在
                        logger.error('At HeroTakeTen heroId:%d is not found.', heroId);
                        next(null, {
                            code: consts.RES_CODE.ERR_FAIL,
                            msg: consts.RES_MSG.ERR_SUMMON_TAKE
                        });
                        forResult = false;
                        return;
                    }
                    else {
                        getHeros.push({ hero: hero });    //增加式神
                    }
                }
                else {
                    //获取碎片
                    heroFragment += hs.fragment;
                }
            });

            if (!forResult) return;

            var objIds = [];
            ids.forEach(function (el) {
                objIds.push(new ObjectID(el));
            });
            //删除熔炼的式神
            heroDao.deleteMany(objIds, playerId, areaId, cb);
        },
        function (cb) {
            //添加式神删除记录
            heroLogDao.createMany(selHeros, areaId, cb);
        },
        function (cb) {
            //增加式神碎片
            if (heroFragment > 0) {
                playerDao.setPlayer({
                    $inc: {
                        heroFragment: heroFragment
                    }
                }, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, null);
            }
        },
        function (res, cb) {
            if (res) {
                player = res;
            }

            //增加式神
            if (getHeros.length > 0) {
                heroDao.createMany(getHeros, player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, {});
            }
        }, function (res, cb) {
            let reHeros = res;

            //下发熔炼结果,获得式神碎片总数、抽取的式神列表；
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                heroFragment: player.heroFragment,
                getFragment: heroFragment,
                heros: reHeros
            });
        }
    ], function (err) {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};

/**
 * 获取玩家图鉴
 */
Handler.prototype.illustrated = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let illustrateds = [];

    async.waterfall([
        (cb) => {
            //获取玩家式神列表
            illustratedDao.getByPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            illustrateds = res;

            let power = illustrateds.sum((t) => {
                let qualityCfg = ConfigCache.get.hero(t.heroId);
                if(!qualityCfg)
                {
                    logger.error('herobookHandler.illustrated : player:%d, heroId:%d - config does not exists', playerId, t.heroId)
                    return 0;
                }
                let quality = qualityCfg.quality
                return ConfigCache.get.illustrated(quality).power;
            });

            //获取玩家式神列表
            next(null, {
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                heros: illustrateds,
                illustratedPower: power
            });
        },
    ], (err) => {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};

/**
 * 查看图鉴成就
 */
Handler.prototype.achievement = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let illustrateds = [], illAchs = [];
    let achs = [], addAchs = []; //需要记录的玩家成就

    let cfgs = ConfigCache.getAll.illAch();

    async.waterfall([
        (cb) => {
            //获取玩家式神列表
            illustratedDao.getByPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            illustrateds = res;
            //获取玩家图鉴成就状态
            illAchDao.getByPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            illAchs = res;

            let illIdStr = `,${(illustrateds.select(t => { return t.heroId; })).toString()},`;

            for (var i in cfgs) {
                let cfg = cfgs[i];
                let achId = cfg.id;
                let illAch = illAchs.firstOrDefault((t) => { return achId == t.achId; });
                if (!!illAch) {
                    //已经有成就记录
                    achs.push({ achId: achId, status: illAch.status });
                }
                else {
                    let hasHero = true;
                    for (let j = 0; j < cfg.needHeroIds.length; j++) {
                        hasHero = illIdStr.includes(`,${cfg.needHeroIds[j]},`);
                        if (!hasHero) {
                            break;
                        }
                    }

                    if (!hasHero) {
                        //未达成
                        achs.push({ achId: achId, status: consts.Enums.illAchStatus.Not });
                    }
                    else {
                        //可领取
                        let canAch = { achId: achId, status: consts.Enums.illAchStatus.Can };
                        achs.push(canAch);

                        //玩家成就,需要添加可领取的数据记录
                        addAchs.push(canAch);
                    }
                }
            }

            if (addAchs.length > 0) {
                //添加可领取的成就(因为不记录未达成成就,所以只做添加不做更新)
                illAchDao.createMany(addAchs, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null);
            }
        },
        (cb) => {
            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                achs: achs,
                heros: illustrateds
            }, next);
        },
    ], (err) => {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};

/**
 * 领取图鉴成就奖励
 */
Handler.prototype.getAward = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let achId = 1 * msg.achId;
    let illustrateds = [], illAch = [], heros = [], heroIds = [], player;
    let items, itemMap;
    let cfg = ConfigCache.get.illAch(achId);
    if (!cfg) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_INTEN
        });
        return;
    }

    async.waterfall([
        (cb) => {
            //获取该成就记录
            illAchDao.getByAchId(achId, playerId, areaId, cb);
        },
        (res, cb) => {
            illAch = res;
            if (!illAch || illAch.status == consts.Enums.illAchStatus.Not) {
                //无法领取成就奖励
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_NOT_ILL_ACH
                });
                return;
            }
            else if (illAch.status != consts.Enums.illAchStatus.Can) {
                //已经领取
                next(null, {
                    code: consts.RES_CODE.ERR_FAIL,
                    msg: consts.RES_MSG.ERR_AWARD_ILL_ACH
                });
                return;
            }

            playerDao.getPlayer(playerId, areaId, cb);
        },
        (res, cb) => {
            player = res;

            items = cfg.items;

            if (items.length > 0) {
                bagDao.isEnoughItemsBag(items, player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                });
            }
        },
        (res, cb) => {
            if (res.code !== consts.RES_CODE.SUC_OK) {
                next(null, res);
                return;
            }

            heroIds = cfg.heroIds;
            if (heroIds.length > 0) {
                heroDao.isEnoughHeroBag([heroIds.length], player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, {
                    code: consts.RES_CODE.SUC_OK,
                    msg: ''
                });
            }
        },
        (res, cb) => {
            if (res.code !== consts.RES_CODE.SUC_OK) {
                next(null, res);
                return;
            }

            illAchDao.setStatus(consts.Enums.illAchStatus.Alr, achId, playerId, areaId, cb);
        },
        (cb) => {
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
                utils.invokeCallback(cb, null, null);
            }
        },
        (res, cb) => {
            if (!!res) {
                player = res;
            }

            let itemArray = itemMap.getItem();
            if (!!itemArray && itemArray.length > 0) {
                bagDao.createOrIncBag(itemArray, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null);
            }
        },
        (cb) => {
            if (!!heroIds && heroIds.length > 0) {
                heros = heroIds.select((t) => {
                    return { hero: { id: t } };
                });

                heroDao.createMany(heros, player, playerId, areaId, cb);
            }
            else {
                utils.invokeCallback(cb, null, []);
            }
        },
        (res, cb) => {
            heros = res;

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                achs: [
                    {
                        achId: achId,
                        status: consts.Enums.illAchStatus.Alr
                    }
                ],
                items: cfg.items,
                heros: heros
            }, next);
        },
    ], (err) => {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};


/**
 * 图鉴成就前端配置
 */

Handler.prototype.illAchCfg = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let cfg = ConfigCache.getAll.illAch();
    if (!cfg) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_INTEN
        });
        return;
    }

    var cfgFormat = []

    for(var i in cfg)
    {

        var items = []
        var heros = []
        var skillIdLv = []

        cfg[i]["items"].forEach(el=>{
            items.push({
                "id": el["id"],
                "num": el["num"],
            })
        })

        cfg[i]["heros"].forEach(el=>{
            heros.push({
                "id": el["heroId"],
                "num": el["num"],
            })
        })

        skillIdLv.push({
            "id": cfg[i]["skillId"],
            "lv": cfg[i]["skillLv"],
        })


        cfgFormat.push({
            "id" : cfg[i]["id"],
            "needHeroIds" : cfg[i]["needHeroIds"],
            "items" : items,
            "heros" : heros,
            "skillIdLv" : skillIdLv
        })
       
    }

    async.waterfall([
        (cb) => {

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                cfgs: cfgFormat,
            }, next);
        },
    ], (err) => {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};



/**
 * 技能表前端配置
 */

Handler.prototype.skillCfg = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let cfg = ConfigCache.getAll.skill();
    if (!cfg) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_INTEN
        });
        return;
    }

    var cfgFormat = []

    for(var i in cfg)
    {
        cfgFormat.push({
            "skill_id" : cfg[i]["skillId"],
            "lv" : cfg[i]["lv"],
            "prob": cfg[i]["weight"],
            "precond": cfg[i]["precond"],
            "precond_num": cfg[i]["precondNum"],
            "passive": cfg[i]["passive"],
            "effect_type": cfg[i]["effectType"],
            "effect_num": cfg[i]["effectNum"],
            "state_type": cfg[i]["stateType"],
            "state_num": cfg[i]["stateNum"],
            "state_round": cfg[i]["stateRound"],
            "target": cfg[i]["target"],
        })
    }
 
    async.waterfall([
        (cb) => {

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                cfgs: cfgFormat,
            }, next);
        },
    ], (err) => {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};




/**
 * 式神表前端配置
 */

Handler.prototype.heroCfg = function (msg, session, next) {
    let playerId = session.get('playerId');
    let areaId = session.get('areaId');
    let cfg = ConfigCache.getAll.hero();
    if (!cfg) {
        next(null, {
            code: consts.RES_CODE.ERR_FAIL,
            msg: consts.RES_MSG.ERR_INTEN
        });
        return;
    }

    var cfgFormat = []

    for(var i in cfg)
    {
        cfgFormat.push({
            "id": cfg[i]["id"],
            "attack": cfg[i]["attack"],
            "hero_attack": cfg[i]["heroAttack"],
            "prop_attack": cfg[i]["propAttack"],
            "hp": cfg[i]["hp"],
            "hero_hp": cfg[i]["heroHp"],
            "prop_hp": cfg[i]["propHp"],
            "hit": cfg[i]["hit"],
            "hero_hit": cfg[i]["heroHit"],
            "prop_hit": cfg[i]["propHit"],
            "dodge": cfg[i]["dodge"],
            "hero_dodge": cfg[i]["heroDodge"],
            "prop_dodge": cfg[i]["propDodge"],
            "speed": cfg[i]["speed"],
            "hero_speed": cfg[i]["heroSpeed"],
            "prop_speed": cfg[i]["propSpeed"],
            "skill_id": cfg[i]["skillId"],
        })
    }
 
    async.waterfall([
        (cb) => {

            Response({
                code: consts.RES_CODE.SUC_OK,
                msg: '',
                cfgs: cfgFormat,
            }, next);
        },
    ], (err) => {
        if (!!err) {
            next(null, {
                code: consts.RES_CODE.ERR_FAIL,
                msg: consts.RES_MSG.ERR_HANDLE_TIMEOUT
            });
            return;
        }
    });
};
var formula = module.exports;
var consts = require('./consts');
var ConfigCache = require('../cache/configCache');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('./utils');
var arrayUtil = require('./arrayUtil');

var PdMaxLucreTime = 1000 * 60 * 10; //每天最大收益时间10分钟

/**
 * 获取最大收益时间
 */
formula.getMaxLucreTime = function (player, now, cb) {
    var isToday = true; //是否今天收益过
    var maxLucreTime = PdMaxLucreTime;
    //判断创建账号是否超过30天,判断是否成年
    var ctime = utils.getZeroHour(player.createTime) + (31 * 24 * 1000 * 60 * 60);
    if (!player.isAdult && now >= ctime) {
        //今天是否计算过收益
        if (utils.isSameDate(player.lucreUpTime, now)) {
            maxLucreTime = maxLucreTime - player.lucreTime; //最大收益时间-今日收益时间
            maxLucreTime = maxLucreTime > 0 ? maxLucreTime : 0;
            today = true;
        }
        else {
            today = false;
        }
    }
    else {
        //没有防沉迷限制
        maxLucreTime = -1;
    }

    if (cb && typeof cb === 'function') {
        cb(maxLucreTime);
    } else {
        return { maxLucreTime: maxLucreTime };
    }
};

/**
 * 在线挂机收益
 * @param {time1} 当前时间
 * @param {time2} 上次收益结算时间
 * @param {maxLucreTime} 最大收益时间,-1:无收益限制
 * @returns {object} exp:收益的经验 gold:收益的金币 ts:本次收益时间
 */
formula.settleOnlineBoss = function (time1, time2, maxLucreTime, expsecond, goldsecond, vipconfig, cb) {
    var exp = 0, gold = 0, msel = 0;
    var astrict = maxLucreTime > -1;    //是否有收益限制

    if (time1 > 0 && time2 > 0) {
        msel = time1 - time2;
        if (astrict) {
            //有收益限制
            if (msel > maxLucreTime) {
                msel = maxLucreTime;
            }
        }

        var ts = Math.floor(msel / 1000);

        exp = Math.floor(expsecond * ts * vipconfig.exp) ;
        gold = Math.floor(goldsecond * ts * vipconfig.gold);
    }

    if (cb && typeof cb === 'function') {
        cb(exp, gold, msel);
    } else {
        return { exp: exp, gold: gold, msel: msel };
    }
};

/**
 * 离线挂机收益
 * @param {time} 离线时间
 * @param {surLucTime} 今天剩余最大收益时间,-1:无收益限制 
 */
formula.settleOfflineBoss = function (time, surLucTime, expsecond, goldsecond, vipconfig, cb) {
    var now = Date.now();
    time = time <= 0 ? (now - 1000) : time;
    var msel = now - time;
    var ts = Math.floor(msel / 1000);
    var day = ts / (60 * 60 * 24);
    var exp = 0, gold = 0;
    let earTs = 0;  //收益秒数
    var lucreTime = 0;  //
    if (surLucTime > -1) {
        var zeroHour = utils.getZeroHour(now);  //获取今天的0时
        lucreTime = now - zeroHour;    //今天的收益时间
        if (lucreTime > surLucTime) {
            lucreTime = surLucTime;
        }
        day = (Math.ceil(day) - 1);
        day = day < 0 ? 0 : day;

        earTs = (day * PdMaxLucreTime + lucreTime) / 1000;
        exp = expsecond * earTs;
        gold = goldsecond * earTs;
    }
    else {
        earTs = ts;
        if (day < 3) {
            exp = expsecond * ts;
            gold = goldsecond * ts;
            logger.debug('add for 3day exp:%d, gold:%d.', exp, gold);
        } else if (day < 7) {
            exp = (259200 * expsecond) + (ts - 259200) * expsecond * 0.5;
            gold = (259200 * goldsecond) + (ts - 259200) * goldsecond * 0.5;
            logger.debug('add for 7day exp:%d, gold:%d.', exp, gold);

        } else if (day < 28) {
            exp = (259200 * expsecond) + (345600 * expsecond * 0.5) + (ts - 604800) * expsecond * 0.2;
            gold = (259200 * goldsecond) + (345600 * goldsecond * 0.5) + (ts - 604800) * goldsecond * 0.2;

            logger.debug('add for 28day exp:%d, gold:%d.', exp, gold);

        } else {
            //not
            earTs = 0;
        }
    }

    exp = Math.floor((exp > 0 ? exp : 0) * vipconfig.exp);
    gold = Math.floor((gold > 0 ? gold : 0) * vipconfig.gold);

    if (cb && typeof cb === 'function') {
        cb(exp, gold, lucreTime, earTs);
    } else {
        return { exp: exp, gold: gold, lucreTime: earTs, earTs };
    }
};

/**
 * 体力的自动恢复
 */
formula.settleRecoverEnergy = function (time, pretime, enegry, cb) {
    var inc = 0;
    pretime = pretime || 0;
    var interval = ConfigCache.getVar.const(consts.Keys.ENERGY_INTERVAL);
    var max = ConfigCache.getVar.const(consts.Keys.ENERGY_MAX);

    if (enegry < max && time > 0 && pretime > 0) {
        var ts = Math.floor((time - pretime) / 1000);
        inc = Math.floor(ts / interval);
        inc = Math.min(inc, max - enegry);
    }

    if (cb) {
        cb(inc);
    }
};

/**
 * 仙豆的自动恢复
 */
formula.settleRecoverBean = function (time, pretime, bean, cb) {
    var inc = 0;
    pretime = pretime || 0;
    var interval = ConfigCache.getVar.const(consts.Keys.BEAN_INTERVAL);
    var max = ConfigCache.getVar.const(consts.Keys.BEAN_MAX);

    if (bean < max && time > 0 && pretime > 0) {
        var ts = Math.floor((time - pretime) / 1000);
        inc = Math.floor(ts / interval);
        inc = Math.min(inc, max - bean);
    }

    if (cb) {
        cb(inc);
    }
};

/**
 * 是否命中
 */
formula.isHit = function (rate) {
    return Math.random() < rate;
};

/**
 * 从配置字典中按权重随机命中一个项并返回此项.
 * 
 * @param {Map} data dict object, and include {weight:0.1}
 * @param {Function} filter filter callback.
 * @param {bool} isadjust 是否重新调整比率
 * @return {object} hit item
 */
formula.hitOneFromDict = function (data, filter, isadjust) {
    var pair;
    var weight = 0;
    var preWeight = 0;
    var res = null;
    var cb = null;
    if (filter && 'function' === typeof filter) {
        cb = filter;
    }
    var allowArr = [];
    var total = 0;

    //要求所有权重加总后为1
    for (var key in data) {
        pair = data[key];
        if (cb && !cb(pair)) continue;

        total += pair.weight || 0;
        allowArr.push(pair);
    }
    var curr;
    //
    if (isadjust || total >= 1 || Math.random() < total) {
        curr = Math.random();
        //所有权重加总后为1,若大于1不会被命中
        for (var i = 0; i < allowArr.length; i++) {
            pair = allowArr[i];
            preWeight = weight;
            weight += (pair.weight || 0) / total;
            if (curr < weight && curr >= preWeight) {
                //命中
                res = pair;
                break;
            }
        }

        //最后一次没有命中,取最后一个
        if (!res) {
            res = pair;
        }
    }
    return res;
};

/**
 * 是否命中
 * @param {array} arr include {weight:0.1}
 * @param {function} filter
 * @param {bool} isadjust 是否重新调整比率
 */
formula.hitOneFromArray = function (arr, filter, isadjust) {
    isadjust = isadjust || false;
    var pair;
    var weight = 0;
    var preWeight = 0;
    var res = null;
    var cb = null;
    if (filter && 'function' === typeof filter) {
        cb = filter;
    }
    var allowArr = [];
    var total = 0;
    arr.forEach(function (el) {
        if (cb && !cb(el)) return;
        total += ((el.weight || el.__cfg.weight) || 0); //技能权重在__cfg字段中
        allowArr.push(el);
    });

    var curr;
    //
    if (isadjust || total >= 1 || Math.random() < total) {
        curr = Math.random();
        //所有权重加总后为1,若大于1不会被命中
        for (var i = 0; i < allowArr.length; i++) {
            pair = allowArr[i];
            preWeight = weight;
            weight += ((pair.weight || pair.__cfg.weight) || 0) / total;
            if (curr < weight && curr >= preWeight) {
                //命中
                res = pair;
                console.log('hit id:%d', (pair.id || 0));
                break;
            }
        }

        //最后一次没有命中,取最后一个
        if (!res) {
            res = pair;
        }
    }
    return res;
};

/**
 * 计算式神战斗力和被动技能属性
 * @return {number} combat power
 */
formula.settleHeroCombatPower = function (heros, lineups, illustrateds, lifeLikeProbs, illAch, cb) {
    /**
     * 式神战斗力=攻击力*常数1+血量*常数2+命中*常数3+闪避*常数4+先攻*常数5+式神品质*常数6
     *          +式神星级*常数7+式神进化等级*常数8+式神宝具强化等级*常数9+图鉴战力；
    团队战斗力=各式神战斗力之和
    其中：常数1=10、常数2=1、常数3=1、常数4=1、常数5=1、
          常数6=10、常数7=2、常数8=5、常数9=1。（暂定）    
     */

    var r1 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_1);
    var r2 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_2);
    var r3 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_3);
    var r4 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_4);
    var r5 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_5);
    var r6 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_6);
    var r7 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_7);
    var r8 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_8);
    var r9 = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_9);
    var power = 0, attack = 0, hp = 0, hit = 0, dodge = 0, speed = 0;
    var cfg, skill;
    var res = {
        power: 0,
        attack: 0,
        hp: 0,
        hit: 0,
        dodge: 0,
        speed: 0,
        skill: [],
        hero: []
    };

    heros.forEach(function (hero) {
        if (hero.pos <= 0) return;

        var heroId = hero.heroId;
        cfg = ConfigCache.get.character(heroId) || ConfigCache.get.hero(heroId);
        var lineup = getLineup(lineups, hero.pos);
        if (!cfg || !lineup) return;

        //进化等级+1=技能等级
        var cfgLv = lineup.skillLv + 1;
        skill = ConfigCache.get.skill(cfg.skillId, cfgLv);
        if (!skill) return;

        var lv = lineup.lv;
        res.skill.push({
            id: skill.skillId,
            lv: lineup.skillLv,
            pos: hero.pos || 1,
            stateNum: skill.stateNum,
            stateRound: skill.stateRound
        });
        res.hero.push({
            pos: hero.pos || 1,
            id: heroId
        });

        attack = getHeroProperty(cfg.attack,
            lv,
            cfg.heroAttack,
            lineup.propLv,
            cfg.propAttack,
            getHeroPassiveSkill(skill, consts.Enums.SkillType.IncAttack)
        );
        hp = getHeroProperty(cfg.hp,
            lv,
            cfg.heroHp,
            lineup.propLv,
            cfg.propHp,
            getHeroPassiveSkill(skill, consts.Enums.SkillType.IncHit)
        );
        hit = getHeroProperty(cfg.hit,
            lv,
            cfg.heroHit,
            lineup.propLv,
            cfg.propHit,
            getHeroPassiveSkill(skill, consts.Enums.SkillType.IncHit)
        );
        dodge = getHeroProperty(cfg.dodge,
            lv,
            cfg.heroDodge,
            lineup.propLv,
            cfg.propDodge,
            getHeroPassiveSkill(skill, consts.Enums.SkillType.IncDodge)
        );
        speed = getHeroProperty(cfg.speed,
            lv,
            cfg.heroSpeed,
            lineup.propLv,
            cfg.propSpeed,
            getHeroPassiveSkill(skill, consts.Enums.SkillType.IncSpeed)
        );

        res.attack += attack;
        res.hp += hp;
        res.hit += hit;
        res.dodge += dodge;
        res.speed += speed;

        power += attack * r1;
        power += hp * r2;
        power += hit * r3;
        power += speed * r4;//先攻
        power += dodge * r5;

        power += cfg.quality * r6;
        power += lineup.starLv * r7;
        power += lineup.skillLv * r8;
        power += lineup.propLv * r9;

        //每个式神战斗力取整后相加(匹配客户端展示每只式神的战斗力总和)
        power = Math.floor(power);
    }, this);

    if (!!illustrateds) {
        let illPower = illustrateds.sum((t) => {
            let heroCfg = ConfigCache.get.hero(t.heroId);
            if (!!heroCfg) {
                return (ConfigCache.get.illustrated(heroCfg.quality) || {}).power || 0;
            }
            else {
                return 0;
            }
        });

        power += illPower;
    }

    if(!!lifeLikeProbs){
        res.attack += lifeLikeProbs.attack;
        power += lifeLikeProbs.attack * r1;
        res.hp += lifeLikeProbs.hp;
        power += lifeLikeProbs.hp * r2;
        res.hit += lifeLikeProbs.hit;
        power += lifeLikeProbs.hit * r3;
        res.dodge += lifeLikeProbs.dodge;
        power += lifeLikeProbs.dodge * r5;
        res.speed += lifeLikeProbs.speed;
        power += lifeLikeProbs.speed * r4;
    }
    if (!!illAch) {
        illAch.forEach(el => {
            let tmpSkillId = ConfigCache.get.illAch(el.achId).skillId;
            let tmpSkillLv = ConfigCache.get.illAch(el.achId).skillLv;
            let passiveSkill = ConfigCache.get.skill(tmpSkillId, tmpSkillLv);
            if(passiveSkill.passive)
            {
                switch (passiveSkill.effectType)
                {
                    case consts.Enums.SkillType.IncAttack:  //攻击
                        res.attack += passiveSkill.effectNum;
                        power += passiveSkill.effectNum * r1;
                        break;
                    case consts.Enums.SkillType.IncPH:  //HP
                        res.hp += passiveSkill.effectNum;
                        power += passiveSkill.effectNum * r2;
                        break;
                    case consts.Enums.SkillType.IncHit:  //命中
                        res.hit += passiveSkill.effectNum;
                        power += passiveSkill.effectNum * r3;
                        break;
                    case consts.Enums.SkillType.IncDodge:  //闪避
                        res.dodge += passiveSkill.effectNum;
                        power += passiveSkill.effectNum * r5;
                        break;
                    case consts.Enums.SkillType.IncSpeed:  //先攻
                        res.speed += passiveSkill.effectNum;
                        power += passiveSkill.effectNum * r4;
                        break;
                    default:
                        break;
                }
            }
        });
    }
    
    res.power = power;
    if (cb && 'function' === typeof cb) {
        cb(res);
        return;
    }

    return power;
};

/**
 * 计算基础攻击伤害
 * 
 * @return {Number} 返回伤害
 */
formula.settleHarmAttack = function (battle, atk, skill, def) {
    var self = this;
    //基础伤害=攻击方攻击力属性*战斗力压制系数*技能伤害加成比例
    var rete = 1;
    if (atk.power > def.power) {
        //战斗力压制
        rete = Math.min(atk.power / def.power, battle.powerIncRate);
    } else {

        rete = Math.max(atk.power / def.power, battle.powerDecRate);
    }
    var dhp = def.hp;
    var percent = 1;
    var harm = 0;
    if (skill) {
        switch (skill.__cfg.effectType) {
            //攻击方的技能伤害加成
            case consts.Enums.SkillType.DamageRate:
                percent = skill.__cfg.effectNum;
                break;
            case consts.Enums.SkillType.DamageEnemyHPOfCurrent:
                harm = dhp * skill.__cfg.effectNum;
                break;
            //其它忽略攻击后的技能
            case consts.Enums.SkillType.ReSelfHP:
            case consts.Enums.SkillType.ReSelfHPOfCurrent:
            case consts.Enums.SkillType.ReEnemyHP:
            case consts.Enums.SkillType.ReEnemyHPOfCurrent:
                break;
            default:
                break;
        }
    }
    var res = atk.attack * rete * percent;
    //直接伤害优先
    return harm > 0 ? harm : res;
};

/**
 * 计算防守后的最终伤害
 */
formula.settleHarmDefense = function (harm, state, def) {
    //最终伤害=Min[基础伤害*（1-受击方伤害减免比例），受击方剩余血量]
    var percent = state && state.num ? state.num : 0;
    harm = Math.floor(harm * (1 - percent));
    harm = Math.min(harm, def.hp);
    return harm;
};

/**
 * 计算意单项属性
 * 
 * @param {Number} base 初始基础值
 * @param {Number} lv1 式神等级
 * @param {Number} inc1 式神增加属性
 * @param {Number} lv2 宝具等级
 * @param {Number} inc2 宝具增加属性
 * @param {Number} attach 被动技能
 */
var getHeroProperty = function (base, lv1, inc1, lv2, inc2, attach) {
    return base + lv1 * inc1 + lv2 * inc2 + attach;
};

/**
 * 计算被动技能
 * 
 * @param {} skill 技能配置
 */
var getHeroPassiveSkill = function (skill, type) {
    if (!skill || !skill.passive) return 0;

    return skill.effectType === type ? skill.effectNum : 0;
};

/**
 * 根据阵位编号,获取阵位信息
 * @param {*} lineups 
 * @param {*} pos 
 */
var getLineup = function (lineups, pos) {
    var lineup;
    lineups.forEach(function (el) {
        if (el.pos === pos) {
            lineup = el;
            return;
        }
    });
    return lineup;
}

/**
 * 获取掉落福袋的数量
 * @param {Number} ts 挂机时间
 * @param {Object} checkpoint 关卡配置
 */
formula.getDropItemNum = function (ts, checkpoint) {
    let dropNum = 0;
    let maxDropNum = Math.ceil(ts / checkpoint.dropCd);
    let percent = checkpoint.dropPercent / 10000;

    for (let i = 0; i < maxDropNum; i++) {
        if (formula.isHit(percent)) {
            dropNum++;
        }
    }

    return dropNum;
}

/**
 * 获取离线掉落福袋的数量
 * @param {*} ts 挂机时间(单位:秒)
 * @param {*} checkpoint 关卡配置
 */
formula.getOfflineDropItemNum = function (ts, checkpoint) {
    let hour = ConfigCache.getVar.const(consts.Keys.OFFLINE_DROP_HOUR);
    let times = ConfigCache.getVar.const(consts.Keys.OFFLINE_DROP_TIMES);
    let maxSec = hour * 3600;
    ts = maxSec > ts ? ts : maxSec;
    let dropNum = Math.ceil(ts / checkpoint.dropCd * times);
    return dropNum;
}
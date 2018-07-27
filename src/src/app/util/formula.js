Object.defineProperty(exports, "__esModule", { value: true });
const consts = require("./consts");
const ConfigCache = require("../cache/ConfigCache");
const logger_1 = require("./logger");
const Utils = require("./Utils");
class Formula {
    constructor() {
    }
    static getMaxLucreTime(player, now, callback = null, context = null) {
        let maxLucreTime = Formula.PdMaxLucreTime;
        let ctime = Utils.default.getZeroHour(player.createTime) + (31 * 24 * 1000 * 60 * 60);
        if (!player.isAdult && now >= ctime) {
            if (Utils.default.isSameDate(player.lucreUpTime, now)) {
                maxLucreTime = maxLucreTime - player.lucreTime;
                maxLucreTime = maxLucreTime > 0 ? maxLucreTime : 0;
            }
        }
        else {
            maxLucreTime = -1;
        }
        if (callback && context) {
            callback.call(context, maxLucreTime);
        }
        else {
            return { maxLucreTime: maxLucreTime };
        }
    }
    static settleOnlineBoss(time1, time2, maxLucreTime, expsecond, goldsecond, vipconfig, callback = null, context = null) {
        let exp = 0;
        let gold = 0;
        let msel = 0;
        let astrict = maxLucreTime > -1;
        if (time1 > 0 && time2 > 0) {
            msel = time1 - time2;
            if (astrict) {
                if (msel > maxLucreTime) {
                    msel = maxLucreTime;
                }
            }
            let ts = Math.floor(msel / 1000);
            exp = Math.floor(expsecond * ts * vipconfig.exp);
            gold = Math.floor(goldsecond * ts * vipconfig.gold);
        }
        if (callback && context) {
            callback.call(context, exp, gold, msel);
        }
        else {
            return { exp: exp, gold: gold, msel: msel };
        }
    }
    static settleOfflineBoss(time, surLucTime, expsecond, goldsecond, vipconfig, callback = null, context = null) {
        let now = Date.now();
        time = time <= 0 ? (now - 1000) : time;
        let msel = now - time;
        let ts = Math.floor(msel / 1000);
        let day = ts / (60 * 60 * 24);
        let exp = 0, gold = 0;
        let earTs = 0;
        let lucreTime = 0;
        if (surLucTime > -1) {
            let zeroHour = Utils.default.getZeroHour(now);
            lucreTime = now - zeroHour;
            if (lucreTime > surLucTime) {
                lucreTime = surLucTime;
            }
            day = (Math.ceil(day) - 1);
            day = day < 0 ? 0 : day;
            earTs = (day * Formula.PdMaxLucreTime + lucreTime) / 1000;
            exp = expsecond * earTs;
            gold = goldsecond * earTs;
        }
        else {
            earTs = ts;
            if (day < 3) {
                exp = expsecond * ts;
                gold = goldsecond * ts;
                logger_1.default.debug('add for 3day exp:%d, gold:%d.', exp, gold);
            }
            else if (day < 7) {
                exp = (259200 * expsecond) + (ts - 259200) * expsecond * 0.5;
                gold = (259200 * goldsecond) + (ts - 259200) * goldsecond * 0.5;
                logger_1.default.debug('add for 7day exp:%d, gold:%d.', exp, gold);
            }
            else if (day < 28) {
                exp = (259200 * expsecond) + (345600 * expsecond * 0.5) + (ts - 604800) * expsecond * 0.2;
                gold = (259200 * goldsecond) + (345600 * goldsecond * 0.5) + (ts - 604800) * goldsecond * 0.2;
                logger_1.default.debug('add for 28day exp:%d, gold:%d.', exp, gold);
            }
            else {
                earTs = 0;
            }
        }
        exp = Math.floor((exp > 0 ? exp : 0) * vipconfig.exp);
        gold = Math.floor((gold > 0 ? gold : 0) * vipconfig.gold);
        if (callback && context) {
            callback.call(context, exp, gold, lucreTime, earTs);
        }
        else {
            return { exp: exp, gold: gold, lucreTime: earTs, earTs };
        }
    }
    static settleRecoverEnergy(time, pretime, enegry, callback, context) {
        let inc = 0;
        pretime = pretime || 0;
        let interval = ConfigCache.default.getVarConst(consts.default.consts.Keys.ENERGY_INTERVAL);
        let max = ConfigCache.default.getVarConst(consts.default.consts.Keys.ENERGY_MAX);
        if (enegry < max && time > 0 && pretime > 0) {
            var ts = Math.floor((time - pretime) / 1000);
            inc = Math.floor(ts / interval);
            inc = Math.min(inc, max - enegry);
        }
        if (callback && context) {
            callback.call(context, inc);
        }
    }
    static isHit(rate) {
        return Math.random() < rate;
    }
    static hitOneFromDict(data, filter = null, isadjust = false) {
        let pair;
        let weight = 0;
        let preWeight = 0;
        let res = null;
        let callback = null;
        if (filter && 'function' === typeof filter) {
            callback = filter;
        }
        let allowArr = [];
        let total = 0;
        for (let key in data) {
            pair = data[key];
            if (callback && !callback(pair))
                continue;
            total += pair.weight || 0;
            allowArr.push(pair);
        }
        let curr;
        if (isadjust || total >= 1 || Math.random() < total) {
            curr = Math.random();
            for (let i = 0; i < allowArr.length; i++) {
                pair = allowArr[i];
                preWeight = weight;
                weight += (pair.weight || 0) / total;
                if (curr < weight && curr >= preWeight) {
                    res = pair;
                    break;
                }
            }
            if (!res) {
                res = pair;
            }
        }
        return res;
    }
    static hitOneFromArray(arr, filter = null, isadjust = false) {
        isadjust = isadjust || false;
        let pair;
        let weight = 0;
        let preWeight = 0;
        let res = null;
        let callback = null;
        if (filter && 'function' === typeof filter) {
            callback = filter;
        }
        let allowArr = [];
        let total = 0;
        arr.forEach((el) => {
            if (callback && !callback(el))
                return;
            total += ((el.weight || el.__cfg.weight) || 0);
            allowArr.push(el);
        });
        let curr;
        if (isadjust || total >= 1 || Math.random() < total) {
            curr = Math.random();
            for (let i = 0; i < allowArr.length; i++) {
                pair = allowArr[i];
                preWeight = weight;
                weight += ((pair.weight || pair.__cfg.weight) || 0) / total;
                if (curr < weight && curr >= preWeight) {
                    res = pair;
                    console.log('hit id:%d', (pair.id || 0));
                    break;
                }
            }
            if (!res) {
                res = pair;
            }
        }
        return res;
    }
    static settleHeroCombatPower(heros, lineups, illustrateds, lifeLikeProbs, illAch, callback = null, context = null) {
        let r1 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_1);
        let r2 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_2);
        let r3 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_3);
        let r4 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_4);
        let r5 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_5);
        let r6 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_6);
        let r7 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_7);
        let r8 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_8);
        let r9 = ConfigCache.default.getVarConst(consts.default.consts.Keys.COMBAT_POWER_9);
        let power = 0, attack = 0, hp = 0, hit = 0, dodge = 0, speed = 0;
        let cfg, skill;
        let res = {
            power: 0,
            attack: 0,
            hp: 0,
            hit: 0,
            dodge: 0,
            speed: 0,
            skill: [],
            hero: []
        };
        heros.forEach((hero) => {
            if (hero.pos <= 0)
                return;
            let heroId = hero.heroId;
            cfg = ConfigCache.default.getCharacter(heroId) || ConfigCache.default.getHero(heroId);
            let lineup = this.getLineup(lineups, hero.pos);
            if (!cfg || !lineup)
                return;
            let cfgLv = lineup.skillLv + 1;
            skill = ConfigCache.default.getSkill(cfg.skillId, cfgLv);
            if (!skill) {
                return;
            }
            let lv = lineup.lv;
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
            attack = this.getHeroProperty(cfg.attack, lv, cfg.heroAttack, lineup.propLv, cfg.propAttack, this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncAttack));
            hp = this.getHeroProperty(cfg.hp, lv, cfg.heroHp, lineup.propLv, cfg.propHp, this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncHit));
            hit = this.getHeroProperty(cfg.hit, lv, cfg.heroHit, lineup.propLv, cfg.propHit, this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncHit));
            dodge = this.getHeroProperty(cfg.dodge, lv, cfg.heroDodge, lineup.propLv, cfg.propDodge, this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncDodge));
            speed = this.getHeroProperty(cfg.speed, lv, cfg.heroSpeed, lineup.propLv, cfg.propSpeed, this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncSpeed));
            res.attack += attack;
            res.hp += hp;
            res.hit += hit;
            res.dodge += dodge;
            res.speed += speed;
            power += attack * r1;
            power += hp * r2;
            power += hit * r3;
            power += speed * r4;
            power += dodge * r5;
            power += cfg.quality * r6;
            power += lineup.starLv * r7;
            power += lineup.skillLv * r8;
            power += lineup.propLv * r9;
            power = Math.floor(power);
        }, this);
        if (!!illustrateds) {
            let illPower = illustrateds.sum((t) => {
                let heroCfg = ConfigCache.default.getHero(t.heroId);
                if (!!heroCfg) {
                    return (ConfigCache.default.getIllustrated(heroCfg.quality) || {}).power || 0;
                }
                else {
                    return 0;
                }
            });
            power += illPower;
        }
        if (!!lifeLikeProbs) {
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
            illAch.forEach((el) => {
                let tmpSkillId = ConfigCache.default.getIllAch(el.achId).skillId;
                let tmpSkillLv = ConfigCache.default.getIllAch(el.achId).skillLv;
                let passiveSkill = ConfigCache.default.getSkill(tmpSkillId, tmpSkillLv);
                if (passiveSkill.passive) {
                    switch (passiveSkill.effectType) {
                        case consts.default.consts.Enums.SkillType.IncAttack:
                            res.attack += passiveSkill.effectNum;
                            power += passiveSkill.effectNum * r1;
                            break;
                        case consts.default.consts.Enums.SkillType.IncPH:
                            res.hp += passiveSkill.effectNum;
                            power += passiveSkill.effectNum * r2;
                            break;
                        case consts.default.consts.Enums.SkillType.IncHit:
                            res.hit += passiveSkill.effectNum;
                            power += passiveSkill.effectNum * r3;
                            break;
                        case consts.default.consts.Enums.SkillType.IncDodge:
                            res.dodge += passiveSkill.effectNum;
                            power += passiveSkill.effectNum * r5;
                            break;
                        case consts.default.consts.Enums.SkillType.IncSpeed:
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
        if (callback && context) {
            callback.call(context, res);
            return null;
        }
        return power;
    }
    static getLineup(lineups, pos) {
        let lineup;
        lineups.forEach((el) => {
            if (el.pos === pos) {
                lineup = el;
                return;
            }
        });
        return lineup;
    }
    static settleHarmAttack(battle, atk, skill, def) {
        let rete = 1;
        if (atk.power > def.power) {
            rete = Math.min(atk.power / def.power, battle.powerIncRate);
        }
        else {
            rete = Math.max(atk.power / def.power, battle.powerDecRate);
        }
        let dhp = def.hp;
        let percent = 1;
        let harm = 0;
        if (skill) {
            switch (skill.__cfg.effectType) {
                case consts.default.consts.Enums.SkillType.DamageRate:
                    percent = skill.__cfg.effectNum;
                    break;
                case consts.default.consts.Enums.SkillType.DamageEnemyHPOfCurrent:
                    harm = dhp * skill.__cfg.effectNum;
                    break;
                case consts.default.consts.Enums.SkillType.ReSelfHP:
                case consts.default.consts.Enums.SkillType.ReSelfHPOfCurrent:
                case consts.default.consts.Enums.SkillType.ReEnemyHP:
                case consts.default.consts.Enums.SkillType.ReEnemyHPOfCurrent:
                    break;
                default:
                    break;
            }
        }
        let res = atk.attack * rete * percent;
        return harm > 0 ? harm : res;
    }
    static settleHarmDefense(harm, state, def) {
        var percent = state && state.num ? state.num : 0;
        harm = Math.floor(harm * (1 - percent));
        harm = Math.min(harm, def.hp);
        return harm;
    }
    static getHeroProperty(base, lv1, inc1, lv2, inc2, attach) {
        return base + lv1 * inc1 + lv2 * inc2 + attach;
    }
    static getHeroPassiveSkill(skill, type) {
        if (!skill || !skill.passive) {
            return 0;
        }
        return skill.effectType === type ? skill.effectNum : 0;
    }
    static getDropItemNum(ts, checkpoint) {
        let dropNum = 0;
        let maxDropNum = Math.ceil(ts / checkpoint.dropCd);
        let percent = checkpoint.dropPercent / 10000;
        for (let i = 0; i < maxDropNum; i++) {
            if (this.isHit(percent)) {
                dropNum++;
            }
        }
        return dropNum;
    }
    static getOfflineDropItemNum(ts, checkpoint) {
        let hour = ConfigCache.default.getVarConst(consts.default.consts.Keys.OFFLINE_DROP_HOUR);
        let times = ConfigCache.default.getVarConst(consts.default.consts.Keys.OFFLINE_DROP_TIMES);
        let maxSec = hour * 3600;
        ts = maxSec > ts ? ts : maxSec;
        let dropNum = Math.ceil(ts / checkpoint.dropCd * times);
        return dropNum;
    }
}
Formula.PdMaxLucreTime = 1000 * 60 * 10;
exports.default = Formula;

import consts = require('./consts');
import ConfigCache = require('../cache/ConfigCache');
import logger from './logger';
import Utils = require('./Utils');

/**
 * 格式化工具
 * @author Andrew_Huang
 * @export
 * @class Formula
 */
export class Formula
{
    public static PdMaxLucreTime: number = 1000 * 60 * 10; //每天最大收益时间10分钟
    private _utils: Utils.Utils;
    private _configCache: ConfigCache.ConfigCache; //配置数据缓存库

    public constructor()
    {
        this._utils = Utils.Utils.getInstance();
        this._configCache = ConfigCache.ConfigCache.getInstance();
    }

    public static instance: Formula;
    public static getInstance(): Formula
    {
        if (!this.instance)
        {
            this.instance = new Formula();
        }
        return this.instance;
    }

    /**
     * 获取最大收益时间
     * @author Andrew_Huang
     * @param {*} player     玩家数据
     * @param {number} now   当前时间戳
     * @param {Function} [callback=null]
     * @param {Object} [context=null]
     * @returns {*}
     * @memberof Formula
     */
    public getMaxLucreTime(player: any, now: number, callback: Function = null, context: Object = null): any
    {
        let maxLucreTime: number = Formula.PdMaxLucreTime;
        //判断创建账号是否超过3 0天,判断是否成年
        let ctime: number = this._utils.getZeroHour(player.createTime) + (31 * 24 * 1000 * 60 * 60);
        if (!player.isAdult && now >= ctime)
        {
            //今天是否计算过收益
            if (this._utils.isSameDate(player.lucreUpTime, now))
            {
                //最大收益时间-今日收益时间
                maxLucreTime = maxLucreTime - player.lucreTime;
                maxLucreTime = maxLucreTime > 0 ? maxLucreTime : 0;
            }
        } else
        {
            //没有防沉迷限制
            maxLucreTime = -1;
        }
        if (callback && context)
        {
            callback.call(context, maxLucreTime);
        } else
        {
            return { maxLucreTime: maxLucreTime };
        }
    }

    /**
     * 在线挂机收益
     * @author Andrew_Huang
     * @param {number} time1         当前时间
     * @param {number} time2         上次收益结算时间
     * @param {number} maxLucreTime  最大收益时间，-1:无收益限制
     * @param {number} expsecond     经验收益秒数
     * @param {number} goldsecond    金币收益秒数
     * @param {*} vipconfig          VIP配置数据
     * @param {Function} [callback=null]
     * @param {Object} [context=null]  exp:收益的经验 gold:收益的金币 ts:本次收益时间
     * @returns {*}
     * @memberof Formula
     */
    public settleOnlineBoss(time1: number, time2: number, maxLucreTime: number, expsecond: number, goldsecond: number, vipconfig: any, callback: Function = null, context: Object = null): any
    {
        let exp = 0;
        let gold = 0;
        let msel = 0;
        let astrict: boolean = maxLucreTime > -1;    //是否有收益限制
        if (time1 > 0 && time2 > 0)
        {
            msel = time1 - time2;
            if (astrict)
            {
                //有收益限制
                if (msel > maxLucreTime)
                {
                    msel = maxLucreTime;
                }
            }
            let ts = Math.floor(msel / 1000);
            exp = Math.floor(expsecond * ts * vipconfig.exp);
            gold = Math.floor(goldsecond * ts * vipconfig.gold);
        }
        if (callback && context)
        {
            callback.call(context, exp, gold, msel);
        } else
        {
            return { exp: exp, gold: gold, msel: msel };
        }
    }

    /**
     * 离线挂机收益
     * @author Andrew_Huang
     * @param {number} time        离线时间
     * @param {number} surLucTime  今天剩余最大收益时间,-1:无收益限制
     * @param {number} expsecond   经验收益秒数
     * @param {number} goldsecond  金币收益秒数
     * @param {*} vipconfig        VIP配置数据
     * @param {Function} callback
     * @param {Objetc} context
     * @returns {*}
     * @memberof Formula
     */
    public settleOfflineBoss(time: number, surLucTime: number, expsecond: number, goldsecond: number, vipconfig: any, callback: Function = null, context: Object = null): any
    {
        let now = Date.now();
        time = time <= 0 ? (now - 1000) : time;
        let msel = now - time;
        let ts = Math.floor(msel / 1000);
        let day = ts / (60 * 60 * 24);
        let exp = 0, gold = 0;
        let earTs = 0;  //收益秒数
        let lucreTime = 0;
        if (surLucTime > -1)
        {
            let zeroHour = this._utils.getZeroHour(now);  //获取今天的0时
            lucreTime = now - zeroHour;    //今天的收益时间
            if (lucreTime > surLucTime)
            {
                lucreTime = surLucTime;
            }
            day = (Math.ceil(day) - 1);
            day = day < 0 ? 0 : day;
            earTs = (day * Formula.PdMaxLucreTime + lucreTime) / 1000;
            exp = expsecond * earTs;
            gold = goldsecond * earTs;
        }
        else
        {
            earTs = ts;
            if (day < 3)
            {
                exp = expsecond * ts;
                gold = goldsecond * ts;
                logger.debug('add for 3day exp:%d, gold:%d.', exp, gold);
            } else if (day < 7)
            {
                exp = (259200 * expsecond) + (ts - 259200) * expsecond * 0.5;
                gold = (259200 * goldsecond) + (ts - 259200) * goldsecond * 0.5;
                logger.debug('add for 7day exp:%d, gold:%d.', exp, gold);

            } else if (day < 28)
            {
                exp = (259200 * expsecond) + (345600 * expsecond * 0.5) + (ts - 604800) * expsecond * 0.2;
                gold = (259200 * goldsecond) + (345600 * goldsecond * 0.5) + (ts - 604800) * goldsecond * 0.2;

                logger.debug('add for 28day exp:%d, gold:%d.', exp, gold);

            } else
            {
                earTs = 0;
            }
        }
        exp = Math.floor((exp > 0 ? exp : 0) * vipconfig.exp);
        gold = Math.floor((gold > 0 ? gold : 0) * vipconfig.gold);
        if (callback && context)
        {
            callback.call(context, exp, gold, lucreTime, earTs);
        } else
        {
            return { exp: exp, gold: gold, lucreTime: earTs, earTs };
        }
    }

    /**
     * 体力的自动恢复
     * @author Andrew_Huang
     * @param {number} time
     * @param {number} pretime
     * @param {number} enegry
     * @param {Function} callback
     * @param {Object} context
     * @memberof Formula
     */
    public settleRecoverEnergy(time: number, pretime: number, enegry: number, callback: Function, context: Object): void
    {
        let inc = 0;
        pretime = pretime || 0;
        let interval = this._configCache.getVarConst(consts.default.consts.Keys.ENERGY_INTERVAL);
        let max = this._configCache.getVarConst(consts.default.consts.Keys.ENERGY_MAX);
        if (enegry < max && time > 0 && pretime > 0)
        {
            var ts = Math.floor((time - pretime) / 1000);
            inc = Math.floor(ts / interval);
            inc = Math.min(inc, max - enegry);
        }
        if (callback && context)
        {
            callback.call(context, inc);
        }
    }

    /**
     * 是否命中
     * @author Andrew_Huang
     * @param {number} rate
     * @returns {boolean}
     * @memberof Formula
     */
    public isHit(rate: number): boolean
    {
        return Math.random() < rate;
    }

    /**
     * 从配置字典中按权重随机命中一个项并返回此项
     * @author Andrew_Huang
     * @param {*} data            数据字典
     * @param {Function} filter   过滤器回调函数
     * @param {boolean} isadjust  是否重新调整比率
     * @memberof Formula
     */
    public hitOneFromDict(data: any, filter: (item: any) => boolean = null, isadjust: boolean = false): any
    {
        let pair;
        let weight: number = 0;
        let preWeight: number = 0;
        let res = null;
        let callback: Function = null;
        if (filter && 'function' === typeof filter)
        {
            callback = filter;
        }
        let allowArr = [];
        let total: number = 0;
        //要求所有权重加总后为1
        for (let key in data)
        {
            pair = data[key];
            if (callback && !callback(pair)) continue;

            total += pair.weight || 0;
            allowArr.push(pair);
        }
        let curr: number;
        if (isadjust || total >= 1 || Math.random() < total)
        {
            curr = Math.random();
            //所有权重加总后为1,若大于1不会被命中
            for (let i: number = 0; i < allowArr.length; i++)
            {
                pair = allowArr[i];
                preWeight = weight;
                weight += (pair.weight || 0) / total;
                if (curr < weight && curr >= preWeight)
                {
                    //命中
                    res = pair;
                    break;
                }
            }
            //最后一次没有命中,取最后一个
            if (!res)
            {
                res = pair;
            }
        }
        return res;
    }

    /**
     * 是否命中
     * @author Andrew_Huang
     * @param {*} arr
     * @param {(item: any) => boolean} [filter=null]
     * @param {*} isadjust
     * @returns {*}
     * @memberof Formula
     */
    public hitOneFromArray(arr: any, filter: (item: any) => boolean = null, isadjust: boolean = false): any
    {
        isadjust = isadjust || false;
        let pair;
        let weight = 0;
        let preWeight = 0;
        let res = null;
        let callback: Function = null;
        if (filter && 'function' === typeof filter)
        {
            callback = filter;
        }
        let allowArr: any = [];
        let total = 0;
        arr.forEach((el: any) =>
        {
            if (callback && !callback(el)) return;
            total += ((el.weight || el.__cfg.weight) || 0); //技能权重在__cfg字段中
            allowArr.push(el);
        });
        let curr: number;
        if (isadjust || total >= 1 || Math.random() < total)
        {
            curr = Math.random();
            //所有权重加总后为1,若大于1不会被命中
            for (let i: number = 0; i < allowArr.length; i++)
            {
                pair = allowArr[i];
                preWeight = weight;
                weight += ((pair.weight || pair.__cfg.weight) || 0) / total;
                if (curr < weight && curr >= preWeight)
                {
                    //命中
                    res = pair;
                    console.log('hit id:%d', (pair.id || 0));
                    break;
                }
            }
            //最后一次没有命中,取最后一个
            if (!res)
            {
                res = pair;
            }
        }
        return res;
    }

    /**
     * 计算式神战斗力和被动技能属性
     * @author Andrew_Huang
     * @param {*} heros         式神列表
     * @param {*} lineups       上阵式神列表
     * @param {*} illustrateds  成就战力
     * @param {*} lifeLikeProbs 生命参数
     * @param {*} illAch        成就
     * @param {Function} [callback=null]
     * @param {Object} [context=null]
     * @returns {number}
     * @memberof Formula
     */
    public settleHeroCombatPower(heros: any, lineups: any, illustrateds: any, lifeLikeProbs: any, illAch: any, callback: Function = null, context: Object = null): number
    {
        /**
        * 式神战斗力 = 攻击力 * 常数1 + 血量 * 常数2 + 命中 * 常数3 + 闪避 * 常数4 + 先攻 * 常数5 + 式神品质 * 常数6 + 式神星级 * 常数7 + 式神进化等级 * 常数8 + 式神宝具强化等级 * 常数9 + 图鉴战力；
        * 团队战斗力=各式神战斗力之和
        * 其中：常数1=10、常数2=1、常数3=1、常数4=1、常数5=1、常数6=10、常数7=2、常数8=5、常数9=1。（暂定）    
        */

        let r1 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_1);
        let r2 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_2);
        let r3 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_3);
        let r4 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_4);
        let r5 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_5);
        let r6 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_6);
        let r7 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_7);
        let r8 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_8);
        let r9 = this._configCache.getVarConst(consts.default.consts.Keys.COMBAT_POWER_9);
        let power = 0, attack = 0, hp = 0, hit = 0, dodge = 0, speed = 0;
        let cfg, skill;
        let res = {
            power: 0,
            attack: 0,
            hp: 0,
            hit: 0,
            dodge: 0,
            speed: 0,
            skill: <any>[],
            hero: <any>[]
        };

        heros.forEach((hero: any) =>
        {
            if (hero.pos <= 0) return;

            let heroId = hero.heroId;
            cfg = this._configCache.getCharacter(heroId) || this._configCache.getHero(heroId);
            let lineup = this.getLineup(lineups, hero.pos);
            if (!cfg || !lineup) return;

            //进化等级+1=技能等级
            let cfgLv = lineup.skillLv + 1;
            skill = this._configCache.getSkill(cfg.skillId, cfgLv);
            if (!skill) 
            {
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

            attack = this.getHeroProperty(cfg.attack,
                lv,
                cfg.heroAttack,
                lineup.propLv,
                cfg.propAttack,
                this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncAttack)
            );
            hp = this.getHeroProperty(cfg.hp,
                lv,
                cfg.heroHp,
                lineup.propLv,
                cfg.propHp,
                this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncHit)
            );
            hit = this.getHeroProperty(cfg.hit,
                lv,
                cfg.heroHit,
                lineup.propLv,
                cfg.propHit,
                this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncHit)
            );
            dodge = this.getHeroProperty(cfg.dodge,
                lv,
                cfg.heroDodge,
                lineup.propLv,
                cfg.propDodge,
                this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncDodge)
            );
            speed = this.getHeroProperty(cfg.speed,
                lv,
                cfg.heroSpeed,
                lineup.propLv,
                cfg.propSpeed,
                this.getHeroPassiveSkill(skill, consts.default.consts.Enums.SkillType.IncSpeed)
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

        if (!!illustrateds)
        {
            let illPower = illustrateds.sum((t: any) =>
            {
                let heroCfg = this._configCache.getHero(t.heroId);
                if (!!heroCfg)
                {
                    return (this._configCache.getIllustrated(heroCfg.quality) || {}).power || 0;
                }
                else
                {
                    return 0;
                }
            });

            power += illPower;
        }

        if (!!lifeLikeProbs)
        {
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
        if (!!illAch)
        {
            illAch.forEach((el: any) =>
            {
                let tmpSkillId = this._configCache.getIllAch(el.achId).skillId;
                let tmpSkillLv = this._configCache.getIllAch(el.achId).skillLv;
                let passiveSkill = this._configCache.getSkill(tmpSkillId, tmpSkillLv);
                if (passiveSkill.passive)
                {
                    switch (passiveSkill.effectType)
                    {
                        case consts.default.consts.Enums.SkillType.IncAttack:  //攻击
                            res.attack += passiveSkill.effectNum;
                            power += passiveSkill.effectNum * r1;
                            break;
                        case consts.default.consts.Enums.SkillType.IncPH:  //HP
                            res.hp += passiveSkill.effectNum;
                            power += passiveSkill.effectNum * r2;
                            break;
                        case consts.default.consts.Enums.SkillType.IncHit:  //命中
                            res.hit += passiveSkill.effectNum;
                            power += passiveSkill.effectNum * r3;
                            break;
                        case consts.default.consts.Enums.SkillType.IncDodge:  //闪避
                            res.dodge += passiveSkill.effectNum;
                            power += passiveSkill.effectNum * r5;
                            break;
                        case consts.default.consts.Enums.SkillType.IncSpeed:  //先攻
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
        if (callback && context)
        {
            callback.call(context, res);
            return null;
        }
        return power;
    }

    /**
     * 根据阵位编号,获取阵位信息
     * @author Andrew_Huang
     * @param {*} lineups
     * @param {number} pos
     * @returns {*}
     * @memberof Formula
     */
    public getLineup(lineups: any, pos: number): any
    {
        let lineup;
        lineups.forEach((el: any) =>
        {
            if (el.pos === pos)
            {
                lineup = el;
                return;
            }
        });
        return lineup;
    }

    /**
     * 计算基础攻击伤害
     * @author Andrew_Huang
     * @param {*} battle
     * @param {*} atk
     * @param {*} skill
     * @param {*} def
     * @returns {number}
     * @memberof Formula
     */
    public settleHarmAttack(battle: any, atk: any, skill: any, def: any): number
    {
        //基础伤害=攻击方攻击力属性*战斗力压制系数*技能伤害加成比例
        let rete = 1;
        if (atk.power > def.power)
        {
            //战斗力压制
            rete = Math.min(atk.power / def.power, battle.powerIncRate);
        } else
        {

            rete = Math.max(atk.power / def.power, battle.powerDecRate);
        }
        let dhp = def.hp;
        let percent = 1;
        let harm = 0;
        if (skill)
        {
            switch (skill.__cfg.effectType)
            {
                //攻击方的技能伤害加成
                case consts.default.consts.Enums.SkillType.DamageRate:
                    percent = skill.__cfg.effectNum;
                    break;
                case consts.default.consts.Enums.SkillType.DamageEnemyHPOfCurrent:
                    harm = dhp * skill.__cfg.effectNum;
                    break;
                //其它忽略攻击后的技能
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
        //直接伤害优先
        return harm > 0 ? harm : res;
    }

    /**
     * 计算防守后的最终伤害
     * @author Andrew_Huang
     * @param {number} harm
     * @param {*} state
     * @param {*} def
     * @returns {number}
     * @memberof Formula
     */
    public settleHarmDefense(harm: number, state: any, def: any): number
    {
        //最终伤害=Min[基础伤害*（1-受击方伤害减免比例），受击方剩余血量]
        var percent = state && state.num ? state.num : 0;
        harm = Math.floor(harm * (1 - percent));
        harm = Math.min(harm, def.hp);
        return harm;
    }

    /**
     * 计算意单项属性
     * @author Andrew_Huang
     * @param {number} base    初始基础值
     * @param {number} lv1     式神等级
     * @param {number} inc1    式神增加属性
     * @param {number} lv2     宝具等级
     * @param {number} inc2    宝具增加属性
     * @param {number} attach  被动技能
     * @returns {number}
     * @memberof Formula
     */
    public getHeroProperty(base: number, lv1: number, inc1: number, lv2: number, inc2: number, attach: number): number
    {
        return base + lv1 * inc1 + lv2 * inc2 + attach;
    }

    /**
     * 计算被动技能
     * @author Andrew_Huang
     * @param {*} skill   技能配置
     * @param {number} type
     * @returns {number}
     * @memberof Formula
     */
    public getHeroPassiveSkill(skill: any, type: number): number
    {
        if (!skill || !skill.passive) 
        {
            return 0;
        }
        return skill.effectType === type ? skill.effectNum : 0;
    }

    /**
     * 获取掉落福袋的数量
     * @author Andrew_Huang
     * @param {number} ts    挂机时间
     * @param {*} checkpoint 关卡配置
     * @returns {number}
     * @memberof Formula
     */
    public getDropItemNum(ts: number, checkpoint: any): number
    {
        let dropNum = 0;
        let maxDropNum = Math.ceil(ts / checkpoint.dropCd);
        let percent = checkpoint.dropPercent / 10000;
        for (let i: number = 0; i < maxDropNum; i++)
        {
            if (this.isHit(percent))
            {
                dropNum++;
            }
        }
        return dropNum;
    }

    /**
     * 获取离线掉落福袋的数量
     * @author Andrew_Huang
     * @param {number} ts    挂机时间(单位:秒)
     * @param {*} checkpoint 关卡配置
     * @returns {number}
     * @memberof Formula
     */
    public getOfflineDropItemNum(ts: number, checkpoint: any): number
    {
        let hour = this._configCache.getVarConst(consts.default.consts.Keys.OFFLINE_DROP_HOUR);
        let times = this._configCache.getVarConst(consts.default.consts.Keys.OFFLINE_DROP_TIMES);
        let maxSec = hour * 3600;
        ts = maxSec > ts ? ts : maxSec;
        let dropNum = Math.ceil(ts / checkpoint.dropCd * times);
        return dropNum;
    }
}


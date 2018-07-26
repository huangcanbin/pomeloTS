var utils = require('../../../util/utils');
var consts = require('../../../util/consts');
var BattleBuilder = require('../../../cache/battleBuilder');
var Formula = require('../../../util/formula');
var ConfigCache = require('../../../cache/configCache');
var logger = require('pomelo-logger').getLogger('combat-log', __filename);

module.exports = function (app) {
    return new CheckpointRemote();
};

var CheckpointRemote = function () {
  
    var maxRound = ConfigCache.getVar.const(consts.Keys.COMBAT_MAX_ROUND, 15);
    var hitRate = ConfigCache.getVar.const(consts.Keys.COMBAT_HIT_RATE, 0.15);
    var powerIncRate = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_INC, 1.8);
    var powerDecRate = ConfigCache.getVar.const(consts.Keys.COMBAT_POWER_DEC, 0.3);
    
    this.instanceBattle = new Battle(maxRound, hitRate, powerIncRate, powerDecRate, stateCallback);
};

/**
 * 获取技术状态
 * 
 * @param {Number} id 
 */
var stateCallback = function (id) {
    return ConfigCache.get.skillState(id);
};

CheckpointRemote.prototype.execute = function (left, right, cb) {

    if (right && !right.power) {
        //build moster battle
        BattleBuilder.buildMonster(right.tid, function (err, res) {
            if (!!err) {
                logger.error('process checkpoint combat error %s', err.stack);
                right = null;
            } else {
                right = res;
            }
        });
    }
    //战斗记录
    var record = {
        res: false,
        left: {},
        right: {},
        process: []
    };
    if (!right) {
        utils.invokeCallback(cb, 'right of battle is null', record);
        return;
    }

    //战斗数据
    var battle = {
        left: left,
        right: right
    };
    try {
        this.instanceBattle.combat(record, battle);
        utils.invokeCallback(cb, null, record);
    } catch (err) {
        utils.invokeCallback(cb, err, record);
    }
};

/**战斗相关 */

var SkillStatus = {
    /**1-禁言状态 */
    NoSkill: 101,
    /**1-束缚状态 */
    NoAttack: 102,
    /**2-减免X%的伤害 */
    Derate: 201,//
    /**2-无敌状态，免疫攻击 */
    Immune: 202,
    /**3-恢复最终伤害X%的血量 */
    Absorb: 301,//
    /**4-死亡复活并回复X%的血量 */
    Recover: 401,//
    /**4-死亡复活并回复X%的血量 */
    RecoverAll: 402,
};

/**
 * 战斗逻辑类,  只读的变量以'__'开头命名
 * 
 * @param {*} maxRound 最大回合数
 * @param {*} hitRate 命中常量
 * @param {*} stateCallback 获取技能状态数值回调
 */
var Battle = function (maxRound, hitRate, powerIncRate, powerDecRate, stateCallback) {
    this.maxRound = maxRound;
    this.hitRate = hitRate;
    this.powerIncRate = powerIncRate;
    this.powerDecRate = powerDecRate;
    this.__StateCallback = stateCallback;
};

Battle.prototype.combat = function (record, battle) {
    var self = this;
    self.initBattle(battle.left);
    self.initBattle(battle.right);

    self.initRecordBattle(record.left, battle.left);
    self.initRecordBattle(record.right, battle.right);

    self.checkFirstAttack(battle, function (first, second) {
        for (var round = 1; round < self.maxRound + 1; round++) {
            var isover = self.processBattleRound(round, first, second, record);
            if (isover) {
                break;
            }
        }
    });
    self.checkBattleResult(battle, function (res) {
        record.res = res;
    });
};

/**
 * 初始化战斗
 * 
 * @param {*} target 
 */
Battle.prototype.initBattle = function (target) {
    target.state = [];

    //可释放的主动技能列表
    var cfg;
    target.skill.forEach(function (el) {
        //进化等级+1=技能等级
        var cfgLv = el.lv + 1;
        cfg = ConfigCache.get.skill(el.id, cfgLv);
        //附加引用技能属性
        el.__cfg = cfg || {};
        el.stateNum = cfg.stateNum;
        el.stateRound = cfg.stateRound;
    }, this);

};

/**
 * 初始化战斗记录的双方阵容
 * 
 * @param {*} battle 战斗的阵容数据
 * @param {*} source 阵容原始数据
 */
Battle.prototype.initRecordBattle = function (target, source) {
    target.tid = source.tid;
    target.tname = source.tname;
    target.hp = source.hp;
    target.power = source.power;
    target.speed = source.speed;
    target.team = source.hero || []; //怪物为空
};

/**
 * 释放的技能状态
 */
Battle.prototype.releaseBattleStatus = function (skill, cb) {
    var self = this;
    var stateId = skill ? skill.__cfg.stateType : 0;
    var state = null;
    var pair;
    if (stateId > 0 && (pair = self.__StateCallback(stateId))) {
        state = {
            id: pair.id,
            type: pair.type,
            wtype: parseInt(pair.type / 100), //权重类型
            weight: pair.weight || 0,
            num: skill.stateNum,
            round: skill.stateRound /*持续回合*/
        };;
    }

    if (cb) {
        cb(state);
    }
};

/**
 * 确定先攻方
 * 
 * @param {*} battle
 * @param {Function} cb 先攻方回调
 */
Battle.prototype.checkFirstAttack = function (battle, cb) {
    var first, second;
    if (battle.left.speed >= battle.right.speed) {
        first = battle.left;
        second = battle.right;
    } else {
        first = battle.right;
        second = battle.left;
    }
    cb(first, second);
};


/**
 * 检查是否是左边的阵容
 * 
 * @param {*} attack 攻方
 * @param {*} left 左边阵容
 */
Battle.prototype.checkIsLeftBattle = function (attack, left) {
    return attack.tid === left.tid;
};

/**
 * 判断战斗输赢结果
 * 
 * @param {*} battle 
 * @param {*} cb 
 */
Battle.prototype.checkBattleResult = function (battle, cb) {
    var result = battle.right && battle.right.hp === 0;
    cb(result);
};

/**
 * 初始化单次攻击记录
 */
Battle.prototype.initBattleProcess = function (round, attack, left) {
    var self = this;
    return {
        r: round,
        turn: self.checkIsLeftBattle(attack, left) ? 0 : 1,
        skillTarget: self.checkIsLeftBattle(attack, left) ? 1 : 0, //技能施放目标0-left; 1-right
        skill: 0,
        p: 1,       //普通攻击固定位置1
        hp: 0,      //命中伤害扣血
        dhp: 0,     //死亡复活加血量
        ahp: 0,     //攻方加血量
        sta1: 0,    //攻击前的状态ID
        sta2: 0,    //攻击时的状态ID
        sta3: 0,    //受击时的状态ID
        sta4: 0,    //攻击后的状态ID
        sta5: 0,    //死亡的状态ID        
    };
};

/**
 * 处理单个回合
 * 
 * @param {Number} r 当前第几回合
 * @param {*} first 先攻方
 * @param {*} second 后攻方
 * @param {*} record 
 * 
 */
Battle.prototype.processBattleRound = function (round, first, second, record) {
    var self = this;
    var isover = false;
    var process = self.initBattleProcess(round, first, record.left);
    self.processRoundBefore(first);
    self.processRoundBefore(second);

    self.processAttack(round, first, second, process, function (res) {
        record.process.push(process);

        if (res) {
            isover = true;
        } else {
            //对方回击
            process = self.initBattleProcess(round, second, record.left);
            self.processAttack(round, second, first, process, function (res) {
                record.process.push(process);

                if (res) {
                    isover = true;
                }
                //继续下一回合
                self.clearStateBattle(first);
                self.clearStateBattle(second);
            });
        }
    });
    //TODO:DEBUG
    //logger.debug('processBattleRound:%j', process);
    return isover;
};

/**
 * 处理每回合开始前扣除技能状态持续回合数
 */
Battle.prototype.processRoundBefore = function (target) {

    if (!target || !target.state) return;
    target.state.forEach(function (el) {
        if (el) {
            el.round -= 1;
        }
    }, this);
};


/**
 * 清理技能状态回合数为0的
 */
Battle.prototype.clearStateBattle = function (target) {

    if (!target || !target.state) return;

    var el;
    for (var i = 0; i < target.state.length; i++) {
        el = target.state[i];
        if (el && el.round <= 0) {
            delete target.state[i];
        }
    }

}

/**
 * 处理攻击
 * 
 * @param {*} atk 攻击方
 * @param {*} def 防守方
 * @param {*} process 单次花攻击过程
 * @param {*} cb 防守方状态回调，死亡为true
 */
Battle.prototype.processAttack = function (round, atk, def, process, cb) {
    var self = this;
    var res = false;
    //1.触发持续回合的状态生效
    var befor = self.checkAttackBefor(atk);
    if (befor && befor.type === SkillStatus.NoAttack) {
        process.sta1 = befor.id;
        cb(res);
        return;
    }
    //2.触发技能或普通攻击
    var skill = null;
    var isNormal = befor && befor.type === SkillStatus.NoSkill;
    if (!isNormal) {
        skill = self.triggerSkillAttack(atk, round);
    }
    if (skill) {
        //释放技能
        process.skill = skill.id;
        process.p = skill.pos;
        //施放目标 1:对方,2:己方
        process.skillTarget = skill.__cfg.target == 2 ? process.turn : process.turn == 0 ? 1 : 0;
    }

    //3.命中判断
    var harm = 0;
    if ((!!skill && skill.__cfg.target == 2) || self.checkHitAttack(atk, def)) {    //技能释放目标是己方,或者命中
        //技能附加状态在不同的触发点生效
        if (skill) {
            //4.命中，附加攻击时的技能状态
            process.sta2 = self.triggerStateAttack(atk, skill, def);
        }
        //5.计算基础伤害，计算攻击类类型的伤害
        harm = Formula.settleHarmAttack(self, atk, skill, def);

        //6.防守方受击在当前状态池中触发状态生效
        var derate = self.triggerStateDefense(def);

        //7.计算最终伤害
        harm = Formula.settleHarmDefense(harm, derate, def);
        if (derate) {
            process.sta3 = derate.id;
        }

        //8. 触发攻击完成状态生效，以及技能加成
        self.triggerAttackAfter(atk, skill, harm, def, function (inchp, sta) {
            atk.hp += inchp;
            process.ahp = inchp;
            process.sta4 = sta;
        });

        harm = Math.floor(harm);
        //9. 扣除血量，触发死亡状态生效
        def.hp -= harm;
        process.hp = harm;

        if (def.hp <= 0) {
            self.triggerDieState(def, function (inchp, stateId) {
                def.hp += inchp;
                process.dhp = inchp;
                process.sta5 = stateId;
            });
        }        

        //是否死亡，结束回合
        res = def.hp <= 0;
        
        process.atkSurHp = atk.hp;
        process.defSurHp = def.hp;
        process.surHp = atk.hp + def.hp;
    } else {
        //闪避
        process.hp = 0;
    }
    //TODO: DEBUG
    //logger.debug('round:%d atk[%d]->def[%d] harm:%d, skill:%d', round, atk.tid, def.tid, harm, process.skill);
    cb(res);
};

/**
 * 检查攻击前是否有束缚状态
 * 
 * @param {*} atk 
 * @return {Bool} true:不能攻击状态
 */
Battle.prototype.checkAttackBefor = function (atk) {
    var res = false;
    var group = {};
    var pair;
    atk.state.forEach(function (el) {
        pair = group[el.wtype];
        if (!pair || pair.weight < el.weight) {
            group[el.wtype] = el; //覆盖同类型状态且优先级低的
        }
    }, this);

    var type = parseInt(SkillStatus.NoAttack / 100);
    return group[type];
};

/**
 * 触发选择技能
 * 
 * @param {*} atk 
 * @param {number} round 回合数
 * @return {*} return skill, allow null
 */
Battle.prototype.triggerSkillAttack = function (atk, round) {
    var allowSkill = [];

    atk.skill.forEach(function (el) {
        if (el.__cfg.passive) return;

        switch (el.__cfg.precond) {
            case 1: //自己血量低于X%
                if (el.__cfg.precondNum > (el.hp / el.maxhp)) {
                    allowSkill.push(el);
                }
                break;
            case 2: //回合数大于第X回合
                if (el.__cfg.precondNum < round) {
                    allowSkill.push(el);
                }
                break;
            default:
                allowSkill.push(el);
                break;
        }
    }, this);

    return Formula.hitOneFromArray(allowSkill);

};

/**
 * 判断是否命中
 * 
 * @param {*} atk 
 * @param {*} def 
 * @return {bool} 返回是否命中
 */
Battle.prototype.checkHitAttack = function (atk, def) {
    //命中率=常数A+[命中/(命中+闪避)]
    var self = this;
    var rate = self.hitRate + (atk.hit / (atk.hit + def.dodge));
    return Formula.isHit(rate);
};


/**
 * 释放附加攻击时的触发点的技能状态
 * @return {number} 返回技能状态ID
 */
Battle.prototype.triggerStateAttack = function (atk, skill, def) {
    var self = this;
    var stateId = 0;
    self.releaseBattleStatus(skill, function (state) {
        if (state) {
            switch (state.wtype) { //指定攻击时的状态类型
                case parseInt(SkillStatus.NoSkill / 100):
                    def.state.push(state);//释放到对方身上，从下一回合开始
                    stateId = state.id;
                    break;
                case parseInt(SkillStatus.Derate / 100):
                case parseInt(SkillStatus.Recover / 100):
                    atk.state.push(state);//释放到自己身上，从下一回合开始
                    stateId = state.id;
                    break;
                default:
                    break;
            }
        }
    });
    return stateId;
};

/**
 * 防守方受击时触发点生效的技能状态
 * @return {*} 返回技能状态
 */
Battle.prototype.triggerStateDefense = function (def) {
    var res = null;
    var type = parseInt(SkillStatus.Derate / 100);
    def.state.forEach(function (el) {
        if (el.wtype === type) {
            //生效状态权重判断
            res = !res || res.weight < el.weight ? el : res;
        }
    }, this);

    return res;
};

/**
 * 攻击后增加技能加成和触发技能状态
 */
Battle.prototype.triggerAttackAfter = function (atk, skill, harm, def, cb) {
    var self = this;
    var hp = 0;
    var stateId = 0;
    var type = parseInt(SkillStatus.Absorb / 100);

    self.releaseBattleStatus(skill, function (state) {
        if (state) {
            switch (state.wtype) {
                case type:
                    //当前回合生效，附加技能状态加成
                    hp += harm * (state.num || 0);
                    stateId = state.id;
                    if (state.round > 0) {
                        state.round -= 1; //攻击后的技能状态是本回合生效的，此处扣一回合
                    }
                    atk.state.push(state);
                    break;
                default:
                    break;
            }
        }
    });

    //附加技能加成
    if (skill) {
        switch (skill.__cfg.effectType) {
            case consts.Enums.SkillType.ReSelfHP:
                hp += atk.maxhp * skill.__cfg.effectNum;
                break;
            case consts.Enums.SkillType.ReSelfHPOfCurrent:
                hp += atk.hp * skill.__cfg.effectNum;
                break;
            case consts.Enums.SkillType.ReEnemyHP:
                hp += def.maxhp * skill.__cfg.effectNum;
                break;
            case consts.Enums.SkillType.ReEnemyHPOfCurrent:
                hp += def.hp * skill.__cfg.effectNum;
                break;
            default:
                break;
        }
        //只能恢复到最大血量
        hp = Math.floor(hp);
        hp = Math.min(hp, atk.maxhp - atk.hp);
    }

    if (cb) {
        cb(hp, stateId);
    }
};


/**
 * 攻击后触发的状态
 */
Battle.prototype.triggerDieState = function (def, cb) {
    var state = null;
    var type = parseInt(SkillStatus.Recover / 100);
    def.state.forEach(function (el) {
        if (el.wtype === type) {
            //生效状态权重判断
            state = !state || state.weight < el.weight ? el : state;
        }
    }, this);
    var hp = 0;
    if (state) {
        switch (state.type) {
            case SkillStatus.Recover:
                //恢复到最大血量
                hp = Math.floor(def.maxhp * (state.num || 0));
                hp = Math.min(hp, def.maxhp - def.hp);
                break;
            case SkillStatus.RecoverAll:
                hp = def.maxhp - def.hp;
                break;
            default:
                break;
        }
    }
    hp = Math.floor(hp);
    if (cb) {
        cb(hp, (state && state.id ? state.id : 0));
    }
};
var ConfigCache = require('./configCache');
var Formula = require('../util/formula');
var logger = require('pomelo-logger').getLogger(__filename);

var exp = module.exports;

/**
 * 创建怪物的阵容
 */
exp.buildMonster = function (bossId, cb) {

    var monster = ConfigCache.get.monster(bossId);
    if (!monster) {
        cb(new Error('Not found moster:' + bossId), null);
        return;
    }

    var result = {
        tid: monster.id,
        //战斗服务器获取配置
        tname: monster.name,
        power: monster.power,
        attack: monster.attack,
        hp: monster.hp,
        maxhp: monster.hp,
        hit: monster.hit,
        dodge: monster.dodge,
        speed: monster.speed,
        skill: monster.skill//包括id,lv和pos
    };

    cb(null, result);
};

/**
 * 创建玩家的阵容
 */
exp.builPlayer = function (player, heros, lineups, illustrateds, lifeLikeProbs, illAch) {
    var result;
    Formula.settleHeroCombatPower(heros, lineups, illustrateds, lifeLikeProbs, illAch, function (res) {
        player.power = res.power;
        result = {
            tid: player.id,
            tname: player.name,
            power: res.power,
            attack: res.attack,
            hp: res.hp,
            maxhp: res.hp > 0 ? res.hp : 1,
            hit: res.hit,
            dodge: res.dodge,
            speed: res.speed,
            skill: res.skill, //包括id,lv和pos
            hero: res.hero //包括id和pos,仅造成阵容使用
        };
    });
    return result;
};
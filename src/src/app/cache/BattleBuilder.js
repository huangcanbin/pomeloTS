Object.defineProperty(exports, "__esModule", { value: true });
const ConfigCache = require("./ConfigCache");
const Formula = require("../util/Formula");
class BattleBuilder {
    static getInstance() {
        if (!this.instance) {
            this.instance = new BattleBuilder();
        }
        return this.instance;
    }
    constructor() {
        this._formula = Formula.Formula.getInstance();
        this._configCache = ConfigCache.ConfigCache.getInstance();
    }
    buildMonster(bossId, callback = null, context = null) {
        let monster = this._configCache.getMonster(bossId);
        if (!monster) {
            if (callback && context) {
                let des = 'Not found moster:' + bossId;
                callback.call(context, des);
            }
            return;
        }
        let result = {
            tid: monster.id,
            tname: monster.name,
            power: monster.power,
            attack: monster.attack,
            hp: monster.hp,
            maxhp: monster.hp,
            hit: monster.hit,
            dodge: monster.dodge,
            speed: monster.speed,
            skill: monster.skill
        };
        if (callback && context) {
            callback.call(context, result);
        }
    }
    builPlayer(player, heros, lineups, illustrateds, lifeLikeProbs, illAch) {
        let result = {};
        this._formula.settleHeroCombatPower(heros, lineups, illustrateds, lifeLikeProbs, illAch, (res) => {
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
                skill: res.skill,
                hero: res.hero
            };
        });
        return result;
    }
}
exports.default = BattleBuilder;

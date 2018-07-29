import ConfigCache = require('./ConfigCache');
import Formula = require('../util/formula');

/**
 * 战斗角色创建器（怪物和玩家）
 * @author Andrew_Huang
 * @export
 * @class BattleBuilder
 */
export default class BattleBuilder
{
    public static instance: BattleBuilder;
    public static getInstance(): BattleBuilder
    {
        if (!this.instance)
        {
            this.instance = new BattleBuilder();
        }
        return this.instance;
    }

    private _formula: Formula.Formula;             //格式化工具
    private _configCache: ConfigCache.ConfigCache; //配置数据缓存库

    public constructor()
    {
        this._formula = Formula.Formula.getInstance();
        this._configCache = ConfigCache.ConfigCache.getInstance();
    }

    /**
     * 创建怪物的阵容
     * @author Andrew_Huang
     * @param {number} bossId
     * @param {Function} [callback=null]
     * @param {Object} [context=null]
     * @returns {void}
     * @memberof BattleBuilder
     */
    public buildMonster(bossId: number, callback: Function = null, context: Object = null): void
    {
        let monster = this._configCache.getMonster(bossId);
        if (!monster)
        {
            if (callback && context)
            {
                let des: string = 'Not found moster:' + bossId;
                callback.call(context, des);
            }
            return;
        }
        let result = {
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

        if (callback && context)
        {
            callback.call(context, result);
        }
    }

    /**
     * 创建角色
     * @author Andrew_Huang
     * @param {*} player
     * @param {*} heros
     * @param {*} lineups
     * @param {*} illustrateds
     * @param {*} lifeLikeProbs
     * @param {*} illAch
     * @returns {*}
     * @memberof BattleBuilder
     */
    public builPlayer(player: any, heros: any, lineups: any, illustrateds: any, lifeLikeProbs: any, illAch: any): any
    {
        let result: any = {};
        this._formula.settleHeroCombatPower(heros, lineups, illustrateds, lifeLikeProbs, illAch, (res: any) =>
        {
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
    }
}
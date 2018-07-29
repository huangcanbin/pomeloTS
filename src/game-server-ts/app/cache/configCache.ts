import dbLoader = require('./DbLoader');
import utils = require('../util/utils');
// import async = require('async');
import logger = require('pomelo-logger');
import system = require('system');
import consts = require('../util/consts');
// import arrayUtil = require('../util/arrayUtil');
import ConfigFormat = require('./configFormat');

/**
 * 配置数据缓存库
 * @author Andrew_Huang
 * @export
 * @class ConfigCache
 */
export class ConfigCache
{
    public static instance: ConfigCache;
    public static getInstance(): ConfigCache
    {
        if (!this.instance)
        {
            this.instance = new ConfigCache();
        }
        return this.instance;
    }

    private _utils: utils.Utils;
    private _logger: logger.ILogger;
    private _configFormat: ConfigFormat.ConfigFormat;
    private _isLoaded: boolean = false;
    private _cfg: DataItem;           //配置总表
    private _const: DataItem;         //常量配置
    private _character: DataItem;     //主角配置
    private _checkpoint: DataItem;    //关卡配置
    private _onlineLottery: DataItem; //挂机自动抽奖配置
    private _item: DataItem;          //物品道具配置
    private _monster: DataItem;       //怪物阵容配置
    private _hero: DataItem;          //式神配置
    private _roleCost: DataItem;      //主角升级表配置
    private _skill: DataItem;         //式神技能表配置
    private _skillState: DataItem;    //式神技能状态表配置
    private _heroLottery: DataItem;   //式神抽奖配置
    private _lotteryCost: DataItem;   //式神抽奖消耗表配置
    private _goblin: DataItem;        //百鬼类型表配置
    private _heroSmelt: DataItem;     //式神熔炼配置
    private _lvCost: DataItem;        //升级消耗表
    private _starlvCost: DataItem;    //升星消耗表
    private _propCost: DataItem;      //宝具强化消耗表
    private _skillCost: DataItem;     //技能进化消耗表
    private _shop: DataItem;          //物品商店配置
    private _itemLottery: DataItem;   //物品抽奖配置
    private _shopHeroPool: DataItem;  //式神兑换池配置
    private _illustrated: DataItem;   //式神图鉴配置
    private _illAch: DataItem;        //式神图鉴成就
    private _card: DataItem;          //特权卡配置
    private _task: DataItem;          //任务配置
    private _recharge: DataItem;      //首充、累充奖励配置
    private _tower: DataItem;         //镇妖塔配置
    private _pointAward: DataItem;    //关卡奖励配置
    private _signAward: DataItem;     //签到奖励表配置
    private _heroPieceRain: DataItem; //式神碎片雨的掉落数量配置
    private _bossCombat: DataItem;    //精英BOss奖励表配置
    private _vipPrivilege: DataItem;  //vip特权表配置
    private _firstOnlineAward: DataItem;//精英BOss奖励表配置
    private _rechargeRebateAward: DataItem;//充值返利奖励配置
    private _lifeLike: DataItem;      //充值返利奖励配置
    private _worldBoss: DataItem;     //世界boss配置表
    private _worldBossAward: DataItem;//世界boss排名奖励表
    private _rankedGameAward: DataItem;//排位赛奖励配置
    private _robot: DataItem;         //机器人配置
    private _pointLotteryUpdateAward: DataItem;//关卡第一次抽奖升级奖励配置
    private _pointLotteryRandomAward: DataItem;//关卡抽奖随机奖励配置
    private _pointLotteryUpdate: DataItem;//关卡抽奖升级配置
    private _moneyRoulette: DataItem; //精英BOss奖励表配置
    private _dailyTask: DataItem;     //日常任务配置
    private _dailyTaskAward: DataItem;//日常任务奖励配置
    private _achieveTask: DataItem;   //成就任务配置

    public constructor()
    {
        this._utils = utils.Utils.getInstance();
        this._configFormat = ConfigFormat.ConfigFormat.getInstance();
        this._logger = logger.getLogger(system.__filename);
        this.initDataItem();
    }

    private initDataItem(): void
    {
        this._cfg = new DataItem('config', (res: any) =>
        {
            return {
                id: res.id,
                name: res.name,
                descp: res.descp,
                version: res.version
            };
        });
        this._const = new DataItem('cfg_const', (res: any) =>
        {
            return {
                id: res.name,
                descp: res.descp,
                num: res.num
            };
        });
        this._character = new DataItem('cfg_character', (res: any) =>
        {
            return {
                id: res.id,
                name: res.name,
                quality: res.quality,
                attack: res.attack,
                heroAttack: res.hero_attack,
                propAttack: res.prop_attack,
                hp: res.hp,
                heroHp: res.hero_hp,
                propHp: res.prop_hp,
                hit: res.hit,
                heroHit: res.hero_hit,
                propHit: res.prop_hit,
                dodge: res.dodge,
                heroDodge: res.hero_dodge,
                propDodge: res.prop_dodge,
                speed: res.speed,
                heroSpeed: res.hero_speed,
                propSpeed: res.prop_speed,
                nskillId: res.n_skill_id,
                skillId: res.skill_id
            };
        });
        this._checkpoint = new DataItem('cfg_checkpoint', (res: any) => 
        {
            let item = {
                id: res.point,
                checkpointId: res.id,
                name: res.name,
                exp: res.exp,//每秒增加值
                gold: res.gold,//每秒增加值
                bossId: res.boss,
                minTime: res.min_ts,
                amount: res.amount,
                items: <any>[],
                addLineup: res.addLineup,    //首次通过关卡后,开启式神阵位的数量
                dropCd: res.drop_cd,
                dropItem: res.drop_item,
                dropPercent: res.drop_percent
            };
            if (res.item1) item.items.push(this.parseAndCreateItem(res.item1, res.num1));
            if (res.item2) item.items.push(this.parseAndCreateItem(res.item2, res.num2));
            if (res.item3) item.items.push(this.parseAndCreateItem(res.item3, res.num3));
            if (res.item4) item.items.push(this.parseAndCreateItem(res.item4, res.num4));
            if (res.item5) item.items.push(this.parseAndCreateItem(res.item5, res.num5));
            return item;
        });
        this._onlineLottery = new DataItem('cfg_online_lottery', (res: any) =>
        {
            return {
                id: res.item_id,
                itemId: res.item_id,
                weight: res.weight
            };
        });
        this._item = new DataItem('cfg_item', (res: any) =>
        {
            let item = {
                id: res.id,
                name: res.name,
                type: res.type,   //物品类型 0：道具物品 1：材料物品
                quality: res.quality,
                gold: res.gold,
                max: res.max_num,
                logicType: res.logic_type,
                ids: <any>[],    //根据逻辑类型获取的物品或者式神的Id
                nums: <any>[],
                items: <any>[],  //使用或合成后获得的物品
                heros: <any>[],  //使用后获得的式神
                getGlod: 0,      //使用后获得的金币
                getExp: 0,
                getMoney: 0,
                costItems: <any>[],  //合成消耗的物品
                costGlod: 0,         //合成后消耗的金币
                costExp: 0,
                costMoney: 0,
                useScript: res.use_script
            };
            switch (res.logic_type)
            {
                case consts.default.consts.Enums.ItemLogicType.Compose:
                    if (res.cost_ids)
                    {
                        let ids: Array<string> = res.cost_ids.split(',');
                        let nums: Array<string> = (res.cost_nums || '').split(',');
                        for (let i: number = 0; i < ids.length; i++)
                        {
                            let id: number = parseInt(ids[i]);
                            let num: number = (parseInt(nums[i]) || 1);
                            num = num <= 0 ? 1 : num;
                            switch (id)
                            {
                                case 100000:
                                    item.costGlod += num;
                                    break;
                                case 200000:
                                    item.costExp += num;
                                    break;
                                case 300000:
                                    item.costMoney += num;
                                    break;
                                default:
                                    item.costItems.push(this.parseAndCreateItem(id, num));
                                    break;
                            }
                        }
                        item.items.push(this.parseAndCreateItem(1 * res.logic_ids, 1));
                    }
                    break;
                case consts.default.consts.Enums.ItemLogicType.Item:
                    if (res.logic_ids)
                    {
                        let ids: Array<string> = res.logic_ids.split(',');
                        let nums: Array<string> = (res.logic_nums || '').split(',');
                        for (let i: number = 0; i < ids.length; i++)
                        {
                            let id: number = parseInt(ids[i]);
                            let num: number = (parseInt(nums[i]) || 1);
                            num = num <= 0 ? 1 : num;
                            item.ids.push(id);
                            item.nums.push(num);
                            switch (id)
                            {
                                case 100000:
                                    item.getGlod += num;
                                    break;
                                case 200000:
                                    item.getExp += num;
                                    break;
                                case 300000:
                                    item.getMoney += num;
                                    break;
                                default:
                                    item.items.push(this.parseAndCreateItem(id, num));
                                    break;
                            }
                        }
                    }
                    break;
                case consts.default.consts.Enums.ItemLogicType.Hero:
                    if (res.logic_ids)
                    {
                        let ids: Array<string> = res.logic_ids.split(',');
                        let nums: Array<string> = (res.logic_nums || '').split(',');
                        for (let i: number = 0; i < ids.length; i++)
                        {
                            let id: number = parseInt(ids[i]);
                            let num: number = (parseInt(nums[i]) || 1);
                            num = num <= 0 ? 1 : num;
                            item.ids.push(id);
                            item.nums.push(num);
                            for (let j: number = 0; j < num; j++)
                            {
                                item.heros.push({
                                    hero: { id: id },
                                    pos: 0
                                });
                            }
                        }
                    }
                    break;
                case consts.default.consts.Enums.ItemLogicType.DrawHero:
                case consts.default.consts.Enums.ItemLogicType.DrawItem:
                    item.ids = parseInt(res.logic_ids);
                    break;
                default:
                    break;
            }
            return item;
        });
        this._monster = new DataItem('cfg_monster', (res: any) =>
        {
            return {
                id: res.id,
                name: res.name,
                attack: res.attack,
                hp: res.hp,
                hit: res.hit,
                dodge: res.dodge,
                speed: res.speed,
                power: res.power,
                num: res.num,
                skill: this.parseMonsterSkill(res.skill)
            };
        });
        this._hero = new DataItem('cfg_hero', (res: any) =>
        {
            return {
                id: res.id,
                name: res.name,
                quality: res.quality,
                attack: res.attack,
                heroAttack: res.hero_attack,
                propAttack: res.prop_attack,
                hp: res.hp,
                heroHp: res.hero_hp,
                propHp: res.prop_hp,
                hit: res.hit,
                heroHit: res.hero_hit,
                propHit: res.prop_hit,
                dodge: res.dodge,
                heroDodge: res.hero_dodge,
                propDodge: res.prop_dodge,
                speed: res.speed,
                heroSpeed: res.hero_speed,
                propSpeed: res.prop_speed,
                nskillId: res.n_skill_id,
                skillId: res.skill_id
            };
        });
        this._roleCost = new DataItem('cfg_role_cost', (res: any) =>
        {
            return {
                id: res.type + '_' + res.lv,/*搜索键*/
                type: res.type,
                lv: res.lv,
                item: res.item,
                num: res.num
            };
        });
        this._skill = new DataItem('cfg_hero_skill', (res: any) =>
        {
            return {
                id: res.skill_id + '_' + res.lv,/*搜索键*/
                skillId: res.skill_id,
                lv: res.lv,
                name: res.name,
                weight: res.prob,//触发概率
                precond: res.precond,//前置条件
                precondNum: res.precond_num,
                passive: res.passive,//被动的
                effectType: res.effect_type,
                effectNum: res.effect_num,
                stateType: res.state_type,
                stateNum: res.state_num,
                stateRound: res.state_round,
                target: res.target//施放目标 1:对方,2:己方
            };
        });
        this._skillState = new DataItem('cfg_skill_state', (res: any) =>
        {
            return {
                id: res.id,/*搜索键*/
                name: res.name,
                type: res.type,
                weight: res.weight
            };
        });
        this._heroLottery = new DataItem('cfg_hero_lottery', (res: any) =>
        {
            return {
                id: res.id,/*搜索键*/
                type: res.type,
                heroId: res.hero_id,
                weight: res.weight
            };
        });
        this._lotteryCost = new DataItem('cfg_lottery_cost', (res: any) =>
        {
            return {
                id: res.type,/*搜索键*/
                type: res.type,
                item: res.item,
                num: res.num,
                freeNum: res.free_num,
                ratio: res.ratio,     //金币上涨系数
                xp_num: res.xp_num    //消耗后添加xp的值
            };
        });
        this._goblin = new DataItem('cfg_goblin', (res: any) =>
        {
            let item = {
                id: res.id,/*搜索键*/
                weight: res.weight,
                point: res.point,
                bean: res.bean,
                time: res.time,
                maxHp: res.maxHp,
                exp: res.exp,
                gold: res.gold,
                items: <any>[]
            };
            if (res.item1) item.items.push(this.parseAndCreateItem(res.item1, 1, res.prob1));
            if (res.item2) item.items.push(this.parseAndCreateItem(res.item2, 1, res.prob2));
            if (res.item3) item.items.push(this.parseAndCreateItem(res.item3, 1, res.prob3));
            if (res.item4) item.items.push(this.parseAndCreateItem(res.item4, 1, res.prob4));
            if (res.item5) item.items.push(this.parseAndCreateItem(res.item5, 1, res.prob5));
            return item;
        });
        this._heroSmelt = new DataItem('cfg_hero_smelt', (res: any) =>
        {
            return {
                id: res.id,/*搜索键*/
                quality: res.quality,
                fragment: res.fragment,
                lotteryRatio: res.lotteryRatio,
                lotteryType: res.lotteryType
            };
        });
        this._lvCost = new DataItem('cfg_lv_cost', (res: any) =>
        {
            let item = {
                id: res.lv,/*搜索键*/
                starLv: res.starLv,
                lv: res.lv,
                items: <any>[]
            };
            if (res.item1) item.items.push(this.parseAndCreateItem(res.item1, res.num1));
            if (res.item2) item.items.push(this.parseAndCreateItem(res.item2, res.num2));
            if (res.item3) item.items.push(this.parseAndCreateItem(res.item3, res.num3));
            if (res.item4) item.items.push(this.parseAndCreateItem(res.item4, res.num4));
            if (res.item5) item.items.push(this.parseAndCreateItem(res.item5, res.num5));
            return item;
        });
        this._starlvCost = new DataItem('cfg_starlv_cost', (res: any) =>
        {
            let item = {
                id: res.starLv,/*搜索键*/
                items: <any>[]
            };
            if (res.item1) item.items.push(this.parseAndCreateItem(res.item1, res.num1));
            if (res.item2) item.items.push(this.parseAndCreateItem(res.item2, res.num2));
            if (res.item3) item.items.push(this.parseAndCreateItem(res.item3, res.num3));
            if (res.item4) item.items.push(this.parseAndCreateItem(res.item4, res.num4));
            if (res.item5) item.items.push(this.parseAndCreateItem(res.item5, res.num5));
            return item;
        });
        this._propCost = new DataItem('cfg_prop_cost', (r: any) =>
        {
            let item = {
                id: r.lv,/*搜索键*/
                lv: r.lv,
                items: <any>[]
            };
            if (r.item1) item.items.push(this.parseAndCreateItem(r.item1, r.num1));
            if (r.item2) item.items.push(this.parseAndCreateItem(r.item2, r.num2));
            if (r.item3) item.items.push(this.parseAndCreateItem(r.item3, r.num3));
            if (r.item4) item.items.push(this.parseAndCreateItem(r.item4, r.num4));
            if (r.item5) item.items.push(this.parseAndCreateItem(r.item5, r.num5));
            return item;
        });
        this._skillCost = new DataItem('cfg_skill_cost', (res: any) =>
        {
            let item = {
                id: res.lv,/*搜索键*/
                lv: res.lv,
                items: <any>[],
                heros: res.heros     //式神奖励
            };
            if (res.item1) item.items.push(this.parseAndCreateItem(res.item1, res.num1));
            if (res.item2) item.items.push(this.parseAndCreateItem(res.item2, res.num2));
            if (res.item3) item.items.push(this.parseAndCreateItem(res.item3, res.num3));
            if (res.item4) item.items.push(this.parseAndCreateItem(res.item4, res.num4));
            if (res.item5) item.items.push(this.parseAndCreateItem(res.item5, res.num5));
            item.heros = JSON.parse(item.heros.trim() || "[]");
            return item;
        });
        this._shop = new DataItem('cfg_shop', (res: any) =>
        {
            return {
                id: res.item_id,/*搜索键*/
                itemId: res.item_id,
                type: res.type,
                price: res.price
            };
        });
        this._itemLottery = new DataItem('cfg_item_lottery', (res: any) =>
        {
            return {
                id: res.id,/*搜索键*/
                type: res.type,
                itemId: res.item_id,
                num: res.num,
                weight: res.weight,
                item: this.parseAndCreateItem(res.item_id, res.num),  //获得的物品信息
            };
        });
        this._shopHeroPool = new DataItem('cfg_shop_hero_pool', (res: any) =>
        {
            return {
                id: res.hero_id,/*搜索键*/
                heroId: res.hero_id,
                weight: res.weight,
                fragment: res.fragment
            };
        });
        this._illustrated = new DataItem('cfg_hero_illustrated', (res: any) =>
        {
            return {
                id: res.quality,/*搜索键*/
                power: res.power
            };
        });
        this._illAch = new DataItem('cfg_ill_ach', (res: any) =>
        {
            res.needHeroIds = JSON.parse(res.needHeroIds.trim() || "[]");
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            let skillId = 0, skillLv = 0;
            res.skillIdLv = JSON.parse(res.skillIdLv.trim() || "[]");
            if (!!res.skillIdLv && res.skillIdLv.length > 0)
            {
                skillId = res.skillIdLv[0];
                skillLv = res.skillIdLv[1];
            }
            return {
                id: res.id,                   //成就编号            
                needHeroIds: res.needHeroIds, //完成成就需要的式神
                items: res.items,             //物品奖励
                heros: res.heros,             //式神奖励
                heroIds: heroIds,            //奖励式神的id
                skillId: skillId,           //获取的被动技能ID
                skillLv: skillLv,           //获取的被动技能等级
            };
        });
        this._card = new DataItem('cfg_card', (res: any) =>
        {
            res.buyAward = JSON.parse(res.buyAward.trim() || "[]");
            res.buyAward = res.buyAward.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.evydayAward = JSON.parse(res.evydayAward.trim() || "[]");
            res.evydayAward = res.evydayAward.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            return {
                id: res.type,                 //卡类型 1:月卡 2:终身卡
                price: res.price,             //价格,单位:分
                buyAward: res.buyAward,       //购买时的奖品
                evydayAward: res.evydayAward  //每日可领的奖品
            };
        });
        this._task = new DataItem('cfg_task', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,                   //Id
                type: res.type,               //类型 1:通过关卡 2:上阵式神 3:达成等级的阵位 4:达到进化等级的阵位 5:达到强化等级的宝具 6:达到战斗力
                condition: res.condition,     //达成条件,与type关联 type为1:关卡ID 为2:上阵式神数 为3:阵位数量 为4:阵位数量 为5:宝具数量 为6:战斗力值
                condition2: res.condition2,   //达成条件2,与type关联 type为3:阵位等级 为4:阵位的进化等级 为5:宝具的强化等级
                nextTaskId: res.nextTaskId,   //下个任务ID, 0:没有下个任务
                items: res.items,             //物品奖励
                heros: res.heros,             //式神奖励
                heroIds: heroIds            //奖励式神的id
            };
        });
        this._recharge = new DataItem('cfg_recharge', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,                   //10001:首充奖励
                needMoney: res.needMoney,     //领取奖励需要的充值金额(单位:分),首充为0
                nextId: res.nextId,           //下个充值奖励的id, 0:没有下个奖励            
                items: res.items,             //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: res.heros,             //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
                heroIds: heroIds            //奖励式神的id
            };
        });
        this._tower = new DataItem('cfg_tower', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,               //塔层编号
                name: res.name,           //塔层名称
                power: res.power,         //塔怪物战斗力
                monsterId: res.monsterId, //怪物阵容ID，即cfg_monster表ID。若不触发战斗，则配置为0。
                exp: res.exp,             //经验奖励数量,必然发放
                gold: res.gold,           //金币奖励数量,必然发放
                itemsProb: res.itemsProb, //获取物品奖励的几率
                items: res.items,         //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                herosProb: res.herosProb, //获取式神奖励的几率
                heros: res.heros,         //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
                heroIds: heroIds        //奖励式神的id
            };
        });
        this._pointAward = new DataItem('cfg_point_award', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.onceitems = JSON.parse(res.onceitems.trim() || "[]");
            res.onceitems = res.onceitems.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,               //塔层编号
                point: res.point,         //领奖需要通过的关卡数 
                stageid: res.stageid,    //大关卡id   
                items: res.items,         //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id            
                heros: res.heros,         //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
                heroIds: heroIds,       //奖励式神的id
                onceitems: res.onceitems  //一次充值25元通关的额外奖励
            };
        });
        this._signAward = new DataItem('cfg_sign_award', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.items1 = JSON.parse(res.items1.trim() || "[]");
            res.items1 = res.items1.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            return {
                id: res.id,         //签到天数        
                items: res.items,         //签到物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id      
                items1: res.items1,       //累计签到物品奖励
                vipflag: res.vipflag,  //是否可vip双倍领奖      
            };
        });
        this._heroPieceRain = new DataItem('cfg_heropiece_rain', (res: any) =>
        {
            return {
                id: res.point,/*搜索键*/
                num: res.num,
                rnum: res.rnum,
                srnum: res.srnum,
                ssrnum: res.ssrnum,
                rssrnum: res.rssrnum
            };
        });
        this._bossCombat = new DataItem('cfg_point_boss', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.stageId,           //*搜索键*/ 
                stageId: res.stageId,      //*用来返绐客户端的id*/ 
                pointId: res.pointId,      //*关卡Id*/ 
                monsterId: res.monsterId,  //精英BOss挑战对应的BossId  
                items: res.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: res.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
        });
        this._vipPrivilege = new DataItem('cfg_vip_privilege', (res: any) =>
        {
            res.award = JSON.parse(res.award.trim() || "[]");
            res.award = res.award.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            return {
                id: res.id,                       //*搜索键*/ 
                viplev: res.viplev,
                rechargenum: res.rechargenum,         //*所需累计充值金额*/ 
                exp: res.exp,                         //*挂机exp收益加成*/ 
                gold: res.gold,                       //挂机金币收益加成  
                lotterymoney: res.lotterymoney,       //抽奖所需代币打折
                lotteryxp: res.lotteryxp,             //XP抽奖所需值减少
                exchange: res.exchange,               //快捷道具打折
                bosscombat: res.bosscombat,           //精英BOSS每天扫荡礼包数量
                heropiecespeed: res.heropiecespeed,   //妖怪雨的下落速度缓慢
                award: res.award,                     //Vip每日可领取奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                signaward: res.signaward,             //Vip签到倍率拿奖励
                accusignaward: res.accusignaward      //Vip累计签到倍率拿奖励
            };
        });
        this._firstOnlineAward = new DataItem('cfg_online_award', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,           //*搜索键*/ 
                type: res.type,      //*类型*/ 
                typeid: res.typeid,   //*类型id*/ 
                time: res.time,
                items: res.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: res.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
        });
        this._rechargeRebateAward = new DataItem('cfg_recharge_rebate', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,               //*搜索键*/ 
                type: res.type,           //*返利类型*/ 
                typeid: res.typeid,       //*充值档次*/ 
                money: res.money,         //充值金额   
                items: res.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: res.heros,         //式神奖励
                times: res.times,           //次数
                rebatetype: res.rebatetype  //充值类型，1：当日充值 2：全生涯充值
            };
        });
        this._lifeLike = new DataItem('cfg_lifelike', (res: any) =>
        {
            let item = {
                id: res.id,/*搜索键*/
                level: res.id,
                lifeLike: res.lifelike,
                probsArr: <any>[]
            };
            if (res.hp) item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Hp, value: res.hp, weight: res.prob1 });
            if (res.attack) item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Attack, value: res.attack, weight: res.prob2 });
            if (res.hit) item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Hit, value: res.hit, weight: res.prob3 });
            if (res.dodge) item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Dodge, value: res.dodge, weight: res.prob4 });
            if (res.speed) item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Speed, value: res.speed, weight: res.prob5 });
            return item;
        });
        this._worldBoss = new DataItem('cfg_world_boss', (res: any) =>
        {
            return {
                id: res.id,               //*搜索键*/ 
                weekday: res.weekday,           //*返利类型*/ 
                monsterid: res.monsterid,       //*对应的怪物id*/ 
                items: res.items,         //参与奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                money: res.money,         //增加一次挑战次数需求的代币
            };
        });
        this._worldBossAward = new DataItem('cfg_world_boss_award', (res: any) =>
        {
            return {
                id: res.id,               //*搜索键*/ 
                bossid: res.bossid,           //*bossid*/ 
                rank: res.rank,       //*名次*/ 
                items: res.items,         //排名奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            };
        });
        this._rankedGameAward = new DataItem('cfg_ranked_game_award', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,               //*搜索键*/ 
                rank: res.rank,           //名次 
                money: res.money,         //赠送代币   
                items: res.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: res.heros,         //式神奖励
            };
        });
        this._robot = new DataItem('cfg_robot', (res: any) =>
        {
            return {
                id: res.robotId,               //*搜索键*/ 
                robotId: res.robotId,          //机器人ID 
                name: res.name,                //机器人昵称   
                monsterId: res.monsterId,      //机器人对应的怪物ID
                headerCode: res.headerCode,    //机器人头像编码
            };
        });
        this._pointLotteryUpdateAward = new DataItem('cfg_point_lottery_update_award', (res: any) =>
        {
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.pointid,               //*搜索键*/ 
                pointid: res.pointid,       //*关卡id*/ 
                money: res.money,           //*需充值金额*/ 
                heros: res.heros,         //*升级后的式神奖励*/ 
                heroIds: heroIds         //奖励式神的id
            };
        });
        this._pointLotteryRandomAward = new DataItem('cfg_point_lottery_random_award', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,               //*搜索键*/ 
                pointid: res.pointid,     //*关卡id*/ 
                items: res.items,         //*物品奖励*/ 
                heros: res.heros,         //*式神奖励*/ 
                weight: res.weight        //*权重*/ 
            };
        });
        this._pointLotteryUpdate = new DataItem('cfg_point_lottery_update', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            return {
                id: res.pointid * 100 + res.level,  //*搜索键*/ 
                pointid: res.pointid,               //*关卡id*/ 
                items: res.items,                   //*升级材料*/ 
                level: res.level,                   //*关卡抽奖等级*/ 
                cd: res.cd,                         //*关卡抽奖cd*/ 
                times: res.times,                   //*关卡抽奖次数*/ 
                weight: res.weight                  //*权重*/ 
            };
        });
        this._moneyRoulette = new DataItem('cfg_money_roulette', (res: any) =>
        {
            return {
                id: res.id,                    //*搜索键*/ 
                money: res.money,              //*抽奖花费的勾玉*/ 
                awardmoney: res.awardmoney,    //*抽奖得到的勾玉*/ 
                awardmoney1: res.awardmoney1,  //保护值限制后得到勾玉
                weight: res.weight,            //比重
                protectmoney: res.protectmoney,//保护值（player.money - money + awardmoney < procetmoney） 时，些档才会得到，反之不会。
                nextmoney: res.nextmoney       //下一档花费的勾玉
            };
        });
        this._dailyTask = new DataItem('cfg_daily_task', (res: any) =>
        {
            return {
                id: res.id,           //*搜索键*/ 
                type: res.type,      //*类型*/ 
                activity: res.activity,
                limit: res.limit
            };
        });
        this._dailyTaskAward = new DataItem('cfg_daily_task_award', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,           //*搜索键*/ 
                activity: res.activity,           //要求活跃值   
                remedialPrice: res.remedialPrice, //补领价格
                items: res.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: res.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
        });
        this._achieveTask = new DataItem('cfg_achieve_task', (res: any) =>
        {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,           //*搜索键*/ 
                type: res.type,           //*成就类型*/
                score: res.score,           //成就达成需求值   
                items: res.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: res.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
        })
    }

    public get cfg(): DataItem
    {
        return this._cfg;
    }

    public get item(): DataItem
    {
        return this._item;
    }

    public get const(): DataItem
    {
        return this._const;
    }

    public get hero(): DataItem
    {
        return this._hero;
    }

    public get skill(): DataItem
    {
        return this._skill;
    }

    public get skillState(): DataItem
    {
        return this._skillState;
    }

    public get recharge(): DataItem
    {
        return this._recharge;
    }

    public get tower(): DataItem
    {
        return this._tower;
    }

    public get pointAward(): DataItem
    {
        return this._pointAward;
    }

    public get signAward(): DataItem
    {
        return this._signAward;
    }

    public get rechargeRebateAward(): DataItem
    {
        return this._rechargeRebateAward;
    }

    public get firstOnlineAward(): DataItem
    {
        return this._firstOnlineAward;
    }

    public get vipPrivilege(): DataItem
    {
        return this._vipPrivilege;
    }

    public get bossCombat(): DataItem
    {
        return this._bossCombat;
    }

    public get heroPieceRain(): DataItem
    {
        return this._heroPieceRain;
    }

    public get shopHeroPool(): DataItem
    {
        return this._shopHeroPool;
    }

    public get illustrated(): DataItem
    {
        return this._illustrated;
    }

    public get card(): DataItem
    {
        return this._card;
    }

    public get task(): DataItem
    {
        return this._task;
    }

    public get rankedGameAward(): DataItem
    {
        return this._rankedGameAward;
    }

    public get illAch(): DataItem
    {
        return this._illAch;
    }

    public get worldBossAward(): DataItem
    {
        return this._worldBossAward;
    }

    public get worldBoss(): DataItem
    {
        return this._worldBoss;
    }

    public get lifeLike(): DataItem
    {
        return this._lifeLike;
    }

    public get dailyTask(): DataItem
    {
        return this._dailyTask;
    }

    public get itemLottery(): DataItem
    {
        return this._itemLottery;
    }

    public get moneyRoulette(): DataItem
    {
        return this._moneyRoulette;
    }

    public get pointLotteryUpdate(): DataItem
    {
        return this._pointLotteryUpdate;
    }

    public get pointLotteryRandomAward(): DataItem
    {
        return this._pointLotteryRandomAward;
    }

    public get pointLotteryUpdateAward(): DataItem
    {
        return this._pointLotteryUpdateAward;
    }

    public get robot(): DataItem
    {
        return this._robot;
    }

    public get propCost(): DataItem
    {
        return this._propCost;
    }

    public get dailyTaskAward(): DataItem
    {
        return this._dailyTaskAward;
    }

    public get shop(): DataItem
    {
        return this._shop;
    }

    public get skillCost(): DataItem
    {
        return this._skillCost;
    }

    public get starlvCost(): DataItem
    {
        return this._starlvCost;
    }

    public get lvCost(): DataItem
    {
        return this._lvCost;
    }

    public get achieveTask(): DataItem
    {
        return this._achieveTask;
    }

    public get heroSmelt(): DataItem
    {
        return this._heroSmelt;
    }

    public get goblin(): DataItem
    {
        return this._goblin;
    }

    public get lotteryCost(): DataItem
    {
        return this._lotteryCost;
    }

    public get heroLottery(): DataItem
    {
        return this._heroLottery;
    }

    public get roleCost(): DataItem
    {
        return this._roleCost;
    }

    public get character(): DataItem
    {
        return this._character;
    }

    public get checkpoint(): DataItem
    {
        return this._checkpoint;
    }

    public get monster(): DataItem
    {
        return this._monster;
    }

    public get onlineLottery(): DataItem
    {
        return this._onlineLottery;
    }

    public get isLoaded(): boolean
    {
        return this._isLoaded
    }

    /**
     * 创建物品对象
     * @author Andrew_Huang
     * @param {number} itemId
     * @param {number} num
     * @param {number} weight
     * @returns {*}
     * @memberof ConfigCache
     */
    public parseAndCreateItem(itemId: number, num: number, weight: number = null): any
    {
        /*以前5位ID和第6位组成（如物品ID为111，类型为物品：则组合为：400111）
            1为金币，后5位写0，数量写在num上
            2为经验，后5位写0，数量写在num上
            3为代币，后5位写0，数量写在num上
            >3为物品，后5位写物品ID，数量写在num上    
            编号全局定义，400111 也是物品ID
            */
        let itemType = this._utils.getItemType(itemId);
        if (weight)
        {
            return {
                id: itemId,
                //itemId: itemId,
                type: itemType,
                weight: weight,
                num: num || 1
            };
        }
        return {
            id: itemId,
            type: itemType,
            num: num || 0
        };
    }

    /**
     * config 数据更新
     * @author Andrew_Huang
     * @param {*} origin   旧的配置数据
     * @param {*} newData  新的配置数据
     * @returns {*}
     * @memberof ConfigCache
     */
    public configUpdate(origin: any, newData: any): any
    {
        for (let i: number = 0; i < newData.length; i++)
        {
            let item = newData[i];
            //出现新的配置信息，则插入
            if (!origin[item.name])
            {
                origin[item.name] = item;
                origin[item.name].data = JSON.parse(item.data);
                this._logger.debug('add a new config : ' + item.name);
            }
            //比对版本号，并更新最新版本数据
            else if (origin[item.name].version < item.version)
            {
                origin[item.name].data = JSON.parse(item.data);
                origin[item.name].version = item.version;
                //origin[item.name].data = item.data;
                this._logger.debug('update a new config : ' + item.name);
            }
        }
        return origin;
    }

    /**
     * 根据提供的key获取记录
     * @author Andrew_Huang
     * @param {*} data     格式化后的数据表
     * @param {number} id
     * @param {number} lv
     * @returns {*}
     * @memberof ConfigCache
     */
    public getByKey(data: any, id: number, lv: number = null): any
    {
        let key = lv ? id + '_' + lv : id;
        return data[key];
    }

    /**
     * 获取某表的所有记录
     * @author Andrew_Huang
     * @param {*} table
     * @returns {*}
     * @memberof ConfigCache
     */
    public getTableAll(table: any): any
    {
        let res: any = {};
        for (let i in table)
        {
            if (i)
            {
                res[i] = table[i];
            }
        }
        return res;
    }

    /**
     * 调整某表所有记录的格式，主key为data, 并插入get方法
     * @author Andrew_Huang
     * @param {*} table
     * @returns {*}
     * @memberof ConfigCache
     */
    public getItems(table: any): any
    {
        var self = this;
        let res: any = {};
        res.data = {};
        for (var i in table)
        {
            if (i)
            {
                res.data[i] = table[i];
            }
        }
        var get = function (id: number)
        {
            let tbData = self._configFormat.item(self);   //获取指定表格数据并格式化
            let record = self.getByKey(tbData, id); //根据提供的key获取对应的记录
            return record;
        }
        res.get = get;
        return res;
    }

    public parseMonsterSkill(skill: any): any
    {
        if ('string' === typeof skill)
        {
            skill = JSON.parse(skill);
        }
        let res: any = [];
        skill.forEach((el: any) =>
        {
            res.push({
                id: el / 100 * 100, //54001
                lv: (el % 100),
                pos: res.length + 1
            });
        }, this);

        return res;
    }

    public getVarConst(id: string, num: number = 0): number
    {
        console.log(id);
        console.log(num);
        return 0;
    }

    public getCharacter(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return 0;
    }

    public getHero(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public getSkill(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public getIllustrated(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public getIllAch(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }

    public getMonster(id: number, lv: number = null): any
    {
        console.log(id);
        console.log(lv);
        return null;
    }
}

/**
 * Item 数据缓存库
 * @author Andrew_Huang
 * @export
 * @class DataItem
 */
export class DataItem
{
    private _data: any;
    private _table: any;
    private _isloaded: boolean;
    private _loadError: any;
    private _parser: Function;
    private _dbLoad: dbLoader.DbLoader;
    private _logger: logger.ILogger;
    private _configCache: ConfigCache;

    public constructor(table: any, parseFun: Function = null)
    {
        this._data = {};
        this._table = table;
        this._isloaded = false;
        this._loadError = null;
        this._parser = parseFun;
        this._dbLoad = dbLoader.DbLoader.getInstance();
        this._configCache = ConfigCache.getInstance();
        this._logger = logger.getLogger(system.__filename);
    }

    /**
     * 加载 ITEM 数据表
     * @author Andrew_Huang
     * @param {Function} callback
     * @param {Object} context
     * @memberof DataItem
     */
    public load(callback: Function, context: Object): void
    {
        this._dbLoad.load(this._table, (err: any, res: any) =>
        {
            this._isloaded = true;
            if (!!err)
            {
                this._loadError = err;
                callback.call(context, err);
                return;
            }
            this._logger.info(this._data);
            for (let i: number = 0; i < res.length; i++)
            {
                let r = res[i];
                let item = this._parser(r);
                if (item && item.id)
                {
                    this._data[item.id] = item;
                }
            }
            callback.call(context);
        }, this);
    }

    public get(id: number, lv: number = null): any
    {
        if (!!this._loadError)
        {
            throw 'error:' + this._loadError;
        }
        let key = lv ? id + '_' + lv : id;
        return this._data[key];
    }

    public getAll(): any
    {
        if (!!this._loadError)
        {
            throw 'error:' + this._loadError;
        }
        return this._data;
    }

    public getVar(id: number, num: number): number
    {
        let obj = this.get(id) || { num: num || 0 };
        return obj.num;
    }

    public getItem(id: number, num: number): any
    {
        if (!!this._loadError)
        {
            throw 'error:' + this._loadError;
        }
        if (this._data[id])
        {
            return this._configCache.parseAndCreateItem(id, num);
        }
        throw 'Not found item:' + id;
    }

    public get isload(): boolean
    {
        return this._isloaded;
    }
}
var dbLoader = require('./dbLoader');
var utils = require('../util/utils');
var async = require('async');
var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../util/consts');
var arrayUtil = require('../util/arrayUtil');
var ConfigFormat = require('./configFormat');

var DataItem = function (table, parserFun) {
    this.data = {};
    this.table = table;
    this.isLoaded = false;
    this.loadError = null;
    this.parser = parserFun;
};

var _ConfigCache = {}; //保存config表配置信息的全局变量

var ConfigCache = {
    isLoaded: false,

    /**
     * 配置总表
     */
    cfg: new DataItem('config', function (r) {
        return {
            id: r.id,
            name: r.name,
            descp: r.descp,
            version: r.version
        };
    }),
    /**
     * 常量配置
     */
    const: new DataItem('cfg_const', function (r) {
        return {
            id: r.name,
            descp: r.descp,
            num: r.num
        };
    }),
    /**
     * 主角配置
     */
    character: new DataItem('cfg_character', function (r) {
        return {
            id: r.id,
            name: r.name,
            quality: r.quality,
            attack: r.attack,
            heroAttack: r.hero_attack,
            propAttack: r.prop_attack,
            hp: r.hp,
            heroHp: r.hero_hp,
            propHp: r.prop_hp,
            hit: r.hit,
            heroHit: r.hero_hit,
            propHit: r.prop_hit,
            dodge: r.dodge,
            heroDodge: r.hero_dodge,
            propDodge: r.prop_dodge,
            speed: r.speed,
            heroSpeed: r.hero_speed,
            propSpeed: r.prop_speed,
            nskillId: r.n_skill_id,
            skillId: r.skill_id
        };
    }),
    /**
     * 关卡配置
     */
    checkpoint: new DataItem('cfg_checkpoint', function (r) {
        var item = {
            id: r.point,
            checkpointId: r.id,
            name: r.name,
            exp: r.exp,//每秒增加值
            gold: r.gold,//每秒增加值
            bossId: r.boss,
            minTime: r.min_ts,
            amount: r.amount,
            items: [],
            addLineup: r.addLineup,    //首次通过关卡后,开启式神阵位的数量
            dropCd: r.drop_cd,
            dropItem: r.drop_item,
            dropPercent: r.drop_percent
        };

        if (r.item1) item.items.push(parseAndCreateItem(r.item1, r.num1));
        if (r.item2) item.items.push(parseAndCreateItem(r.item2, r.num2));
        if (r.item3) item.items.push(parseAndCreateItem(r.item3, r.num3));
        if (r.item4) item.items.push(parseAndCreateItem(r.item4, r.num4));
        if (r.item5) item.items.push(parseAndCreateItem(r.item5, r.num5));
        return item;
    }),
    /**
     * 挂机自动抽奖配置
     */
    onlineLottery: new DataItem('cfg_online_lottery', function (r) {
        return {
            id: r.item_id,
            itemId: r.item_id,
            weight: r.weight
        };
    }),
    /**
     * 物品道具配置
     */
    item: new DataItem('cfg_item', function (r) {
        var item = {
            id: r.id,
            name: r.name,
            type: r.type,   //物品类型 0：道具物品 1：材料物品
            quality: r.quality,
            gold: r.gold,
            max: r.max_num,
            logicType: r.logic_type,
            ids: [],    //根据逻辑类型获取的物品或者式神的Id
            nums: [],
            items: [],  //使用或合成后获得的物品
            heros: [],  //使用后获得的式神
            getGlod: 0, //使用后获得的金币
            getExp: 0,
            getMoney: 0,
            costItems: [],  //合成消耗的物品
            costGlod: 0, //合成后消耗的金币
            costExp: 0,
            costMoney: 0,
            useScript: r.use_script
        };

        var ids, nums, i, j, id, num;

        switch (r.logic_type) {
            case consts.Enums.ItemLogicType.Compose:
                if (r.cost_ids) {
                    ids = r.cost_ids.split(',');
                    nums = (r.cost_nums || '').split(',');

                    for (i = 0; i < ids.length; i++) {
                        id = 1 * ids[i];
                        num = 1 * (nums[i] || 1);
                        num = num <= 0 ? 1 : num;

                        switch (id) {
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
                                item.costItems.push(parseAndCreateItem(id, num));
                                break;
                        }
                    }

                    item.items.push(parseAndCreateItem(1 * r.logic_ids, 1));
                }
                break;
            case consts.Enums.ItemLogicType.Item:
                if (r.logic_ids) {
                    ids = r.logic_ids.split(',');
                    nums = (r.logic_nums || '').split(',');

                    for (i = 0; i < ids.length; i++) {
                        id = 1 * ids[i];
                        num = 1 * (nums[i] || 1);
                        num = num <= 0 ? 1 : num;

                        item.ids.push(id);
                        item.nums.push(num);

                        switch (id) {
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
                                item.items.push(parseAndCreateItem(id, num));
                                break;
                        }
                    }
                }
                break;
            case consts.Enums.ItemLogicType.Hero:
                if (r.logic_ids) {
                    ids = r.logic_ids.split(',');
                    nums = (r.logic_nums || '').split(',');

                    for (i = 0; i < ids.length; i++) {
                        id = 1 * ids[i];
                        num = 1 * (nums[i] || 1);
                        num = num <= 0 ? 1 : num;

                        item.ids.push(id);
                        item.nums.push(num);

                        for (j = 0; j < num; j++) {
                            item.heros.push({
                                hero: { id: id },
                                pos: 0
                            });
                        }
                    }
                }
                break;
            case consts.Enums.ItemLogicType.DrawHero:
            case consts.Enums.ItemLogicType.DrawItem:
                item.ids = 1 * r.logic_ids;
                break;
            default:
                break;
        }

        return item;
    }),
    /**
     * 怪物阵容配置
     */
    monster: new DataItem('cfg_monster', function (r) {
        return {
            id: r.id,
            name: r.name,
            attack: r.attack,
            hp: r.hp,
            hit: r.hit,
            dodge: r.dodge,
            speed: r.speed,
            power: r.power,
            num: r.num,
            skill: parseMonsterSkill(r.skill)
        };
    }),
    /**
     * 式神配置
     */
    hero: new DataItem('cfg_hero', function (r) {
        return {
            id: r.id,
            name: r.name,
            quality: r.quality,
            attack: r.attack,
            heroAttack: r.hero_attack,
            propAttack: r.prop_attack,
            hp: r.hp,
            heroHp: r.hero_hp,
            propHp: r.prop_hp,
            hit: r.hit,
            heroHit: r.hero_hit,
            propHit: r.prop_hit,
            dodge: r.dodge,
            heroDodge: r.hero_dodge,
            propDodge: r.prop_dodge,
            speed: r.speed,
            heroSpeed: r.hero_speed,
            propSpeed: r.prop_speed,
            nskillId: r.n_skill_id,
            skillId: r.skill_id
        };
    }),
    /**
     * 主角升级表配置
     */
    roleCost: new DataItem('cfg_role_cost', function (r) {
        return {
            id: r.type + '_' + r.lv,/*搜索键*/
            type: r.type,
            lv: r.lv,
            item: r.item,
            num: r.num
        };
    }),
    /**
     * 式神技能表配置
     */
    skill: new DataItem('cfg_hero_skill', function (r) {
        return {
            id: r.skill_id + '_' + r.lv,/*搜索键*/
            skillId: r.skill_id,
            lv: r.lv,
            name: r.name,
            weight: r.prob,//触发概率
            precond: r.precond,//前置条件
            precondNum: r.precond_num,
            passive: r.passive,//被动的
            effectType: r.effect_type,
            effectNum: r.effect_num,
            stateType: r.state_type,
            stateNum: r.state_num,
            stateRound: r.state_round,
            target: r.target//施放目标 1:对方,2:己方
        };
    }),
    /**
     * 式神技能表配置
     */
    skillState: new DataItem('cfg_skill_state', function (r) {
        return {
            id: r.id,/*搜索键*/
            name: r.name,
            type: r.type,
            weight: r.weight
        };
    }),
    /**
     * 式神抽奖配置
     */
    heroLottery: new DataItem('cfg_hero_lottery', function (r) {
        return {
            id: r.id,/*搜索键*/
            type: r.type,
            heroId: r.hero_id,
            weight: r.weight
        };
    }),
    /**
     * 式神抽奖消耗表配置
     */
    lotteryCost: new DataItem('cfg_lottery_cost', function (r) {
        return {
            id: r.type,/*搜索键*/
            type: r.type,
            item: r.item,
            num: r.num,
            freeNum: r.free_num,
            ratio: r.ratio,     //金币上涨系数
            xp_num: r.xp_num    //消耗后添加xp的值
        };
    }),
    /**
     * 百鬼类型表配置
     */
    goblin: new DataItem('cfg_goblin', function (r) {
        var item = {
            id: r.id,/*搜索键*/
            weight: r.weight,
            point: r.point,
            bean: r.bean,
            time: r.time,
            maxHp: r.maxHp,
            exp: r.exp,
            gold: r.gold,
            items: []
        };

        if (r.item1) item.items.push(parseAndCreateItem(r.item1, 1, r.prob1));
        if (r.item2) item.items.push(parseAndCreateItem(r.item2, 1, r.prob2));
        if (r.item3) item.items.push(parseAndCreateItem(r.item3, 1, r.prob3));
        if (r.item4) item.items.push(parseAndCreateItem(r.item4, 1, r.prob4));
        if (r.item5) item.items.push(parseAndCreateItem(r.item5, 1, r.prob5));
        return item;
    }),
    /**式神熔炼配置 */
    heroSmelt: new DataItem('cfg_hero_smelt', function (r) {
        return {
            id: r.id,/*搜索键*/
            quality: r.quality,
            fragment: r.fragment,
            lotteryRatio: r.lotteryRatio,
            lotteryType: r.lotteryType
        };
    }),
    /**升级消耗表 */
    lvCost: new DataItem('cfg_lv_cost', function (r) {
        var item = {
            id: r.lv,/*搜索键*/
            starLv: r.starLv,
            lv: r.lv,
            items: []
        };

        if (r.item1) item.items.push(parseAndCreateItem(r.item1, r.num1));
        if (r.item2) item.items.push(parseAndCreateItem(r.item2, r.num2));
        if (r.item3) item.items.push(parseAndCreateItem(r.item3, r.num3));
        if (r.item4) item.items.push(parseAndCreateItem(r.item4, r.num4));
        if (r.item5) item.items.push(parseAndCreateItem(r.item5, r.num5));

        return item;
    }),
    /**升星消耗表 */
    starlvCost: new DataItem('cfg_starlv_cost', function (r) {
        var item = {
            id: r.starLv,/*搜索键*/
            items: []
        };

        if (r.item1) item.items.push(parseAndCreateItem(r.item1, r.num1));
        if (r.item2) item.items.push(parseAndCreateItem(r.item2, r.num2));
        if (r.item3) item.items.push(parseAndCreateItem(r.item3, r.num3));
        if (r.item4) item.items.push(parseAndCreateItem(r.item4, r.num4));
        if (r.item5) item.items.push(parseAndCreateItem(r.item5, r.num5));

        return item;
    }),
    /**宝具强化消耗表 */
    propCost: new DataItem('cfg_prop_cost', function (r) {
        var item = {
            id: r.lv,/*搜索键*/
            lv: r.lv,
            items: []
        };

        if (r.item1) item.items.push(parseAndCreateItem(r.item1, r.num1));
        if (r.item2) item.items.push(parseAndCreateItem(r.item2, r.num2));
        if (r.item3) item.items.push(parseAndCreateItem(r.item3, r.num3));
        if (r.item4) item.items.push(parseAndCreateItem(r.item4, r.num4));
        if (r.item5) item.items.push(parseAndCreateItem(r.item5, r.num5));

        return item;
    }),
    /**技能进化消耗表 */
    skillCost: new DataItem('cfg_skill_cost', function (r) {
        var item = {
            id: r.lv,/*搜索键*/
            lv: r.lv,
            items: [],
            heros: r.heros     //式神奖励
        };

        if (r.item1) item.items.push(parseAndCreateItem(r.item1, r.num1));
        if (r.item2) item.items.push(parseAndCreateItem(r.item2, r.num2));
        if (r.item3) item.items.push(parseAndCreateItem(r.item3, r.num3));
        if (r.item4) item.items.push(parseAndCreateItem(r.item4, r.num4));
        if (r.item5) item.items.push(parseAndCreateItem(r.item5, r.num5));

        item.heros = JSON.parse(item.heros.trim() || "[]");

        return item;
    }),
    /**物品商店配置 */
    shop: new DataItem('cfg_shop', function (r) {
        return {
            id: r.item_id,/*搜索键*/
            itemId: r.item_id,
            type: r.type,
            price: r.price
        };
    }),
    /** 物品抽奖配置 */
    itemLottery: new DataItem('cfg_item_lottery', function (r) {
        return {
            id: r.id,/*搜索键*/
            type: r.type,
            itemId: r.item_id,
            num: r.num,
            weight: r.weight,
            item: parseAndCreateItem(r.item_id, r.num),  //获得的物品信息
        };
    }),
    /**式神兑换池配置 */
    shopHeroPool: new DataItem('cfg_shop_hero_pool', function (r) {
        return {
            id: r.hero_id,/*搜索键*/
            heroId: r.hero_id,
            weight: r.weight,
            fragment: r.fragment
        };
    }),
    /**式神图鉴配置 */
    illustrated: new DataItem('cfg_hero_illustrated', function (r) {
        return {
            id: r.quality,/*搜索键*/
            power: r.power
        };
    }),
    /**式神图鉴成就 */
    illAch: new DataItem('cfg_ill_ach', function (r) {
        r.needHeroIds = JSON.parse(r.needHeroIds.trim() || "[]");

        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        let skillId = 0, skillLv = 0;
        r.skillIdLv = JSON.parse(r.skillIdLv.trim() || "[]");
        if (!!r.skillIdLv && r.skillIdLv.length > 0) {
            skillId = r.skillIdLv[0];
            skillLv = r.skillIdLv[1];
        }

        return {
            id: r.id,                   //成就编号            
            needHeroIds: r.needHeroIds, //完成成就需要的式神
            items: r.items,             //物品奖励
            heros: r.heros,             //式神奖励
            heroIds: heroIds,            //奖励式神的id
            skillId: skillId,           //获取的被动技能ID
            skillLv: skillLv,           //获取的被动技能等级
        };
    }),
    /**特权卡配置 */
    card: new DataItem('cfg_card', function (r) {
        r.buyAward = JSON.parse(r.buyAward.trim() || "[]");
        r.buyAward = r.buyAward.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.evydayAward = JSON.parse(r.evydayAward.trim() || "[]");
        r.evydayAward = r.evydayAward.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        return {
            id: r.type,                 //卡类型 1:月卡 2:终身卡
            price: r.price,             //价格,单位:分
            buyAward: r.buyAward,       //购买时的奖品
            evydayAward: r.evydayAward  //每日可领的奖品
        };
    }),
    /**任务配置 */
    task: new DataItem('cfg_task', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.id,                   //Id
            type: r.type,               //类型 1:通过关卡 2:上阵式神 3:达成等级的阵位 4:达到进化等级的阵位 5:达到强化等级的宝具 6:达到战斗力
            condition: r.condition,     //达成条件,与type关联 type为1:关卡ID 为2:上阵式神数 为3:阵位数量 为4:阵位数量 为5:宝具数量 为6:战斗力值
            condition2: r.condition2,   //达成条件2,与type关联 type为3:阵位等级 为4:阵位的进化等级 为5:宝具的强化等级
            nextTaskId: r.nextTaskId,   //下个任务ID, 0:没有下个任务
            items: r.items,             //物品奖励
            heros: r.heros,             //式神奖励
            heroIds: heroIds            //奖励式神的id
        };
    }),
    
    /**首充、累充奖励配置 */
    recharge: new DataItem('cfg_recharge', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.id,                   //10001:首充奖励
            needMoney: r.needMoney,     //领取奖励需要的充值金额(单位:分),首充为0
            nextId: r.nextId,           //下个充值奖励的id, 0:没有下个奖励            
            items: r.items,             //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            heros: r.heros,             //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
            heroIds: heroIds            //奖励式神的id
        };
    }),
    /**镇妖塔配置 */
    tower: new DataItem('cfg_tower', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.id,               //塔层编号
            name: r.name,           //塔层名称
            power: r.power,         //塔怪物战斗力
            monsterId: r.monsterId, //怪物阵容ID，即cfg_monster表ID。若不触发战斗，则配置为0。
            exp: r.exp,             //经验奖励数量,必然发放
            gold: r.gold,           //金币奖励数量,必然发放
            itemsProb: r.itemsProb, //获取物品奖励的几率
            items: r.items,         //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            herosProb: r.herosProb, //获取式神奖励的几率
            heros: r.heros,         //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
            heroIds: heroIds        //奖励式神的id
        };
    }),
    /**关卡奖励配置 */
    pointAward: new DataItem('cfg_point_award', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.onceitems = JSON.parse(r.onceitems.trim() || "[]");
        r.onceitems = r.onceitems.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.id,               //塔层编号
            point: r.point,         //领奖需要通过的关卡数 
            stageid: r.stageid,    //大关卡id   
            items: r.items,         //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id            
            heros: r.heros,         //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
            heroIds: heroIds,       //奖励式神的id
            onceitems: r.onceitems  //一次充值25元通关的额外奖励
        };
    }),
    /**签到奖励表配置 */
    signAward: new DataItem('cfg_sign_award', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.items1 = JSON.parse(r.items1.trim() || "[]");
        r.items1 = r.items1.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        return {
            id: r.id,         //签到天数        
            items: r.items,         //签到物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id      
            items1: r.items1,       //累计签到物品奖励
            vipflag: r.vipflag,  //是否可vip双倍领奖      
        };
    }),
    /**
     * 式神碎片雨的掉落数量配置
     */
    heroPieceRain: new DataItem('cfg_heropiece_rain', function (r) {
        return {
            id: r.point,/*搜索键*/
            num: r.num,
            rnum: r.rnum,
            srnum: r.srnum,
            ssrnum: r.ssrnum,
            rssrnum: r.rssrnum
        };
    }),

    /**精英BOss奖励表配置 */
    bossCombat: new DataItem('cfg_point_boss', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.stageId,           //*搜索键*/ 
            stageId: r.stageId,      //*用来返绐客户端的id*/ 
            pointId: r.pointId,      //*关卡Id*/ 
            monsterId: r.monsterId,  //精英BOss挑战对应的BossId  
            items: r.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            heros: r.heros,          //式神奖励
            heroIds: heroIds         //奖励式神的id
        };
    }),

    /**vip特权表配置 */
    vipPrivilege: new DataItem('cfg_vip_privilege', function (r) {
        r.award = JSON.parse(r.award.trim() || "[]");
        r.award = r.award.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        return {
            id: r.id,                       //*搜索键*/ 
            viplev: r.viplev,
            rechargenum: r.rechargenum,         //*所需累计充值金额*/ 
            exp: r.exp,                         //*挂机exp收益加成*/ 
            gold: r.gold,                       //挂机金币收益加成  
            lotterymoney: r.lotterymoney,       //抽奖所需代币打折
            lotteryxp: r.lotteryxp,             //XP抽奖所需值减少
            exchange: r.exchange,               //快捷道具打折
            bosscombat: r.bosscombat,           //精英BOSS每天扫荡礼包数量
            heropiecespeed: r.heropiecespeed,   //妖怪雨的下落速度缓慢
            award: r.award,                     //Vip每日可领取奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            signaward: r.signaward,             //Vip签到倍率拿奖励
            accusignaward: r.accusignaward      //Vip累计签到倍率拿奖励
        };
    }),

    /**精英BOss奖励表配置 */
    firstOnlineAward: new DataItem('cfg_online_award', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.id,           //*搜索键*/ 
            type: r.type,      //*类型*/ 
            typeid: r.typeid,   //*类型id*/ 
            time: r.time,
            items: r.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            heros: r.heros,          //式神奖励
            heroIds: heroIds         //奖励式神的id
        };
    }),

    /**充值返利奖励配置 */
    rechargeRebateAward: new DataItem('cfg_recharge_rebate', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.id,               //*搜索键*/ 
            type: r.type,           //*返利类型*/ 
            typeid: r.typeid,       //*充值档次*/ 
            money: r.money,         //充值金额   
            items: r.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            heros: r.heros,         //式神奖励
            times: r.times,           //次数
            rebatetype: r.rebatetype  //充值类型，1：当日充值 2：全生涯充值
        };
    }),
    /**充值返利奖励配置 */
    lifeLike: new DataItem('cfg_lifelike', function (r) {
        var item = {
            id: r.id,/*搜索键*/
            level: r.id,
            lifeLike: r.lifelike,
            probsArr: []
        };
        if (r.hp) item.probsArr.push({probtype: consts.Enums.LifeLikeIncType.Hp, value: r.hp, weight:r.prob1});
        if (r.attack) item.probsArr.push({probtype: consts.Enums.LifeLikeIncType.Attack, value: r.attack, weight: r.prob2});
        if (r.hit) item.probsArr.push({probtype: consts.Enums.LifeLikeIncType.Hit, value: r.hit, weight:r.prob3});
        if (r.dodge) item.probsArr.push({probtype: consts.Enums.LifeLikeIncType.Dodge, value: r.dodge, weight:r.prob4});
        if (r.speed) item.probsArr.push({probtype: consts.Enums.LifeLikeIncType.Speed, value: r.speed, weight:r.prob5});
        return item;
    }),
    /**世界boss配置表 */
    worldBoss: new DataItem('cfg_world_boss', function (r) {
        return {
            id: r.id,               //*搜索键*/ 
            weekday: r.weekday,           //*返利类型*/ 
            monsterid: r.monsterid,       //*对应的怪物id*/ 
            items: r.items,         //参与奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            money: r.money,         //增加一次挑战次数需求的代币
        };
    }),
    /**世界boss排名奖励表 */
    worldBossAward: new DataItem('cfg_world_boss_award', function (r) {
        return {
            id: r.id,               //*搜索键*/ 
            bossid: r.bossid,           //*bossid*/ 
            rank: r.rank,       //*名次*/ 
            items: r.items,         //排名奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
        };
    }),

    /**排位赛奖励配置 */
    rankedGameAward: new DataItem('cfg_ranked_game_award', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });
        
        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.id,               //*搜索键*/ 
            rank: r.rank,           //名次 
            money: r.money,         //赠送代币   
            items: r.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            heros: r.heros,         //式神奖励
        };
    }),

    /**机器人配置 */
    robot: new DataItem('cfg_robot', function (r) {
        return {
            id: r.robotId,               //*搜索键*/ 
            robotId: r.robotId,     //机器人ID 
            name: r.name,           //机器人昵称   
            monsterId: r.monsterId,         //机器人对应的怪物ID
            headerCode: r.headerCode,        //机器人头像编码
        };
    }),

    /**关卡第一次抽奖升级奖励配置 */
    pointLotteryUpdateAward: new DataItem('cfg_point_lottery_update_award', function (r) {
        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.pointid,               //*搜索键*/ 
            pointid: r.pointid,       //*关卡id*/ 
            money: r.money,           //*需充值金额*/ 
            heros: r.heros,         //*升级后的式神奖励*/ 
            heroIds: heroIds         //奖励式神的id
        };
    }),

    /**关卡抽奖随机奖励配置 */
    pointLotteryRandomAward: new DataItem('cfg_point_lottery_random_award', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }

        return {
            id: r.id,               //*搜索键*/ 
            pointid: r.pointid,               //*关卡id*/ 
            items: r.items,           //*物品奖励*/ 
            heros: r.heros,         //*式神奖励*/ 
            weight: r.weight        //*权重*/ 
        };
    }),

    /**关卡抽奖升级配置 */
    pointLotteryUpdate: new DataItem('cfg_point_lottery_update', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        return {
            id: r.pointid * 100 + r.level,               //*搜索键*/ 
            pointid: r.pointid,               //*关卡id*/ 
            items: r.items,           //*升级材料*/ 
            level: r.level,          //*关卡抽奖等级*/ 
            cd: r.cd,          //*关卡抽奖cd*/ 
            times: r.times,          //*关卡抽奖次数*/ 
            weight: r.weight        //*权重*/ 
        };
    }),
    /**精英BOss奖励表配置 */
    moneyRoulette: new DataItem('cfg_money_roulette', function (r) {
        return {
            id: r.id,           //*搜索键*/ 
            money: r.money,      //*抽奖花费的勾玉*/ 
            awardmoney: r.awardmoney,   //*抽奖得到的勾玉*/ 
            awardmoney1: r.awardmoney1,    //保护值限制后得到勾玉
            weight: r.weight,         //比重
            protectmoney: r.protectmoney,     //保护值（player.money - money + awardmoney < procetmoney） 时，些档才会得到，反之不会。
            nextmoney: r.nextmoney         //下一档花费的勾玉
        };
    }),

    /**日常任务配置 */
    dailyTask: new DataItem('cfg_daily_task', function (r) {
        return {
            id: r.id,           //*搜索键*/ 
            type: r.type,      //*类型*/ 
            activity: r.activity,
            limit: r.limit
        };
    }),

    /**日常任务奖励配置 */
    dailyTaskAward: new DataItem('cfg_daily_task_award', function (r) {

        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }
        return {
            id: r.id,           //*搜索键*/ 
            activity: r.activity,           //要求活跃值   
            remedialPrice: r.remedialPrice, //补领价格
            items: r.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            heros: r.heros,          //式神奖励
            heroIds: heroIds         //奖励式神的id
        };
    }),

    /**成就任务配置 */
    achieveTask: new DataItem('cfg_achieve_task', function (r) {
        r.items = JSON.parse(r.items.trim() || "[]");
        r.items = r.items.select((t) => {
            return parseAndCreateItem(t.itemId, t.num);
        });

        r.heros = JSON.parse(r.heros.trim() || "[]");
        let heroIds = [];

        for (let i = 0; i < r.heros.length; i++) {
            let hero = r.heros[i];
            for (let j = 0; j < (hero.num || 1); j++) {
                heroIds.push(hero.heroId);
            }
        }
        return {
            id: r.id,           //*搜索键*/ 
            type: r.type,           //*成就类型*/
            score: r.score,           //成就达成需求值   
            items: r.items,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            heros: r.heros,          //式神奖励
            heroIds: heroIds         //奖励式神的id
        };
    }),

    /**以下是扩展方法 */
    load: function () {
        if (this.isLoaded) return;

        this.isLoaded = true;
        async.waterfall([function (cb) {
            ConfigCache.cfg.load(cb);
        }, function (cb) {
            ConfigCache.const.load(cb);
        }, function (cb) {
            ConfigCache.monster.load(cb);
        }, function (cb) {
            ConfigCache.character.load(cb);
        }, function (cb) {
            ConfigCache.checkpoint.load(cb);
        }, function (cb) {
            ConfigCache.onlineLottery.load(cb);
        }, function (cb) {
            ConfigCache.item.load(cb);
        }, function (cb) {
            ConfigCache.hero.load(cb);
        }, function (cb) {
            ConfigCache.roleCost.load(cb);
        }, function (cb) {
            ConfigCache.skill.load(cb);
        }, function (cb) {
            ConfigCache.skillState.load(cb);
        }, function (cb) {
            ConfigCache.heroLottery.load(cb);
        }, function (cb) {
            ConfigCache.lotteryCost.load(cb);
        }, function (cb) {
            ConfigCache.goblin.load(cb);
        }, function (cb) {
            ConfigCache.heroSmelt.load(cb);
        }, function (cb) {
            ConfigCache.lvCost.load(cb);
        }, function (cb) {
            ConfigCache.starlvCost.load(cb);
        }, function (cb) {
            ConfigCache.propCost.load(cb);
        }, function (cb) {
            ConfigCache.skillCost.load(cb);
        }, function (cb) {
            ConfigCache.shop.load(cb);
        }, function (cb) {
            ConfigCache.shopHeroPool.load(cb);
        }, function (cb) {
            ConfigCache.itemLottery.load(cb);
        }, function (cb) {
            ConfigCache.illustrated.load(cb);
        }, function (cb) {
            ConfigCache.illAch.load(cb);
        }, function (cb) {
            ConfigCache.card.load(cb);
        }, function (cb) {
            ConfigCache.task.load(cb);
        }, function (cb) {
            ConfigCache.recharge.load(cb);
        }, function (cb) {
            ConfigCache.tower.load(cb);
        }, function (cb) {
            ConfigCache.pointAward.load(cb);
        }, function (cb) {
            ConfigCache.signAward.load(cb);
        }, function (cb) {
            ConfigCache.heroPieceRain.load(cb);
        }, function (cb) {
            ConfigCache.bossCombat.load(cb);
        }, function (cb) {
            ConfigCache.vipPrivilege.load(cb);
        }, function (cb) {
            ConfigCache.firstOnlineAward.load(cb);
        }, function (cb) {
            ConfigCache.rechargeRebateAward.load(cb);
        }, function (cb) {
            ConfigCache.lifeLike.load(cb);
        }, function (cb) {
            ConfigCache.rankedGameAward.load(cb);
        }, function (cb) {
            ConfigCache.robot.load(cb);
        }, function (cb) {
            ConfigCache.worldBoss.load(cb);
        }, function (cb) {
            ConfigCache.worldBossAward.load(cb);
        }, function (cb) {
            ConfigCache.pointLotteryUpdateAward.load(cb);
        }, function (cb) {
            ConfigCache.pointLotteryRandomAward.load(cb);
        }, function (cb) {
            ConfigCache.pointLotteryUpdate.load(cb);
        }, function (cb) {
            ConfigCache.moneyRoulette.load(cb);
        }, function (cb) {
            ConfigCache.dailyTask.load(cb);
        }, function (cb) {
            ConfigCache.dailyTaskAward.load(cb);
        }, function (cb) {
            ConfigCache.achieveTask.load(cb);
        }], function (err) {
            if (!!err) {
                logger.error('config cache load error:%s', err.stack);
            }
        });
    },

    //导入config表的配置
    set: function (next) {
        logger.debug('timer is runing : ' + Date.now());
        dbLoader.getConfig('config', function (err, res) {  //获取config表数据
            if (!!err) {
                logger.error('config cache load error:%s', err.stack);
            }
            _ConfigCache = configUpdate(_ConfigCache, res);   //初次全部加载，以后更新版本号不同的
            //logger.info('update ' + _ConfigCache['cfg_checkpoint'].name + '-' + _ConfigCache['cfg_checkpoint'].version);

            utils.invokeCallback(next, null, true);
        });
    },



    get: {
        const: function (id, lv) {
            let tbData = ConfigFormat.const(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        character: function (id, lv) {
            let tbData = ConfigFormat.character(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        checkpoint: function (id, lv) {
            let tbData = ConfigFormat.checkpoint(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        onlineLottery: function (id, lv) {
            let tbData = ConfigFormat.onlineLottery(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        item: function (id, lv) {
            let tbData = ConfigFormat.item(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        monster: function (id, lv) {
            let tbData = ConfigFormat.monster(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        hero: function (id, lv) {
            let tbData = ConfigFormat.hero(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        roleCost: function (id, lv) {
            let tbData = ConfigFormat.roleCost(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        skill: function (id, lv) {
            let tbData = ConfigFormat.skill(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        skillState: function (id, lv) {
            let tbData = ConfigFormat.skillState(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        heroLottery: function (id, lv) {
            let tbData = ConfigFormat.heroLottery(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        lotteryCost: function (id, lv) {
            let tbData = ConfigFormat.lotteryCost(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        goblin: function (id, lv) {
            let tbData = ConfigFormat.goblin(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        heroSmelt: function (id, lv) {
            let tbData = ConfigFormat.heroSmelt(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        lvCost: function (id, lv) {
            let tbData = ConfigFormat.lvCost(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        starlvCost: function (id, lv) {
            let tbData = ConfigFormat.starlvCost(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        propCost: function (id, lv) {
            let tbData = ConfigFormat.propCost(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        skillCost: function (id, lv) {
            let tbData = ConfigFormat.skillCost(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        shop: function (id, lv) {
            let tbData = ConfigFormat.shop(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        itemLottery: function (id, lv) {
            let tbData = ConfigFormat.itemLottery(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        shopHeroPool: function (id, lv) {
            let tbData = ConfigFormat.shopHeroPool(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        illustrated: function (id, lv) {
            let tbData = ConfigFormat.illustrated(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        illAch: function (id, lv) {
            let tbData = ConfigFormat.illAch(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        card: function (id, lv) {
            let tbData = ConfigFormat.card(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        task: function (id, lv) {
            let tbData = ConfigFormat.task(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        recharge: function (id, lv) {
            let tbData = ConfigFormat.recharge(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        rechargeRebateAward: function (id, lv) {
            let tbData = ConfigFormat.rechargeRebateAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        tower: function (id, lv) {
            let tbData = ConfigFormat.tower(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        pointAward: function (id, lv) {
            let tbData = ConfigFormat.pointAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        signAward: function (id, lv) {
            let tbData = ConfigFormat.signAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        heroPieceRain: function (id, lv) {
            let tbData = ConfigFormat.heroPieceRain(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        bossCombat: function (id, lv) {
            let tbData = ConfigFormat.bossCombat(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        vipPrivilege: function (id, lv) {
            let tbData = ConfigFormat.vipPrivilege(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        firstOnlineAward: function (id, lv) {
            let tbData = ConfigFormat.firstOnlineAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
        worldBoss: function(id, lv){
            let tbData = ConfigFormat.worldBoss(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey( tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        worldBossAward: function(id, lv){
            let tbData = ConfigFormat.worldBossAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey( tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        rankedGameAward: function(id, lv){
            let tbData = ConfigFormat.rankedGameAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey( tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        robot: function(id, lv){
            let tbData = ConfigFormat.robot(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey( tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        lifeLike: function(id, lv){
            let tbData = ConfigFormat.lifeLike(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey( tbData, id, lv); //根据提供的key获取对应的记录
            return record;        
        },
        pointLotteryUpdateAward: function (id, lv) {
            let tbData = ConfigFormat.pointLotteryUpdateAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        pointLotteryRandomAward: function (id, lv) {
            let tbData = ConfigFormat.pointLotteryRandomAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        pointLotteryUpdate: function (id, lv) {
            let tbData = ConfigFormat.pointLotteryUpdate(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        dailyTask: function (id, lv) {
            let tbData = ConfigFormat.dailyTask(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        dailyTaskAward: function (id, lv) {
            let tbData = ConfigFormat.dailyTaskAward(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },

        achieveTask: function (id, lv) {
            let tbData = ConfigFormat.achieveTask(_ConfigCache);   //获取指定表格数据并格式化
            record = getByKey(tbData, id, lv); //根据提供的key获取对应的记录
            return record;
        },
    },

    getAll: {

        const: function () {
            let tbData = ConfigFormat.const(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        character: function () {
            let tbData = ConfigFormat.character(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        checkpoint: function () {
            let tbData = ConfigFormat.checkpoint(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        onlineLottery: function () {
            let tbData = ConfigFormat.onlineLottery(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        item: function () {
            let tbData = ConfigFormat.item(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        monster: function () {
            let tbData = ConfigFormat.monster(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        hero: function () {
            let tbData = ConfigFormat.hero(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        roleCost: function () {
            let tbData = ConfigFormat.roleCost(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        skill: function () {
            let tbData = ConfigFormat.skill(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        skillState: function () {
            let tbData = ConfigFormat.skillState(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        heroLottery: function () {
            let tbData = ConfigFormat.heroLottery(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        lotteryCost: function () {
            let tbData = ConfigFormat.lotteryCost(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        goblin: function () {
            let tbData = ConfigFormat.goblin(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        heroSmelt: function () {
            let tbData = ConfigFormat.heroSmelt(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        lvCost: function () {
            let tbData = ConfigFormat.lvCost(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        starlvCost: function () {
            let tbData = ConfigFormat.starlvCost(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        propCost: function () {
            let tbData = ConfigFormat.propCost(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        skillCost: function () {
            let tbData = ConfigFormat.skillCost(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        shop: function () {
            let tbData = ConfigFormat.shop(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        itemLottery: function () {
            let tbData = ConfigFormat.itemLottery(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        shopHeroPool: function () {
            let tbData = ConfigFormat.shopHeroPool(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        illustrated: function () {
            let tbData = ConfigFormat.illustrated(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        illAch: function () {
            let tbData = ConfigFormat.illAch(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        card: function () {
            let tbData = ConfigFormat.card(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        task: function () {
            let tbData = ConfigFormat.task(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        recharge: function () {
            let tbData = ConfigFormat.recharge(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        rechargeRebateAward: function () {
            let tbData = ConfigFormat.rechargeRebateAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        tower: function () {
            let tbData = ConfigFormat.tower(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        pointAward: function () {
            let tbData = ConfigFormat.pointAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        signAward: function () {
            let tbData = ConfigFormat.signAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        heroPieceRain: function () {
            let tbData = ConfigFormat.heroPieceRain(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        bossCombat: function () {
            let tbData = ConfigFormat.bossCombat(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        vipPrivilege: function () {
            let tbData = ConfigFormat.vipPrivilege(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        firstOnlineAward: function () {
            let tbData = ConfigFormat.firstOnlineAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },
        worldBoss: function () {
            let tbData = ConfigFormat.worldBoss(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll( tbData ); //根据提供的key获取对应的记录
            return records;
        },

        lifeLike: function () {
            let tbData = ConfigFormat.lifeLike(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll( tbData ); //根据提供的key获取对应的记录
            return records;
        },

        rankedGameAward: function () {
            let tbData = ConfigFormat.rankedGameAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll( tbData ); //根据提供的key获取对应的记录
            return records;
        },

        robot: function () {
            let tbData = ConfigFormat.robot(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll( tbData ); //根据提供的key获取对应的记录
            return records;
        },

        worldBossAward: function () {
            let tbData = ConfigFormat.worldBossAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll( tbData ); //根据提供的key获取对应的记录
            return records;
        },

        pointLotteryUpdateAward: function () {
            let tbData = ConfigFormat.pointLotteryUpdateAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        pointLotteryRandomAward: function () {
            let tbData = ConfigFormat.pointLotteryRandomAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        pointLotteryUpdate: function () {
            let tbData = ConfigFormat.pointLotteryUpdate(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        dailyTask: function () {
            let tbData = ConfigFormat.dailyTask(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        dailyTaskAward: function () {
            let tbData = ConfigFormat.dailyTaskAward(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },

        achieveTask: function () {
            let tbData = ConfigFormat.achieveTask(_ConfigCache);  //获取指定表格数据并格式化
            records = getTableAll(tbData); //根据提供的key获取对应的记录
            return records;
        },
    },


    getVar: {
        const: function (id, num) {
            let tbData = ConfigFormat.const(_ConfigCache);   //获取指定表格数据并格式化
            var obj = getByKey(tbData, id) || { num: num || 0 };
            return obj.num;
        }
    },
    getItem: {

        item: function (id, num) {
            let tbData = ConfigFormat.item(_ConfigCache);   //获取指定表格数据并格式化
            if (getByKey(tbData, id)) {
                return parseAndCreateItem(id, num);
            }
        }
    },


    items: function () {
        let tbData = ConfigFormat.item(_ConfigCache);   //获取指定表格数据并格式化
        records = getItems(tbData); //调整格式
        return records;
    },
    //配置缓存变动监听    
    refreshTimer: function () {
        var refreshTime = ConfigCache.getVar.const(consts.Keys.CACHE_UPDATE_TIME) ? ConfigCache.getVar.const(consts.Keys.CACHE_UPDATE_TIME) : 60 * 1000;
        setInterval(
            this.set,
            refreshTime
        );
    }

};


module.exports = ConfigCache;

DataItem.prototype.load = function (next) {
    var self = this;
    self.data = {};
    dbLoader.load(self.table, function (err, res) {
        self.isLoaded = true;
        if (!!err) {
            self.loadError = err;
            utils.invokeCallback(next, err);
            return;
        }
        logger.info(self.data);
        for (var i = 0; i < res.length; i++) {
            var r = res[i];
            var item = self.parser(r);
            if (item && item.id) {
                self.data[item.id] = item;
            }
        }
        utils.invokeCallback(next, null);
    });
};



/* 
DataItem.prototype.all = function (cb) {
    var self = this;
    if (self.isLoaded) {
        cb(self.loadError, self.data);
        return;
    }

    self.load(function (err) {
        cb(err, self.data);
    });
};

DataItem.prototype.findId = function (id, cb) {
    this.all(function (err, items) {
        if (!!err || !items) {
            cb(err, null);
            return;
        }
        cb(null, items[id]);
    });
};
*/

/**
 * get id from cache
 * @return {object}
 */
DataItem.prototype.get = function (id, lv) {
    if (!!this.loadError) {
        throw 'error:' + loadError;
    }
    var key = lv ? id + '_' + lv : id;
    return this.data[key];
};

/**
 * get all from cache
 */
DataItem.prototype.getAll = function () {
    if (!!this.loadError) {
        throw 'error:' + loadError;
    }
    return this.data;
};

/**
 * get var from cache
 */
DataItem.prototype.getVar = function (id, num) {
    var obj = this.get(id) || { num: num || 0 };
    return obj.num;
};


/**
 * get all from cache
 */
DataItem.prototype.getItem = function (id, num) {
    if (!!this.loadError) {
        throw 'error:' + loadError;
    }
    if (this.data[id]) {
        return parseAndCreateItem(id, num);
    }
    throw 'Not found item:' + id;
};

var parseMonsterSkill = function (skill) {
    if ('string' === typeof skill) {
        skill = JSON.parse(skill);
    }
    var res = [];
    skill.forEach(function (el) {
        res.push({
            id: parseInt(el / 100) * 100, //54001
            lv: (el % 100),
            pos: res.length + 1
        });
    }, this);

    return res;
};

/**
 * 创建物品对象
 * @param {number} item item id
 * @param {number} num 
 * @param {number} weight 
 */
var parseAndCreateItem = function (item, num, weight) {
    /*以前5位ID和第6位组成（如物品ID为111，类型为物品：则组合为：400111）
    1为金币，后5位写0，数量写在num上
    2为经验，后5位写0，数量写在num上
    3为代币，后5位写0，数量写在num上
    >3为物品，后5位写物品ID，数量写在num上    
    编号全局定义，400111 也是物品ID
    */
    var itemType = utils.getItemType(item);
    if (weight) {
        return {
            id: item,
            //itemId: itemId,
            type: itemType,
            weight: weight,
            num: num || 1
        };
    }

    return {
        id: item,
        //itemId: itemId,
        type: itemType,
        num: num || 0
    };
};


/**
 * config数据更新
 * @param {number} origin old config data
 * @param {number} newData new config data
 */
var configUpdate = function (origin, newData) {

    for (var i = 0; i < newData.length; i++) {

        let item = newData[i];

        //出现新的配置信息，则插入
        if (!origin[item.name]) {
            origin[item.name] = item;
            origin[item.name].data = JSON.parse(item.data);
            logger.debug('add a new config : ' + item.name);
        }

        //比对版本号，并更新最新版本数据
        else if (origin[item.name].version < item.version) {
            origin[item.name].data = JSON.parse(item.data);
            origin[item.name].version = item.version;
            //origin[item.name].data = item.data;
            logger.debug('update a new config : ' + item.name);
        }

    }
    return origin;
}


/**
  * _根据提供的key获取记录
  * @param {number} data 格式化后的数据表
  * @param {number} id id
  * @param {number} lv lv
*/
var getByKey = function (data, id, lv) {
    var key = lv ? id + '_' + lv : id;
    return data[key];
}

/**
  * 获取某表所有记录
  * @param {number} table 表名
*/
var getTableAll = function (table) {
    var res = {};
    for (var i in table) {
        if (i != 0) {
            res[i] = table[i];
        }
    }
    return res;
}


/**
  * 调整某表所有记录的格式，主key为data, 并插入get方法
  * @param {number} table 表名
*/
getItems = function (table) {
    var res = {};
    res.data = {};
    for (var i in table) {
        if (i != 0) {
            res.data[i] = table[i];
        }
    }

    res.get = function (id) {
        let tbData = ConfigFormat.item(_ConfigCache);   //获取指定表格数据并格式化
        record = getByKey(tbData, id); //根据提供的key获取对应的记录
        return record;
    }

    return res;
}




var dbLoader = require('./dbLoader');
var utils = require('../util/utils');
var async = require('async');
var logger = require('pomelo-logger').getLogger(__filename);
var consts = require('../util/consts');
var arrayUtil = require('../util/arrayUtil');

var ConfigFormat = {
    
    const: function(data){
        var items = {};
        if(data['cfg_const'])
        {
            data['cfg_const'].data.forEach(function(r){
                let item = {
                    id: r.name,
                    descp: r.descp,
                    num: r.num,
                };
                items[item.id] = item;
            })
        }
        
        return items;
    },

    character: function(data){
        var items = {};
        data['cfg_character'].data.forEach(function(r){
            let item = {
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
            items[item.id] = item;
        })
        return items;
    },

    checkpoint: function(data){
        var items = {};
        data['cfg_checkpoint'].data.forEach(function(r){
            let item = {
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
    
            items[item.id] = item;
        })
        return items;
    },

    onlineLottery: function(data){
        var items = {};
        data['cfg_online_lottery'].data.forEach(function(r){
            let item = {
                id: r.item_id,
                itemId: r.item_id,
                weight: r.weight
            };
    
            items[item.id] = item;
        })
        return items;
    },

    item: function(data){
        var items = {};
        data['cfg_item'].data.forEach(function(r){
            let item = {
                id: r.id,
                name: r.name,
                type: r.type,   //物品类型 0：道具物品 1：材料物品
                quality: r.quality,
                gold: r.gold,
                max: r.max_num,
                logicType: r.logic_type,
                logicIds: r.logic_ids,
                logicNums: r.logic_nums,
                costIds: r.cost_ids,
                costNums: r.cost_nums,
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
                useScript: r.use_script,
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
    
            items[item.id] = item;
        })
        return items;
    },

    monster: function(data){
        var items = {};
        data['cfg_monster'].data.forEach(function(r){
            let item = {
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
            items[item.id] = item;
        })
        return items;
    },

    hero: function(data){
        var items = {};
        data['cfg_hero'].data.forEach(function(r){
            let item = {
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
            items[item.id] = item;
        })
        return items;
    },

    roleCost: function(data){
        var items = {};
        data['cfg_role_cost'].data.forEach(function(r){
            let item = {
                id: r.type + '_' + r.lv,/*搜索键*/
                type: r.type,
                lv: r.lv,
                item: r.item,
                num: r.num
            };
            items[item.id] = item;
        })
        return items;
    },

    skill: function(data){
        var items = {};
        data['cfg_hero_skill'].data.forEach(function(r){
            let item = {
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
                target: r.target,//施放目标 1:对方,2:己方
                descp: r.descp,//施放目标 1:对方,2:己方
            };
            items[item.id] = item;
        })
        return items;
    },

    skillState: function(data){
        var items = {};
        data['cfg_skill_state'].data.forEach(function(r){
            let item = {
                id: r.id,/*搜索键*/
                name: r.name,
                type: r.type,
                weight: r.weight
            };
            items[item.id] = item;
        })
        return items;
    },

    heroLottery: function(data){
        var items = {};
        data['cfg_hero_lottery'].data.forEach(function(r){
            let item = {
                id: r.id,/*搜索键*/
                type: r.type,
                heroId: r.hero_id,
                weight: r.weight
            };
            items[item.id] = item;
        })
        return items;
    },

    lotteryCost: function(data){
        var items = {};
        data['cfg_lottery_cost'].data.forEach(function(r){
            let item = {
                id: r.type,/*搜索键*/
                type: r.type,
                item: r.item,
                num: r.num,
                freeNum: r.free_num,
                ratio: r.ratio,     //金币上涨系数
                xp_num: r.xp_num    //消耗后添加xp的值
            };
            items[item.id] = item;
        })
        return items;
    },

    goblin: function(data){
        var items = {};
        data['cfg_goblin'].data.forEach(function(r){
            let item = {
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
    
            items[item.id] = item;
        })
        return items;
    },

    heroSmelt: function(data){
        var items = {};
        data['cfg_hero_smelt'].data.forEach(function(r){
            let item = {
                id: r.id,/*搜索键*/
                quality: r.quality,
                fragment: r.fragment,
                lotteryRatio: r.lotteryRatio,
                lotteryType: r.lotteryType
            };
            items[item.id] = item;
        })
        return items;
    },

    lvCost: function(data){
        var items = {};
        data['cfg_lv_cost'].data.forEach(function(r){
            let item = {
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
    
            items[item.id] = item;
        })
        return items;
    },

    starlvCost: function(data){
        var items = {};
        data['cfg_starlv_cost'].data.forEach(function(r){
            let item = {
                id: r.starLv,/*搜索键*/
                items: []
            };
            
            if (r.item1) item.items.push(parseAndCreateItem(r.item1, r.num1));
            if (r.item2) item.items.push(parseAndCreateItem(r.item2, r.num2));
            if (r.item3) item.items.push(parseAndCreateItem(r.item3, r.num3));
            if (r.item4) item.items.push(parseAndCreateItem(r.item4, r.num4));
            if (r.item5) item.items.push(parseAndCreateItem(r.item5, r.num5));
    
            items[item.id] = item;
        })
        return items;
    },

    propCost: function(data){
        var items = {};
        data['cfg_prop_cost'].data.forEach(function(r){
            let item = {
                id: r.lv,/*搜索键*/
                lv: r.lv,
                items: []
            };
    
            if (r.item1) item.items.push(parseAndCreateItem(r.item1, r.num1));
            if (r.item2) item.items.push(parseAndCreateItem(r.item2, r.num2));
            if (r.item3) item.items.push(parseAndCreateItem(r.item3, r.num3));
            if (r.item4) item.items.push(parseAndCreateItem(r.item4, r.num4));
            if (r.item5) item.items.push(parseAndCreateItem(r.item5, r.num5));
    
            items[item.id] = item;
        })
        return items;
    },

    skillCost: function(data){
        var items = {};
        data['cfg_skill_cost'].data.forEach(function(r){
            let item = {
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
    
            items[item.id] = item;
        })
        return items;
    },

    shop: function(data){
        var items = {};
        data['cfg_shop'].data.forEach(function(r){
            let item = {
                id: r.item_id,/*搜索键*/
                itemId: r.item_id,
                type: r.type,
                price: r.price
            };
            items[item.id] = item;
        })
        return items;
    },

    itemLottery: function(data){
        var items = {};
        data['cfg_item_lottery'].data.forEach(function(r){
            let item = {
                id: r.id,/*搜索键*/
                type: r.type,
                itemId: r.item_id,
                num: r.num,
                weight: r.weight,
                item: parseAndCreateItem(r.item_id, r.num),  //获得的物品信息
            };
            items[item.id] = item;
        })
        return items;
    },

    shopHeroPool: function(data){
        var items = {};
        data['cfg_shop_hero_pool'].data.forEach(function(r){
            let item = {
                id: r.hero_id,/*搜索键*/
                heroId: r.hero_id,
                weight: r.weight,
                fragment: r.fragment
            };
            items[item.id] = item;
        })
        return items;
    },

    illustrated: function(data){
        var items = {};
        data['cfg_hero_illustrated'].data.forEach(function(r){
            let item = {
                id: r.quality,/*搜索键*/
                power: r.power
            };
            items[item.id] = item;
        })
        return items;
    },

    illAch: function(data){
        var items = {};
        data['cfg_ill_ach'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }

            let skillId = 0, skillLv = 0;
            if (!!r.skillIdLv && r.skillIdLv.length > 0)
            {
                skillId = r.skillIdLv[0];
                skillLv = r.skillIdLv[1];
            }
    
            let item = {
                id: r.id,                   //成就编号            
                needHeroIds: r.needHeroIds, //完成成就需要的式神
                items: tempItems,             //物品奖励
                heros: r.heros,             //式神奖励
                heroIds: heroIds,            //奖励式神的id
                skillId: skillId,           //获取的被动技能ID
                skillLv: skillLv,           //获取的被动技能等级
            };
    
            items[item.id] = item;
        })
        return items;
    },

    card: function(data){
        var items = {};
        data['cfg_card'].data.forEach(function(r){
            let tempBuyAward = r.buyAward.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let tempEvydayAward = r.evydayAward.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let item = {
                id: r.type,                 //卡类型 1:月卡 2:终身卡
                price: r.price,             //价格,单位:分
                buyAward: tempBuyAward,       //购买时的奖品
                evydayAward: tempEvydayAward  //每日可领的奖品
            };
            
            items[item.id] = item;
        })
        return items;
    },

    task: function(data){
        var items = {};
        data['cfg_task'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,                   //Id
                type: r.type,               //类型 1:通过关卡 2:上阵式神 3:达成等级的阵位 4:达到进化等级的阵位 5:达到强化等级的宝具 6:达到战斗力
                condition: r.condition,     //达成条件,与type关联 type为1:关卡ID 为2:上阵式神数 为3:阵位数量 为4:阵位数量 为5:宝具数量 为6:战斗力值
                condition2: r.condition2,   //达成条件2,与type关联 type为3:阵位等级 为4:阵位的进化等级 为5:宝具的强化等级
                nextTaskId: r.nextTaskId,   //下个任务ID, 0:没有下个任务
                items: tempItems,             //物品奖励
                heros: r.heros,             //式神奖励
                heroIds: heroIds            //奖励式神的id
            };
            
            items[item.id] = item;
        })
        return items;
    },

    recharge: function(data){
        var items = {};
        data['cfg_recharge'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,                   //10001:首充奖励
                needMoney: r.needMoney,     //领取奖励需要的充值金额(单位:分),首充为0
                nextId: r.nextId,           //下个充值奖励的id, 0:没有下个奖励            
                items: tempItems,             //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: r.heros,             //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
                heroIds: heroIds            //奖励式神的id
            };
            
            items[item.id] = item;
        })
        return items;
    },

    rechargeRebateAward: function(data){
        var items = {};
        data['cfg_recharge_rebate'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
            
            let heroIds = [];

            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,               //*搜索键*/ 
                type: r.type,           //*返利类型*/ 
                typeid: r.typeid,       //*充值档次*/ 
                money: r.money,         //充值金额   
                items: tempItems,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: r.heros,         //式神奖励
                times: r.times,           //次数
                rebatetype: r.rebatetype  //充值类型，1：当日充值 2：全生涯充值
            };
            
            items[item.id] = item;
        })
        return items;
    },

    tower: function(data){
        var items = {};
        data['cfg_tower'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,               //塔层编号
                name: r.name,           //塔层名称
                power: r.power,         //塔怪物战斗力
                monsterId: r.monsterId, //怪物阵容ID，即cfg_monster表ID。若不触发战斗，则配置为0。
                exp: r.exp,             //经验奖励数量,必然发放
                gold: r.gold,           //金币奖励数量,必然发放
                itemsProb: r.itemsProb, //获取物品奖励的几率
                items: tempItems,         //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                herosProb: r.herosProb, //获取式神奖励的几率
                heros: r.heros,         //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
                heroIds: heroIds        //奖励式神的id
            };
            
            items[item.id] = item;
        })
        return items;
    },

    pointAward: function(data){
        var items = {};
        data['cfg_point_award'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let tempOnceitems = r.onceitems.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,               //塔层编号
                point: r.point,         //领奖需要通过的关卡数 
                stageid: r.stageid,    //大关卡id   
                items: tempItems,         //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id            
                heros: r.heros,         //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
                heroIds: heroIds,       //奖励式神的id
                onceitems: tempOnceitems  //一次充值25元通关的额外奖励
            };
            
            items[item.id] = item;
        })
        return items;
    },

    signAward: function(data){
        var items = {};
        data['cfg_sign_award'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let tempItems1 = r.items1.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let item = {
                id: r.id,         //签到天数        
                items: tempItems,         //签到物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id      
                items1: tempItems1,       //累计签到物品奖励
                vipflag: r.vipflag,  //是否可vip双倍领奖 
            };
            
            items[item.id] = item;
        })
        return items;
    },

    heroPieceRain: function(data){
        var items = {};
        data['cfg_heropiece_rain'].data.forEach(function(r){
            let item = {
                id: r.point,/*搜索键*/
                num: r.num,
                rnum: r.rnum,
                srnum: r.srnum,
                ssrnum: r.ssrnum,
                rssrnum: r.rssrnum
            };
            items[item.id] = item;
        })
        return items;
    },

    bossCombat: function(data){
        var items = {};
        data['cfg_point_boss'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.stageId,           //*搜索键*/ 
                stageId: r.stageId,      //*用来返绐客户端的id*/ 
                pointId: r.pointId,      //*关卡Id*/ 
                monsterId: r.monsterId,  //精英BOss挑战对应的BossId  
                items: tempItems,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: r.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
            
            items[item.id] = item;
        })
        return items;
    },

    vipPrivilege: function(data){
        var items = {};
        data['cfg_vip_privilege'].data.forEach(function(r){
            let tempAward = r.award.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let item = {
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
                award: tempAward,                     //Vip每日可领取奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                signaward: r.signaward,             //Vip签到倍率拿奖励
                accusignaward: r.accusignaward      //Vip累计签到倍率拿奖励
            };
            
            items[item.id] = item;
        })
        return items;
    },

    firstOnlineAward: function(data){
        var items = {};
        data['cfg_online_award'].data.forEach(function(r){
            tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,           //*搜索键*/ 
                type: r.type,      //*类型*/ 
                typeid: r.typeid,   //*类型id*/ 
                time: r.time,
                items: tempItems,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: r.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
            
            items[item.id] = item;
        })
        return items;
    },

    pointLotteryUpdateAward: function(data){
        var items = {};
        data['cfg_point_lottery_update_award'].data.forEach(function(r){
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.pointid,               //*搜索键*/ 
                pointid: r.pointid,       //*关卡id*/ 
                money: r.money,           //*需充值金额*/ 
                heros: r.heros,         //*升级后的式神奖励*/ 
                heroIds: heroIds         //奖励式神的id
            };
            
            items[item.id] = item;
        })
        return items;
    },

    pointLotteryRandomAward: function(data){
        var items = {};
        data['cfg_point_lottery_random_award'].data.forEach(function(r){
            tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });

            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,               //*搜索键*/ 
                pointid: r.pointid,               //*关卡id*/ 
                items: tempItems,           //*物品奖励*/ 
                heros: r.heros,         //*式神奖励*/ 
                weight: r.weight        //*权重*/ 
            };
            
            items[item.id] = item;
        })
        return items;
    },

    pointLotteryUpdate: function(data){
        var items = {};
        data['cfg_point_lottery_update'].data.forEach(function(r){
            tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let item = {
                id: r.pointid * 100 + r.level,               //*搜索键*/ 
                pointid: r.pointid,               //*关卡id*/ 
                items: tempItems,           //*升级材料*/ 
                level: r.level,          //*关卡抽奖等级*/ 
                cd: r.cd,          //*关卡抽奖cd*/ 
                times: r.times,          //*关卡抽奖次数*/ 
                weight: r.weight        //*权重*/ 
            };
            
            items[item.id] = item;
        })
        return items;
    },

    lifeLike: function(data){
        var items = {};
        data['cfg_lifelike'].data.forEach(function(r){
            let item = {
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
    
            items[item.id] = item;
        })
        return items;
    },
    rankedGameAward: function(data){
        var items = {};
        data['cfg_ranked_game_award'].data.forEach(function(r){
            tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.rank,           //*搜索键*/ 
                rank: r.rank,      
                money: r.money,    
                items: tempItems,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: r.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
            
            items[item.id] = item;
        })
        return items;
    },

    robot: function(data){
        var items = {};
        data['cfg_robot'].data.forEach(function(r){
            let item = {
                id: r.robotId,
                robotId: r.robotId,
                name: r.name,
                monsterId: r.monsterId,
                headerCode: r.headerCode,
            };
            items[item.id] = item;
        })
        return items;
    },

    worldBoss: function(data){
        var items = {};
        data['cfg_world_boss'].data.forEach(function(r){
            let item = {
                id: r.id,               //*搜索键*/ 
                weekday: r.weekday,           //*返利类型*/ 
                monsterid: r.monsterid,       //*对应的怪物id*/ 
                items: r.items,         //参与奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                money: r.money,         //增加一次挑战次数需求的代币
            };
            
            items[item.id] = item;
        })
        return items;
    },
    worldBossAward: function(data){
        var items = {};
        data['cfg_world_boss_award'].data.forEach(function(r){
            let item = {
                id: r.id,               //*搜索键*/ 
                bossid: r.bossid,           //*bossid*/ 
                rank: r.rank,       //*名次*/ 
                items: r.items,         //排名奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
            };
            
            items[item.id] = item;
        })
        return items;
    },
    dailyTask: function(data){
        var items = {};
        data['cfg_daily_task'].data.forEach(function(r){
            let item = {
                id: r.id,/*搜索键*/
                type: r.type,
                activity: r.activity,
                limit: r.limit,
            };
            items[item.id] = item;
        })
        return items;
    },

    dailyTaskAward: function(data){
        var items = {};
        data['cfg_daily_task_award'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,           //*搜索键*/ 
                activity: r.activity,      
                remedialPrice: r.remedialPrice,      
                items: tempItems,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: r.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
    
            items[item.id] = item;
        })
        return items;
    },

    achieveTask: function(data){
        var items = {};
        data['cfg_achieve_task'].data.forEach(function(r){
            let tempItems = r.items.select((t) => {
                return parseAndCreateItem(t.itemId, t.num);
            });
    
            let heroIds = [];
    
            for (let i = 0; i < r.heros.length; i++) {
                let hero = r.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
    
            let item = {
                id: r.id,           //*搜索键*/ 
                type: r.type,      
                score: r.score,      
                items: tempItems,         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: r.heros,          //式神奖励
                heroIds: heroIds         //奖励式神的id
            };
    
            items[item.id] = item;
        })
        return items;
    },
}



module.exports = ConfigFormat;



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
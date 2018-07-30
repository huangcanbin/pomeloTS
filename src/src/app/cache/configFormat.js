Object.defineProperty(exports, "__esModule", { value: true });
const utils = require("../util/utils");
const consts = require("../util/consts");
class ConfigFormat {
    static getInstance() {
        if (!this.instance) {
            this.instance = new ConfigFormat();
        }
        return this.instance;
    }
    constructor() {
        this._utils = utils.Utils.getInstance();
    }
    const(data) {
        let items = {};
        if (data.cfg_const) {
            data.cfg_const.data.forEach((res) => {
                let item = {
                    id: res.name,
                    descp: res.descp,
                    num: res.num,
                };
                items[item.id] = item;
            });
        }
        return items;
    }
    character(data) {
        let items = {};
        data.cfg_character.data.forEach((res) => {
            let item = {
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
            items[item.id] = item;
        });
        return items;
    }
    checkpoint(data) {
        let items = {};
        data.cfg_checkpoint.data.forEach((res) => {
            let item = {
                id: res.point,
                checkpointId: res.id,
                name: res.name,
                exp: res.exp,
                gold: res.gold,
                bossId: res.boss,
                minTime: res.min_ts,
                amount: res.amount,
                items: [],
                addLineup: res.addLineup,
                dropCd: res.drop_cd,
                dropItem: res.drop_item,
                dropPercent: res.drop_percent
            };
            if (res.item1)
                item.items.push(this.parseAndCreateItem(res.item1, res.num1));
            if (res.item2)
                item.items.push(this.parseAndCreateItem(res.item2, res.num2));
            if (res.item3)
                item.items.push(this.parseAndCreateItem(res.item3, res.num3));
            if (res.item4)
                item.items.push(this.parseAndCreateItem(res.item4, res.num4));
            if (res.item5)
                item.items.push(this.parseAndCreateItem(res.item5, res.num5));
            items[item.id] = item;
        });
        return items;
    }
    onlineLottery(data) {
        let items = {};
        data.cfg_online_lottery.data.forEach((res) => {
            let item = {
                id: res.item_id,
                itemId: res.item_id,
                weight: res.weight
            };
            items[item.id] = item;
        });
        return items;
    }
    item(data) {
        let items = {};
        data.cfg_item.data.forEach((res) => {
            let item = {
                id: res.id,
                name: res.name,
                type: res.type,
                quality: res.quality,
                gold: res.gold,
                max: res.max_num,
                logicType: res.logic_type,
                logicIds: res.logic_ids,
                logicNums: res.logic_nums,
                costIds: res.cost_ids,
                costNums: res.cost_nums,
                ids: [],
                nums: [],
                items: [],
                heros: [],
                getGlod: 0,
                getExp: 0,
                getMoney: 0,
                costItems: [],
                costGlod: 0,
                costExp: 0,
                costMoney: 0,
                useScript: res.use_script,
            };
            let ids, nums, id, num;
            switch (res.logic_type) {
                case consts.default.consts.Enums.ItemLogicType.Compose:
                    if (res.cost_ids) {
                        ids = res.cost_ids.split(',');
                        nums = (res.cost_nums || '').split(',');
                        for (let i = 0; i < ids.length; i++) {
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
                                    item.costItems.push(this.parseAndCreateItem(id, num));
                                    break;
                            }
                        }
                        item.items.push(this.parseAndCreateItem(1 * res.logic_ids, 1));
                    }
                    break;
                case consts.default.consts.Enums.ItemLogicType.Item:
                    if (res.logic_ids) {
                        ids = res.logic_ids.split(',');
                        nums = (res.logic_nums || '').split(',');
                        for (let i = 0; i < ids.length; i++) {
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
                                    item.items.push(this.parseAndCreateItem(id, num));
                                    break;
                            }
                        }
                    }
                    break;
                case consts.default.consts.Enums.ItemLogicType.Hero:
                    if (res.logic_ids) {
                        ids = res.logic_ids.split(',');
                        nums = (res.logic_nums || '').split(',');
                        for (let i = 0; i < ids.length; i++) {
                            id = 1 * ids[i];
                            num = 1 * (nums[i] || 1);
                            num = num <= 0 ? 1 : num;
                            item.ids.push(id);
                            item.nums.push(num);
                            for (let j = 0; j < num; j++) {
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
                    item.ids = 1 * res.logic_ids;
                    break;
                default:
                    break;
            }
            items[item.id] = item;
        });
        return items;
    }
    monster(data) {
        let items = {};
        data.cfg_monster.data.forEach((res) => {
            let item = {
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
            items[item.id] = item;
        });
        return items;
    }
    hero(data) {
        var items = {};
        data.cfg_hero.data.forEach((res) => {
            let item = {
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
            items[item.id] = item;
        });
        return items;
    }
    roleCost(data) {
        let items = {};
        data.cfg_role_cost.data.forEach((res) => {
            let item = {
                id: res.type + '_' + res.lv,
                type: res.type,
                lv: res.lv,
                item: res.item,
                num: res.num
            };
            items[item.id] = item;
        });
        return items;
    }
    skill(data) {
        let items = {};
        data.cfg_hero_skill.data.forEach((res) => {
            let item = {
                id: res.skill_id + '_' + res.lv,
                skillId: res.skill_id,
                lv: res.lv,
                name: res.name,
                weight: res.prob,
                precond: res.precond,
                precondNum: res.precond_num,
                passive: res.passive,
                effectType: res.effect_type,
                effectNum: res.effect_num,
                stateType: res.state_type,
                stateNum: res.state_num,
                stateRound: res.state_round,
                target: res.target,
                descp: res.descp,
            };
            items[item.id] = item;
        });
        return items;
    }
    skillState(data) {
        let items = {};
        data.cfg_skill_state.data.forEach((res) => {
            let item = {
                id: res.id,
                name: res.name,
                type: res.type,
                weight: res.weight
            };
            items[item.id] = item;
        });
        return items;
    }
    heroLottery(data) {
        let items = {};
        data.cfg_hero_lottery.data.forEach((res) => {
            let item = {
                id: res.id,
                type: res.type,
                heroId: res.hero_id,
                weight: res.weight
            };
            items[item.id] = item;
        });
        return items;
    }
    lotteryCost(data) {
        let items = {};
        data.cfg_lottery_cost.data.forEach((res) => {
            let item = {
                id: res.type,
                type: res.type,
                item: res.item,
                num: res.num,
                freeNum: res.free_num,
                ratio: res.ratio,
                xp_num: res.xp_num
            };
            items[item.id] = item;
        });
        return items;
    }
    goblin(data) {
        let items = {};
        data.cfg_goblin.data.forEach((res) => {
            let item = {
                id: res.id,
                weight: res.weight,
                point: res.point,
                bean: res.bean,
                time: res.time,
                maxHp: res.maxHp,
                exp: res.exp,
                gold: res.gold,
                items: []
            };
            if (res.item1)
                item.items.push(this.parseAndCreateItem(res.item1, 1, res.prob1));
            if (res.item2)
                item.items.push(this.parseAndCreateItem(res.item2, 1, res.prob2));
            if (res.item3)
                item.items.push(this.parseAndCreateItem(res.item3, 1, res.prob3));
            if (res.item4)
                item.items.push(this.parseAndCreateItem(res.item4, 1, res.prob4));
            if (res.item5)
                item.items.push(this.parseAndCreateItem(res.item5, 1, res.prob5));
            items[item.id] = item;
        });
        return items;
    }
    heroSmelt(data) {
        let items = {};
        data.cfg_hero_smelt.data.forEach((res) => {
            let item = {
                id: res.id,
                quality: res.quality,
                fragment: res.fragment,
                lotteryRatio: res.lotteryRatio,
                lotteryType: res.lotteryType
            };
            items[item.id] = item;
        });
        return items;
    }
    lvCost(data) {
        let items = {};
        data.cfg_lv_cost.data.forEach((res) => {
            let item = {
                id: res.lv,
                starLv: res.starLv,
                lv: res.lv,
                items: []
            };
            if (res.item1)
                item.items.push(this.parseAndCreateItem(res.item1, res.num1));
            if (res.item2)
                item.items.push(this.parseAndCreateItem(res.item2, res.num2));
            if (res.item3)
                item.items.push(this.parseAndCreateItem(res.item3, res.num3));
            if (res.item4)
                item.items.push(this.parseAndCreateItem(res.item4, res.num4));
            if (res.item5)
                item.items.push(this.parseAndCreateItem(res.item5, res.num5));
            items[item.id] = item;
        });
        return items;
    }
    starlvCost(data) {
        let items = {};
        data.cfg_starlv_cost.data.forEach((res) => {
            let item = {
                id: res.starLv,
                items: []
            };
            if (res.item1)
                item.items.push(this.parseAndCreateItem(res.item1, res.num1));
            if (res.item2)
                item.items.push(this.parseAndCreateItem(res.item2, res.num2));
            if (res.item3)
                item.items.push(this.parseAndCreateItem(res.item3, res.num3));
            if (res.item4)
                item.items.push(this.parseAndCreateItem(res.item4, res.num4));
            if (res.item5)
                item.items.push(this.parseAndCreateItem(res.item5, res.num5));
            items[item.id] = item;
        });
        return items;
    }
    propCost(data) {
        let items = {};
        data.cfg_prop_cost.data.forEach((r) => {
            let item = {
                id: r.lv,
                lv: r.lv,
                items: []
            };
            if (r.item1)
                item.items.push(this.parseAndCreateItem(r.item1, r.num1));
            if (r.item2)
                item.items.push(this.parseAndCreateItem(r.item2, r.num2));
            if (r.item3)
                item.items.push(this.parseAndCreateItem(r.item3, r.num3));
            if (r.item4)
                item.items.push(this.parseAndCreateItem(r.item4, r.num4));
            if (r.item5)
                item.items.push(this.parseAndCreateItem(r.item5, r.num5));
            items[item.id] = item;
        });
        return items;
    }
    skillCost(data) {
        let items = {};
        data.cfg_skill_cost.data.forEach((res) => {
            let item = {
                id: res.lv,
                lv: res.lv,
                items: [],
                heros: res.heros
            };
            if (res.item1)
                item.items.push(this.parseAndCreateItem(res.item1, res.num1));
            if (res.item2)
                item.items.push(this.parseAndCreateItem(res.item2, res.num2));
            if (res.item3)
                item.items.push(this.parseAndCreateItem(res.item3, res.num3));
            if (res.item4)
                item.items.push(this.parseAndCreateItem(res.item4, res.num4));
            if (res.item5)
                item.items.push(this.parseAndCreateItem(res.item5, res.num5));
            items[item.id] = item;
        });
        return items;
    }
    shop(data) {
        let items = {};
        data.cfg_shop.data.forEach((res) => {
            let item = {
                id: res.item_id,
                itemId: res.item_id,
                type: res.type,
                price: res.price
            };
            items[item.id] = item;
        });
        return items;
    }
    itemLottery(data) {
        let items = {};
        data.cfg_item_lottery.data.forEach((res) => {
            let item = {
                id: res.id,
                type: res.type,
                itemId: res.item_id,
                num: res.num,
                weight: res.weight,
                item: this.parseAndCreateItem(res.item_id, res.num),
            };
            items[item.id] = item;
        });
        return items;
    }
    shopHeroPool(data) {
        let items = {};
        data.cfg_shop_hero_pool.data.forEach((res) => {
            let item = {
                id: res.hero_id,
                heroId: res.hero_id,
                weight: res.weight,
                fragment: res.fragment
            };
            items[item.id] = item;
        });
        return items;
    }
    illustrated(data) {
        let items = {};
        data.cfg_hero_illustrated.data.forEach((res) => {
            let item = {
                id: res.quality,
                power: res.power
            };
            items[item.id] = item;
        });
        return items;
    }
    illAch(data) {
        let items = {};
        data.cfg_ill_ach.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let skillId = 0, skillLv = 0;
            if (!!res.skillIdLv && res.skillIdLv.length > 0) {
                skillId = res.skillIdLv[0];
                skillLv = res.skillIdLv[1];
            }
            let item = {
                id: res.id,
                needHeroIds: res.needHeroIds,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds,
                skillId: skillId,
                skillLv: skillLv,
            };
            items[item.id] = item;
        });
        return items;
    }
    card(data) {
        let items = {};
        data.cfg_card.data.forEach((res) => {
            let tempBuyAward = res.buyAward.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let tempEvydayAward = res.evydayAward.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let item = {
                id: res.type,
                price: res.price,
                buyAward: tempBuyAward,
                evydayAward: tempEvydayAward
            };
            items[item.id] = item;
        });
        return items;
    }
    task(data) {
        let items = {};
        data.cfg_task.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                type: res.type,
                condition: res.condition,
                condition2: res.condition2,
                nextTaskId: res.nextTaskId,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    recharge(data) {
        let items = {};
        data.cfg_recharge.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                needMoney: res.needMoney,
                nextId: res.nextId,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    rechargeRebateAward(data) {
        let items = {};
        data.cfg_recharge_rebate.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                type: res.type,
                typeid: res.typeid,
                money: res.money,
                items: tempItems,
                heros: res.heros,
                times: res.times,
                rebatetype: res.rebatetype
            };
            items[item.id] = item;
        });
        return items;
    }
    tower(data) {
        let items = {};
        data.cfg_tower.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                name: res.name,
                power: res.power,
                monsterId: res.monsterId,
                exp: res.exp,
                gold: res.gold,
                itemsProb: res.itemsProb,
                items: tempItems,
                herosProb: res.herosProb,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    pointAward(data) {
        let items = {};
        data.cfg_point_award.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let tempOnceitems = res.onceitems.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                point: res.point,
                stageid: res.stageid,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds,
                onceitems: tempOnceitems
            };
            items[item.id] = item;
        });
        return items;
    }
    signAward(data) {
        let items = {};
        data.cfg_sign_award.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let tempItems1 = res.items1.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let item = {
                id: res.id,
                items: tempItems,
                items1: tempItems1,
                vipflag: res.vipflag,
            };
            items[item.id] = item;
        });
        return items;
    }
    heroPieceRain(data) {
        let items = {};
        data.cfg_heropiece_rain.data.forEach((res) => {
            let item = {
                id: res.point,
                num: res.num,
                rnum: res.rnum,
                srnum: res.srnum,
                ssrnum: res.ssrnum,
                rssrnum: res.rssrnum
            };
            items[item.id] = item;
        });
        return items;
    }
    bossCombat(data) {
        let items = {};
        data.cfg_point_boss.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.stageId,
                stageId: res.stageId,
                pointId: res.pointId,
                monsterId: res.monsterId,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    vipPrivilege(data) {
        let items = {};
        data.cfg_vip_privilege.data.forEach((res) => {
            let tempAward = res.award.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let item = {
                id: res.id,
                viplev: res.viplev,
                rechargenum: res.rechargenum,
                exp: res.exp,
                gold: res.gold,
                lotterymoney: res.lotterymoney,
                lotteryxp: res.lotteryxp,
                exchange: res.exchange,
                bosscombat: res.bosscombat,
                heropiecespeed: res.heropiecespeed,
                award: tempAward,
                signaward: res.signaward,
                accusignaward: res.accusignaward
            };
            items[item.id] = item;
        });
        return items;
    }
    firstOnlineAward(data) {
        let items = {};
        data.cfg_online_award.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                type: res.type,
                typeid: res.typeid,
                time: res.time,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    pointLotteryUpdateAward(data) {
        let items = {};
        data.cfg_point_lottery_update_award.data.forEach((res) => {
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.pointid,
                pointid: res.pointid,
                money: res.money,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    pointLotteryRandomAward(data) {
        let items = {};
        data.cfg_point_lottery_random_award.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                pointid: res.pointid,
                items: tempItems,
                heros: res.heros,
                weight: res.weight
            };
            items[item.id] = item;
        });
        return items;
    }
    pointLotteryUpdate(data) {
        let items = {};
        data.cfg_point_lottery_update.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let item = {
                id: res.pointid * 100 + res.level,
                pointid: res.pointid,
                items: tempItems,
                level: res.level,
                cd: res.cd,
                times: res.times,
                weight: res.weight
            };
            items[item.id] = item;
        });
        return items;
    }
    lifeLike(data) {
        let items = {};
        data.cfg_lifelike.data.forEach((res) => {
            let item = {
                id: res.id,
                level: res.id,
                lifeLike: res.lifelike,
                probsArr: []
            };
            if (res.hp)
                item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Hp, value: res.hp, weight: res.prob1 });
            if (res.attack)
                item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Attack, value: res.attack, weight: res.prob2 });
            if (res.hit)
                item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Hit, value: res.hit, weight: res.prob3 });
            if (res.dodge)
                item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Dodge, value: res.dodge, weight: res.prob4 });
            if (res.speed)
                item.probsArr.push({ probtype: consts.default.consts.Enums.LifeLikeIncType.Speed, value: res.speed, weight: res.prob5 });
            items[item.id] = item;
        });
        return items;
    }
    rankedGameAward(data) {
        let items = {};
        data.cfg_ranked_game_award.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.rank,
                rank: res.rank,
                money: res.money,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    robot(data) {
        let items = {};
        data.cfg_robot.data.forEach((res) => {
            let item = {
                id: res.robotId,
                robotId: res.robotId,
                name: res.name,
                monsterId: res.monsterId,
                headerCode: res.headerCode,
            };
            items[item.id] = item;
        });
        return items;
    }
    worldBoss(data) {
        let items = {};
        data.cfg_world_boss.data.forEach((res) => {
            let item = {
                id: res.id,
                weekday: res.weekday,
                monsterid: res.monsterid,
                items: res.items,
                money: res.money,
            };
            items[item.id] = item;
        });
        return items;
    }
    worldBossAward(data) {
        let items = {};
        data.cfg_world_boss_award.data.forEach((res) => {
            let item = {
                id: res.id,
                bossid: res.bossid,
                rank: res.rank,
                items: res.items,
            };
            items[item.id] = item;
        });
        return items;
    }
    dailyTask(data) {
        let items = {};
        data.cfg_daily_task.data.forEach((res) => {
            let item = {
                id: res.id,
                type: res.type,
                activity: res.activity,
                limit: res.limit,
            };
            items[item.id] = item;
        });
        return items;
    }
    dailyTaskAward(data) {
        let items = {};
        data.cfg_daily_task_award.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                activity: res.activity,
                remedialPrice: res.remedialPrice,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    achieveTask(data) {
        let items = {};
        data.cfg_achieve_task.data.forEach((res) => {
            let tempItems = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,
                type: res.type,
                score: res.score,
                items: tempItems,
                heros: res.heros,
                heroIds: heroIds
            };
            items[item.id] = item;
        });
        return items;
    }
    parseMonsterSkill(skill) {
        if ('string' === typeof skill) {
            skill = JSON.parse(skill);
        }
        let res = [];
        skill.forEach((el) => {
            res.push({
                id: el / 100 * 100,
                lv: (el % 100),
                pos: res.length + 1
            });
        }, this);
        return res;
    }
    parseAndCreateItem(item, num, weight = 0) {
        let itemType = this._utils.getItemType(item);
        if (weight) {
            return { id: item, type: itemType, weight: weight, num: num || 1 };
        }
        return { id: item, type: itemType, num: num || 0 };
    }
}
exports.ConfigFormat = ConfigFormat;

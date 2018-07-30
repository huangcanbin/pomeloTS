Object.defineProperty(exports, "__esModule", { value: true });
const dbLoader = require("./DbLoader");
const utils = require("../util/utils");
const logger = require("pomelo-logger");
const system = require("system");
const consts = require("../util/consts");
const ConfigFormat = require("./configFormat");
class ConfigCache {
    constructor() {
        this._isLoaded = false;
        this._utils = utils.Utils.getInstance();
        this._configFormat = ConfigFormat.ConfigFormat.getInstance();
        this._dbLoader = dbLoader.DbLoader.getInstance();
        this._logger = logger.getLogger(system.__filename);
        this.initDataItem();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new ConfigCache();
        }
        return this.instance;
    }
    load() {
        if (this.isLoaded)
            return;
        this._isLoaded = true;
        this.newPromise(this.cfg).then(() => {
            return this.newPromise(this.const);
        }).then(() => {
            return this.newPromise(this.monster);
        }).then(() => {
            return this.newPromise(this.character);
        }).then(() => {
            return this.newPromise(this.checkpoint);
        }).then(() => {
            return this.newPromise(this.onlineLottery);
        }).then(() => {
            return this.newPromise(this.item);
        }).then(() => {
            return this.newPromise(this.hero);
        }).then(() => {
            return this.newPromise(this.roleCost);
        }).then(() => {
            return this.newPromise(this.skill);
        }).then(() => {
            return this.newPromise(this.skillState);
        }).then(() => {
            return this.newPromise(this.heroLottery);
        }).then(() => {
            return this.newPromise(this.lotteryCost);
        }).then(() => {
            return this.newPromise(this.goblin);
        }).then(() => {
            return this.newPromise(this.heroSmelt);
        }).then(() => {
            return this.newPromise(this.lvCost);
        }).then(() => {
            return this.newPromise(this.propCost);
        }).then(() => {
            return this.newPromise(this.skillCost);
        }).then(() => {
            return this.newPromise(this.shop);
        }).then(() => {
            return this.newPromise(this.shopHeroPool);
        }).then(() => {
            return this.newPromise(this.itemLottery);
        }).then(() => {
            return this.newPromise(this.illustrated);
        }).then(() => {
            return this.newPromise(this.illAch);
        }).then(() => {
            return this.newPromise(this.card);
        }).then(() => {
            return this.newPromise(this.task);
        }).then(() => {
            return this.newPromise(this.recharge);
        }).then(() => {
            return this.newPromise(this.tower);
        }).then(() => {
            return this.newPromise(this.pointAward);
        }).then(() => {
            return this.newPromise(this.signAward);
        }).then(() => {
            return this.newPromise(this.heroPieceRain);
        }).then(() => {
            return this.newPromise(this.bossCombat);
        }).then(() => {
            return this.newPromise(this.vipPrivilege);
        }).then(() => {
            return this.newPromise(this.firstOnlineAward);
        }).then(() => {
            return this.newPromise(this.rechargeRebateAward);
        }).then(() => {
            return this.newPromise(this.lifeLike);
        }).then(() => {
            return this.newPromise(this.rankedGameAward);
        }).then(() => {
            return this.newPromise(this.robot);
        }).then(() => {
            return this.newPromise(this.worldBoss);
        }).then(() => {
            return this.newPromise(this.worldBossAward);
        }).then(() => {
            return this.newPromise(this.pointLotteryUpdateAward);
        }).then(() => {
            return this.newPromise(this.pointLotteryRandomAward);
        }).then(() => {
            return this.newPromise(this.pointLotteryUpdate);
        }).then(() => {
            return this.newPromise(this.moneyRoulette);
        }).then(() => {
            return this.newPromise(this.dailyTask);
        }).then(() => {
            return this.newPromise(this.dailyTaskAward);
        }).then(() => {
            return this.newPromise(this.achieveTask);
        }).catch((err) => {
            if (!!err) {
                this._logger.error('config cache load error:%s', err.stack);
            }
        });
    }
    newPromise(cfg) {
        return new Promise((resolve, reject) => {
            cfg.load((err) => {
                if (err) {
                    return resolve();
                }
                else {
                    return reject(err);
                }
            }, this);
        });
    }
    initDataItem() {
        this._cfg = new DataItem('config', (res) => {
            return {
                id: res.id,
                name: res.name,
                descp: res.descp,
                version: res.version
            };
        });
        this._const = new DataItem('cfg_const', (res) => {
            return {
                id: res.name,
                descp: res.descp,
                num: res.num
            };
        });
        this._character = new DataItem('cfg_character', (res) => {
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
        this._checkpoint = new DataItem('cfg_checkpoint', (res) => {
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
            return item;
        });
        this._onlineLottery = new DataItem('cfg_online_lottery', (res) => {
            return {
                id: res.item_id,
                itemId: res.item_id,
                weight: res.weight
            };
        });
        this._item = new DataItem('cfg_item', (res) => {
            let item = {
                id: res.id,
                name: res.name,
                type: res.type,
                quality: res.quality,
                gold: res.gold,
                max: res.max_num,
                logicType: res.logic_type,
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
                useScript: res.use_script
            };
            switch (res.logic_type) {
                case consts.default.consts.Enums.ItemLogicType.Compose:
                    if (res.cost_ids) {
                        let ids = res.cost_ids.split(',');
                        let nums = (res.cost_nums || '').split(',');
                        for (let i = 0; i < ids.length; i++) {
                            let id = parseInt(ids[i]);
                            let num = (parseInt(nums[i]) || 1);
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
                        let ids = res.logic_ids.split(',');
                        let nums = (res.logic_nums || '').split(',');
                        for (let i = 0; i < ids.length; i++) {
                            let id = parseInt(ids[i]);
                            let num = (parseInt(nums[i]) || 1);
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
                        let ids = res.logic_ids.split(',');
                        let nums = (res.logic_nums || '').split(',');
                        for (let i = 0; i < ids.length; i++) {
                            let id = parseInt(ids[i]);
                            let num = (parseInt(nums[i]) || 1);
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
                    item.ids = parseInt(res.logic_ids);
                    break;
                default:
                    break;
            }
            return item;
        });
        this._monster = new DataItem('cfg_monster', (res) => {
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
        this._hero = new DataItem('cfg_hero', (res) => {
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
        this._roleCost = new DataItem('cfg_role_cost', (res) => {
            return {
                id: res.type + '_' + res.lv,
                type: res.type,
                lv: res.lv,
                item: res.item,
                num: res.num
            };
        });
        this._skill = new DataItem('cfg_hero_skill', (res) => {
            return {
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
                target: res.target
            };
        });
        this._skillState = new DataItem('cfg_skill_state', (res) => {
            return {
                id: res.id,
                name: res.name,
                type: res.type,
                weight: res.weight
            };
        });
        this._heroLottery = new DataItem('cfg_hero_lottery', (res) => {
            return {
                id: res.id,
                type: res.type,
                heroId: res.hero_id,
                weight: res.weight
            };
        });
        this._lotteryCost = new DataItem('cfg_lottery_cost', (res) => {
            return {
                id: res.type,
                type: res.type,
                item: res.item,
                num: res.num,
                freeNum: res.free_num,
                ratio: res.ratio,
                xp_num: res.xp_num
            };
        });
        this._goblin = new DataItem('cfg_goblin', (res) => {
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
            return item;
        });
        this._heroSmelt = new DataItem('cfg_hero_smelt', (res) => {
            return {
                id: res.id,
                quality: res.quality,
                fragment: res.fragment,
                lotteryRatio: res.lotteryRatio,
                lotteryType: res.lotteryType
            };
        });
        this._lvCost = new DataItem('cfg_lv_cost', (res) => {
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
            return item;
        });
        this._starlvCost = new DataItem('cfg_starlv_cost', (res) => {
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
            return item;
        });
        this._propCost = new DataItem('cfg_prop_cost', (r) => {
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
            return item;
        });
        this._skillCost = new DataItem('cfg_skill_cost', (res) => {
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
            item.heros = JSON.parse(item.heros.trim() || "[]");
            return item;
        });
        this._shop = new DataItem('cfg_shop', (res) => {
            return {
                id: res.item_id,
                itemId: res.item_id,
                type: res.type,
                price: res.price
            };
        });
        this._itemLottery = new DataItem('cfg_item_lottery', (res) => {
            return {
                id: res.id,
                type: res.type,
                itemId: res.item_id,
                num: res.num,
                weight: res.weight,
                item: this.parseAndCreateItem(res.item_id, res.num),
            };
        });
        this._shopHeroPool = new DataItem('cfg_shop_hero_pool', (res) => {
            return {
                id: res.hero_id,
                heroId: res.hero_id,
                weight: res.weight,
                fragment: res.fragment
            };
        });
        this._illustrated = new DataItem('cfg_hero_illustrated', (res) => {
            return {
                id: res.quality,
                power: res.power
            };
        });
        this._illAch = new DataItem('cfg_ill_ach', (res) => {
            res.needHeroIds = JSON.parse(res.needHeroIds.trim() || "[]");
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            let skillId = 0, skillLv = 0;
            res.skillIdLv = JSON.parse(res.skillIdLv.trim() || "[]");
            if (!!res.skillIdLv && res.skillIdLv.length > 0) {
                skillId = res.skillIdLv[0];
                skillLv = res.skillIdLv[1];
            }
            return {
                id: res.id,
                needHeroIds: res.needHeroIds,
                items: res.items,
                heros: res.heros,
                heroIds: heroIds,
                skillId: skillId,
                skillLv: skillLv,
            };
        });
        this._card = new DataItem('cfg_card', (res) => {
            res.buyAward = JSON.parse(res.buyAward.trim() || "[]");
            res.buyAward = res.buyAward.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.evydayAward = JSON.parse(res.evydayAward.trim() || "[]");
            res.evydayAward = res.evydayAward.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            return {
                id: res.type,
                price: res.price,
                buyAward: res.buyAward,
                evydayAward: res.evydayAward
            };
        });
        this._task = new DataItem('cfg_task', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                type: res.type,
                condition: res.condition,
                condition2: res.condition2,
                nextTaskId: res.nextTaskId,
                items: res.items,
                heros: res.heros,
                heroIds: heroIds
            };
        });
        this._recharge = new DataItem('cfg_recharge', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                needMoney: res.needMoney,
                nextId: res.nextId,
                items: res.items,
                heros: res.heros,
                heroIds: heroIds
            };
        });
        this._tower = new DataItem('cfg_tower', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                name: res.name,
                power: res.power,
                monsterId: res.monsterId,
                exp: res.exp,
                gold: res.gold,
                itemsProb: res.itemsProb,
                items: res.items,
                herosProb: res.herosProb,
                heros: res.heros,
                heroIds: heroIds
            };
        });
        this._pointAward = new DataItem('cfg_point_award', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.onceitems = JSON.parse(res.onceitems.trim() || "[]");
            res.onceitems = res.onceitems.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                point: res.point,
                stageid: res.stageid,
                items: res.items,
                heros: res.heros,
                heroIds: heroIds,
                onceitems: res.onceitems
            };
        });
        this._signAward = new DataItem('cfg_sign_award', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.items1 = JSON.parse(res.items1.trim() || "[]");
            res.items1 = res.items1.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            return {
                id: res.id,
                items: res.items,
                items1: res.items1,
                vipflag: res.vipflag,
            };
        });
        this._heroPieceRain = new DataItem('cfg_heropiece_rain', (res) => {
            return {
                id: res.point,
                num: res.num,
                rnum: res.rnum,
                srnum: res.srnum,
                ssrnum: res.ssrnum,
                rssrnum: res.rssrnum
            };
        });
        this._bossCombat = new DataItem('cfg_point_boss', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.stageId,
                stageId: res.stageId,
                pointId: res.pointId,
                monsterId: res.monsterId,
                items: res.items,
                heros: res.heros,
                heroIds: heroIds
            };
        });
        this._vipPrivilege = new DataItem('cfg_vip_privilege', (res) => {
            res.award = JSON.parse(res.award.trim() || "[]");
            res.award = res.award.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            return {
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
                award: res.award,
                signaward: res.signaward,
                accusignaward: res.accusignaward
            };
        });
        this._firstOnlineAward = new DataItem('cfg_online_award', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                type: res.type,
                typeid: res.typeid,
                time: res.time,
                items: res.items,
                heros: res.heros,
                heroIds: heroIds
            };
        });
        this._rechargeRebateAward = new DataItem('cfg_recharge_rebate', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                type: res.type,
                typeid: res.typeid,
                money: res.money,
                items: res.items,
                heros: res.heros,
                times: res.times,
                rebatetype: res.rebatetype
            };
        });
        this._lifeLike = new DataItem('cfg_lifelike', (res) => {
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
            return item;
        });
        this._worldBoss = new DataItem('cfg_world_boss', (res) => {
            return {
                id: res.id,
                weekday: res.weekday,
                monsterid: res.monsterid,
                items: res.items,
                money: res.money,
            };
        });
        this._worldBossAward = new DataItem('cfg_world_boss_award', (res) => {
            return {
                id: res.id,
                bossid: res.bossid,
                rank: res.rank,
                items: res.items,
            };
        });
        this._rankedGameAward = new DataItem('cfg_ranked_game_award', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                rank: res.rank,
                money: res.money,
                items: res.items,
                heros: res.heros,
            };
        });
        this._robot = new DataItem('cfg_robot', (res) => {
            return {
                id: res.robotId,
                robotId: res.robotId,
                name: res.name,
                monsterId: res.monsterId,
                headerCode: res.headerCode,
            };
        });
        this._pointLotteryUpdateAward = new DataItem('cfg_point_lottery_update_award', (res) => {
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.pointid,
                pointid: res.pointid,
                money: res.money,
                heros: res.heros,
                heroIds: heroIds
            };
        });
        this._pointLotteryRandomAward = new DataItem('cfg_point_lottery_random_award', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                pointid: res.pointid,
                items: res.items,
                heros: res.heros,
                weight: res.weight
            };
        });
        this._pointLotteryUpdate = new DataItem('cfg_point_lottery_update', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            return {
                id: res.pointid * 100 + res.level,
                pointid: res.pointid,
                items: res.items,
                level: res.level,
                cd: res.cd,
                times: res.times,
                weight: res.weight
            };
        });
        this._moneyRoulette = new DataItem('cfg_money_roulette', (res) => {
            return {
                id: res.id,
                money: res.money,
                awardmoney: res.awardmoney,
                awardmoney1: res.awardmoney1,
                weight: res.weight,
                protectmoney: res.protectmoney,
                nextmoney: res.nextmoney
            };
        });
        this._dailyTask = new DataItem('cfg_daily_task', (res) => {
            return {
                id: res.id,
                type: res.type,
                activity: res.activity,
                limit: res.limit
            };
        });
        this._dailyTaskAward = new DataItem('cfg_daily_task_award', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                activity: res.activity,
                remedialPrice: res.remedialPrice,
                items: res.items,
                heros: res.heros,
                heroIds: heroIds
            };
        });
        this._achieveTask = new DataItem('cfg_achieve_task', (res) => {
            res.items = JSON.parse(res.items.trim() || "[]");
            res.items = res.items.select((t) => {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            res.heros = JSON.parse(res.heros.trim() || "[]");
            let heroIds = [];
            for (let i = 0; i < res.heros.length; i++) {
                let hero = res.heros[i];
                for (let j = 0; j < (hero.num || 1); j++) {
                    heroIds.push(hero.heroId);
                }
            }
            return {
                id: res.id,
                type: res.type,
                score: res.score,
                items: res.items,
                heros: res.heros,
                heroIds: heroIds
            };
        });
    }
    get cfg() {
        return this._cfg;
    }
    get item() {
        return this._item;
    }
    get const() {
        return this._const;
    }
    get hero() {
        return this._hero;
    }
    get skill() {
        return this._skill;
    }
    get skillState() {
        return this._skillState;
    }
    get recharge() {
        return this._recharge;
    }
    get tower() {
        return this._tower;
    }
    get pointAward() {
        return this._pointAward;
    }
    get signAward() {
        return this._signAward;
    }
    get rechargeRebateAward() {
        return this._rechargeRebateAward;
    }
    get firstOnlineAward() {
        return this._firstOnlineAward;
    }
    get vipPrivilege() {
        return this._vipPrivilege;
    }
    get bossCombat() {
        return this._bossCombat;
    }
    get heroPieceRain() {
        return this._heroPieceRain;
    }
    get shopHeroPool() {
        return this._shopHeroPool;
    }
    get illustrated() {
        return this._illustrated;
    }
    get card() {
        return this._card;
    }
    get task() {
        return this._task;
    }
    get rankedGameAward() {
        return this._rankedGameAward;
    }
    get illAch() {
        return this._illAch;
    }
    get worldBossAward() {
        return this._worldBossAward;
    }
    get worldBoss() {
        return this._worldBoss;
    }
    get lifeLike() {
        return this._lifeLike;
    }
    get dailyTask() {
        return this._dailyTask;
    }
    get itemLottery() {
        return this._itemLottery;
    }
    get moneyRoulette() {
        return this._moneyRoulette;
    }
    get pointLotteryUpdate() {
        return this._pointLotteryUpdate;
    }
    get pointLotteryRandomAward() {
        return this._pointLotteryRandomAward;
    }
    get pointLotteryUpdateAward() {
        return this._pointLotteryUpdateAward;
    }
    get robot() {
        return this._robot;
    }
    get propCost() {
        return this._propCost;
    }
    get dailyTaskAward() {
        return this._dailyTaskAward;
    }
    get shop() {
        return this._shop;
    }
    get skillCost() {
        return this._skillCost;
    }
    get starlvCost() {
        return this._starlvCost;
    }
    get lvCost() {
        return this._lvCost;
    }
    get achieveTask() {
        return this._achieveTask;
    }
    get heroSmelt() {
        return this._heroSmelt;
    }
    get goblin() {
        return this._goblin;
    }
    get lotteryCost() {
        return this._lotteryCost;
    }
    get heroLottery() {
        return this._heroLottery;
    }
    get roleCost() {
        return this._roleCost;
    }
    get character() {
        return this._character;
    }
    get checkpoint() {
        return this._checkpoint;
    }
    get monster() {
        return this._monster;
    }
    get onlineLottery() {
        return this._onlineLottery;
    }
    get isLoaded() {
        return this._isLoaded;
    }
    parseAndCreateItem(itemId, num, weight = null) {
        let itemType = this._utils.getItemType(itemId);
        if (weight) {
            return {
                id: itemId,
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
    configUpdate(origin, newData) {
        for (let i = 0; i < newData.length; i++) {
            let item = newData[i];
            if (!origin[item.name]) {
                origin[item.name] = item;
                origin[item.name].data = JSON.parse(item.data);
                this._logger.debug('add a new config : ' + item.name);
            }
            else if (origin[item.name].version < item.version) {
                origin[item.name].data = JSON.parse(item.data);
                origin[item.name].version = item.version;
                this._logger.debug('update a new config : ' + item.name);
            }
        }
        return origin;
    }
    getByKey(data, id, lv = null) {
        let key = lv ? id + '_' + lv : id;
        return data[key];
    }
    getTableAll(table) {
        let res = {};
        for (let i in table) {
            if (i) {
                res[i] = table[i];
            }
        }
        return res;
    }
    getItems(table) {
        var self = this;
        let res = {};
        res.data = {};
        for (var i in table) {
            if (i) {
                res.data[i] = table[i];
            }
        }
        var get = function (id) {
            let tbData = self._configFormat.item(self._ConfigCache);
            let record = self.getByKey(tbData, id);
            return record;
        };
        res.get = get;
        return res;
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
    set(callback = null, context = null) {
        this._logger.debug('timer is runing : ' + Date.now());
        this._dbLoader.getConfig('config', (err, res) => {
            if (!!err) {
                this._logger.error('config cache load error:%s', err.stack);
            }
            this._ConfigCache = this.configUpdate(this._ConfigCache, res);
            if (callback && context) {
                callback.call(context, null, true);
            }
        }, this);
    }
    getVarConst(id, num = 0) {
        let tbData = this._configFormat.const(this._ConfigCache);
        var obj = this.getByKey(tbData, id) || { num: num || 0 };
        return obj.num;
    }
    getItemitem(id, num) {
        let tbData = this._configFormat.item(this._ConfigCache);
        if (this.getByKey(tbData, id)) {
            return this.parseAndCreateItem(id, num);
        }
    }
    items() {
        let tbData = this._configFormat.item(this._ConfigCache);
        let records = this.getItems(tbData);
        return records;
    }
    refreshTimer() {
        let refreshTime = this.getVarConst(consts.default.consts.Keys.CACHE_UPDATE_TIME) ? this.getVarConst(consts.default.consts.Keys.CACHE_UPDATE_TIME) : 60 * 1000;
        setInterval(this.set, refreshTime);
    }
    getConst(id, lv = null) {
        let tbData = this._configFormat.const(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getCharacter(id, lv = null) {
        let tbData = this._configFormat.character(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getCheckpoint(id, lv = null) {
        let tbData = this._configFormat.checkpoint(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getOnlineLottery(id, lv = null) {
        let tbData = this._configFormat.onlineLottery(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getItem(id, lv = null) {
        let tbData = this._configFormat.item(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getHero(id, lv = null) {
        let tbData = this._configFormat.hero(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getRoleCost(id, lv = null) {
        let tbData = this._configFormat.roleCost(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getSkill(id, lv = null) {
        let tbData = this._configFormat.skill(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getSkillState(id, lv = null) {
        let tbData = this._configFormat.skillState(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getHeroLottery(id, lv = null) {
        let tbData = this._configFormat.heroLottery(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getLotteryCost(id, lv = null) {
        let tbData = this._configFormat.lotteryCost(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getGoblin(id, lv = null) {
        let tbData = this._configFormat.goblin(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getHeroSmelt(id, lv = null) {
        let tbData = this._configFormat.heroSmelt(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getLvCost(id, lv = null) {
        let tbData = this._configFormat.lvCost(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getStarlvCost(id, lv = null) {
        let tbData = this._configFormat.starlvCost(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getPropCost(id, lv = null) {
        let tbData = this._configFormat.propCost(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getSkillCost(id, lv = null) {
        let tbData = this._configFormat.skillCost(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getShop(id, lv = null) {
        let tbData = this._configFormat.shop(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getItemLottery(id, lv = null) {
        let tbData = this._configFormat.itemLottery(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getShopHeroPool(id, lv = null) {
        let tbData = this._configFormat.shopHeroPool(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getIllustrated(id, lv = null) {
        let tbData = this._configFormat.illustrated(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getIllAch(id, lv = null) {
        let tbData = this._configFormat.illAch(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getMonster(id, lv = null) {
        let tbData = this._configFormat.monster(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getCard(id, lv = null) {
        let tbData = this._configFormat.card(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getTask(id, lv = null) {
        let tbData = this._configFormat.task(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getRecharge(id, lv = null) {
        let tbData = this._configFormat.recharge(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getRechargeRebateAward(id, lv = null) {
        let tbData = this._configFormat.rechargeRebateAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getTower(id, lv = null) {
        let tbData = this._configFormat.tower(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getPointAward(id, lv = null) {
        let tbData = this._configFormat.pointAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getSignAward(id, lv = null) {
        let tbData = this._configFormat.signAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getHeroPieceRain(id, lv = null) {
        let tbData = this._configFormat.heroPieceRain(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getBossCombat(id, lv = null) {
        let tbData = this._configFormat.bossCombat(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getVipPrivilege(id, lv = null) {
        let tbData = this._configFormat.vipPrivilege(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getFirstOnlineAward(id, lv = null) {
        let tbData = this._configFormat.firstOnlineAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getWorldBoss(id, lv = null) {
        let tbData = this._configFormat.worldBoss(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getWorldBossAward(id, lv = null) {
        let tbData = this._configFormat.worldBossAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getRankedGameAward(id, lv = null) {
        let tbData = this._configFormat.rankedGameAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getRobot(id, lv = null) {
        let tbData = this._configFormat.robot(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getLifeLike(id, lv = null) {
        let tbData = this._configFormat.lifeLike(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getPointLotteryUpdateAward(id, lv = null) {
        let tbData = this._configFormat.pointLotteryUpdateAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getPointLotteryRandomAward(id, lv = null) {
        let tbData = this._configFormat.pointLotteryRandomAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getPointLotteryUpdate(id, lv = null) {
        let tbData = this._configFormat.pointLotteryUpdate(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getDailyTask(id, lv = null) {
        let tbData = this._configFormat.dailyTask(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getDailyTaskAward(id, lv = null) {
        let tbData = this._configFormat.dailyTaskAward(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getAchieveTask(id, lv = null) {
        let tbData = this._configFormat.achieveTask(this._ConfigCache);
        let record = this.getByKey(tbData, id, lv);
        return record;
    }
    getAllConst() {
        let tbData = this._configFormat.const(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllCharacter() {
        let tbData = this._configFormat.character(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllCheckpoint() {
        let tbData = this._configFormat.checkpoint(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllOnlineLottery() {
        let tbData = this._configFormat.onlineLottery(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllItem() {
        let tbData = this._configFormat.item(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllMonster() {
        let tbData = this._configFormat.monster(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllHero() {
        let tbData = this._configFormat.hero(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllRoleCost() {
        let tbData = this._configFormat.roleCost(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllSkill() {
        let tbData = this._configFormat.skill(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllSkillState() {
        let tbData = this._configFormat.skillState(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllHeroLottery() {
        let tbData = this._configFormat.heroLottery(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllGoblin() {
        let tbData = this._configFormat.goblin(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllLotteryCost() {
        let tbData = this._configFormat.lotteryCost(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllHeroSmelt() {
        let tbData = this._configFormat.heroSmelt(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllLvCost() {
        let tbData = this._configFormat.lvCost(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllStarlvCost() {
        let tbData = this._configFormat.starlvCost(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllPropCost() {
        let tbData = this._configFormat.propCost(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllShop() {
        let tbData = this._configFormat.shop(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllSkillCost() {
        let tbData = this._configFormat.skillCost(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllItemLottery() {
        let tbData = this._configFormat.itemLottery(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllShopHeroPool() {
        let tbData = this._configFormat.shopHeroPool(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllIllustrated() {
        let tbData = this._configFormat.illustrated(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllIllAch() {
        let tbData = this._configFormat.illAch(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllCard() {
        let tbData = this._configFormat.card(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllTask() {
        let tbData = this._configFormat.task(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllRecharge() {
        let tbData = this._configFormat.recharge(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllRechargeRebateAward() {
        let tbData = this._configFormat.rechargeRebateAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllTower() {
        let tbData = this._configFormat.tower(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllPointAward() {
        let tbData = this._configFormat.pointAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllSignAward() {
        let tbData = this._configFormat.signAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllHeroPieceRain() {
        let tbData = this._configFormat.heroPieceRain(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllBossCombat() {
        let tbData = this._configFormat.bossCombat(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllVipPrivilege() {
        let tbData = this._configFormat.vipPrivilege(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllFirstOnlineAward() {
        let tbData = this._configFormat.firstOnlineAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllWorldBoss() {
        let tbData = this._configFormat.worldBoss(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllLifeLike() {
        let tbData = this._configFormat.lifeLike(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllRankedGameAward() {
        let tbData = this._configFormat.rankedGameAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllRobot() {
        let tbData = this._configFormat.robot(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllWorldBossAward() {
        let tbData = this._configFormat.worldBossAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllPointLotteryUpdateAward() {
        let tbData = this._configFormat.pointLotteryUpdateAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllPointLotteryRandomAward() {
        let tbData = this._configFormat.pointLotteryRandomAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllPointLotteryUpdate() {
        let tbData = this._configFormat.pointLotteryUpdate(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllDailyTask() {
        let tbData = this._configFormat.dailyTask(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllDailyTaskAward() {
        let tbData = this._configFormat.dailyTaskAward(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
    getAllAchieveTask() {
        let tbData = this._configFormat.achieveTask(this._ConfigCache);
        let records = this.getTableAll(tbData);
        return records;
    }
}
exports.ConfigCache = ConfigCache;
class DataItem {
    constructor(table, parseFun = null) {
        this._data = {};
        this._table = table;
        this._isloaded = false;
        this._loadError = null;
        this._parser = parseFun;
        this._dbLoad = dbLoader.DbLoader.getInstance();
        this._configCache = ConfigCache.getInstance();
        this._logger = logger.getLogger(system.__filename);
    }
    load(callback, context) {
        this._dbLoad.load(this._table, (err, res) => {
            this._isloaded = true;
            if (!!err) {
                this._loadError = err;
                callback.call(context, err);
                return;
            }
            this._logger.info(this._data);
            for (let i = 0; i < res.length; i++) {
                let r = res[i];
                let item = this._parser(r);
                if (item && item.id) {
                    this._data[item.id] = item;
                }
            }
            callback.call(context);
        }, this);
    }
    get(id, lv = null) {
        if (!!this._loadError) {
            throw 'error:' + this._loadError;
        }
        let key = lv ? id + '_' + lv : id;
        return this._data[key];
    }
    getAll() {
        if (!!this._loadError) {
            throw 'error:' + this._loadError;
        }
        return this._data;
    }
    getVar(id, num) {
        let obj = this.get(id) || { num: num || 0 };
        return obj.num;
    }
    getItem(id, num) {
        if (!!this._loadError) {
            throw 'error:' + this._loadError;
        }
        if (this._data[id]) {
            return this._configCache.parseAndCreateItem(id, num);
        }
        throw 'Not found item:' + id;
    }
    get isload() {
        return this._isloaded;
    }
}
exports.DataItem = DataItem;

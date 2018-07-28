import utils = require('../util/Utils');
import consts = require('../util/consts');

/**
 * 配置数据格式化
 * @author Andrew_Huang
 * @export
 * @class ConfigFormat
 */
export class ConfigFormat
{
    public static instance: ConfigFormat;
    public static getInstance(): ConfigFormat
    {
        if (!this.instance)
        {
            this.instance = new ConfigFormat();
        }
        return this.instance;
    }

    private _utils: utils.Utils;

    public constructor()
    {
        this._utils = utils.Utils.getInstance();
    }

    public const(data: any): any
    {
        let items: any = {};
        if (data.cfg_const)
        {
            data.cfg_const.data.forEach((res: any) =>
            {
                let item = {
                    id: res.name,
                    descp: res.descp,
                    num: res.num,
                };
                items[item.id] = item;
            })
        }
        return items;
    }

    public character(data: any): any
    {
        let items: any = {};
        data.cfg_character.data.forEach((res: any) =>
        {
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
        })
        return items;
    }

    public checkpoint(data: any): any
    {
        let items: any = {};
        data.cfg_checkpoint.data.forEach((res: any) =>
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

            items[item.id] = item;
        })
        return items;
    }

    public onlineLottery(data: any): any
    {
        let items: any = {};
        data.cfg_online_lottery.data.forEach((res: any) => 
        {
            let item = {
                id: res.item_id,
                itemId: res.item_id,
                weight: res.weight
            };

            items[item.id] = item;
        })
        return items;
    }

    public item(data: any): any
    {
        let items: any = {};
        data.cfg_item.data.forEach((res: any) =>
        {
            let item = {
                id: res.id,
                name: res.name,
                type: res.type,   //物品类型 0：道具物品 1：材料物品
                quality: res.quality,
                gold: res.gold,
                max: res.max_num,
                logicType: res.logic_type,
                logicIds: res.logic_ids,
                logicNums: res.logic_nums,
                costIds: res.cost_ids,
                costNums: res.cost_nums,
                ids: <any>[],    //根据逻辑类型获取的物品或者式神的Id
                nums: <any>[],
                items: <any>[],  //使用或合成后获得的物品
                heros: <any>[],  //使用后获得的式神
                getGlod: 0, //使用后获得的金币
                getExp: 0,
                getMoney: 0,
                costItems: <any>[],  //合成消耗的物品
                costGlod: 0, //合成后消耗的金币
                costExp: 0,
                costMoney: 0,
                useScript: res.use_script,
            };
            let ids, nums, id, num;
            switch (res.logic_type)
            {
                case consts.default.consts.Enums.ItemLogicType.Compose:
                    if (res.cost_ids)
                    {
                        ids = res.cost_ids.split(',');
                        nums = (res.cost_nums || '').split(',');
                        for (let i: number = 0; i < ids.length; i++)
                        {
                            id = 1 * ids[i];
                            num = 1 * (nums[i] || 1);
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
                        ids = res.logic_ids.split(',');
                        nums = (res.logic_nums || '').split(',');
                        for (let i: number = 0; i < ids.length; i++)
                        {
                            id = 1 * ids[i];
                            num = 1 * (nums[i] || 1);
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
                        ids = res.logic_ids.split(',');
                        nums = (res.logic_nums || '').split(',');
                        for (let i: number = 0; i < ids.length; i++)
                        {
                            id = 1 * ids[i];
                            num = 1 * (nums[i] || 1);
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
                    item.ids = 1 * res.logic_ids;
                    break;
                default:
                    break;
            }

            items[item.id] = item;
        })
        return items;
    }

    public monster(data: any): any
    {
        let items: any = {};
        data.cfg_monster.data.forEach((res: any) =>
        {
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
        })
        return items;
    }

    public hero(data: any): any
    {
        var items: any = {};
        data.cfg_hero.data.forEach((res: any) =>
        {
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
        })
        return items;
    }

    public roleCost(data: any): any
    {
        let items: any = {};
        data.cfg_role_cost.data.forEach((res: any) =>
        {
            let item = {
                id: res.type + '_' + res.lv,/*搜索键*/
                type: res.type,
                lv: res.lv,
                item: res.item,
                num: res.num
            };
            items[item.id] = item;
        })
        return items;
    }

    public skill(data: any): any
    {
        let items: any = {};
        data.cfg_hero_skill.data.forEach((res: any) =>
        {
            let item = {
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
                target: res.target,//施放目标 1:对方,2:己方
                descp: res.descp,//施放目标 1:对方,2:己方
            };
            items[item.id] = item;
        })
        return items;
    }

    public skillState(data: any): any
    {
        let items: any = {};
        data.cfg_skill_state.data.forEach((res: any) =>
        {
            let item = {
                id: res.id,/*搜索键*/
                name: res.name,
                type: res.type,
                weight: res.weight
            };
            items[item.id] = item;
        })
        return items;
    }

    public heroLottery(data: any): any
    {
        let items: any = {};
        data.cfg_hero_lottery.data.forEach((res: any) =>
        {
            let item = {
                id: res.id,/*搜索键*/
                type: res.type,
                heroId: res.hero_id,
                weight: res.weight
            };
            items[item.id] = item;
        })
        return items;
    }

    public lotteryCost(data: any): any
    {
        let items: any = {};
        data.cfg_lottery_cost.data.forEach((res: any) =>
        {
            let item = {
                id: res.type,/*搜索键*/
                type: res.type,
                item: res.item,
                num: res.num,
                freeNum: res.free_num,
                ratio: res.ratio,     //金币上涨系数
                xp_num: res.xp_num    //消耗后添加xp的值
            };
            items[item.id] = item;
        })
        return items;
    }

    public goblin(data: any): any
    {
        let items: any = {};
        data.cfg_goblin.data.forEach((res: any) =>
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
            items[item.id] = item;
        })
        return items;
    }

    public heroSmelt(data: any): any
    {
        let items: any = {};
        data.cfg_hero_smelt.data.forEach((res: any) =>
        {
            let item = {
                id: res.id,/*搜索键*/
                quality: res.quality,
                fragment: res.fragment,
                lotteryRatio: res.lotteryRatio,
                lotteryType: res.lotteryType
            };
            items[item.id] = item;
        })
        return items;
    }

    public lvCost(data: any): any
    {
        let items: any = {};
        data.cfg_lv_cost.data.forEach((res: any) =>
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
            items[item.id] = item;
        })
        return items;
    }

    public starlvCost(data: any): any
    {
        let items: any = {};
        data.cfg_starlv_cost.data.forEach((res: any) =>
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
            items[item.id] = item;
        })
        return items;
    }

    public propCost(data: any): any
    {
        let items: any = {};
        data.cfg_prop_cost.data.forEach((r: any) =>
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
            items[item.id] = item;
        })
        return items;
    }

    public skillCost(data: any): any
    {
        let items: any = {};
        data.cfg_skill_cost.data.forEach((res: any) =>
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
            items[item.id] = item;
        })
        return items;
    }

    public shop(data: any): any
    {
        let items: any = {};
        data.cfg_shop.data.forEach((res: any) =>
        {
            let item = {
                id: res.item_id,/*搜索键*/
                itemId: res.item_id,
                type: res.type,
                price: res.price
            };
            items[item.id] = item;
        })
        return items;
    }

    public itemLottery(data: any): any
    {
        let items: any = {};
        data.cfg_item_lottery.data.forEach((res: any) =>
        {
            let item = {
                id: res.id,/*搜索键*/
                type: res.type,
                itemId: res.item_id,
                num: res.num,
                weight: res.weight,
                item: this.parseAndCreateItem(res.item_id, res.num),  //获得的物品信息
            };
            items[item.id] = item;
        })
        return items;
    }

    public shopHeroPool(data: any): any
    {
        let items: any = {};
        data.cfg_shop_hero_pool.data.forEach((res: any) =>
        {
            let item = {
                id: res.hero_id,/*搜索键*/
                heroId: res.hero_id,
                weight: res.weight,
                fragment: res.fragment
            };
            items[item.id] = item;
        })
        return items;
    }

    public illustrated(data: any): any
    {
        let items: any = {};
        data.cfg_hero_illustrated.data.forEach((res: any) =>
        {
            let item = {
                id: res.quality,/*搜索键*/
                power: res.power
            };
            items[item.id] = item;
        })
        return items;
    }

    public illAch(data: any): any
    {
        let items: any = {};
        data.cfg_ill_ach.data.forEach((res: any) =>
        {
            let tempItems = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
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
            if (!!res.skillIdLv && res.skillIdLv.length > 0)
            {
                skillId = res.skillIdLv[0];
                skillLv = res.skillIdLv[1];
            }
            let item = {
                id: res.id,                   //成就编号            
                needHeroIds: res.needHeroIds, //完成成就需要的式神
                items: tempItems,             //物品奖励
                heros: res.heros,             //式神奖励
                heroIds: heroIds,            //奖励式神的id
                skillId: skillId,           //获取的被动技能ID
                skillLv: skillLv,           //获取的被动技能等级
            };
            items[item.id] = item;
        })
        return items;
    }

    public card(data: any): any
    {
        let items: any = {};
        data.cfg_card.data.forEach((res: any) =>
        {
            let tempBuyAward = res.buyAward.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let tempEvydayAward = res.evydayAward.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let item = {
                id: res.type,                 //卡类型 1:月卡 2:终身卡
                price: res.price,             //价格,单位:分
                buyAward: tempBuyAward,       //购买时的奖品
                evydayAward: tempEvydayAward  //每日可领的奖品
            };
            items[item.id] = item;
        })
        return items;
    }

    public task(data: any): any
    {
        let items: any = {};
        data.cfg_task.data.forEach((res: any) =>
        {
            let tempItems = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,                   //Id
                type: res.type,               //类型 1:通过关卡 2:上阵式神 3:达成等级的阵位 4:达到进化等级的阵位 5:达到强化等级的宝具 6:达到战斗力
                condition: res.condition,     //达成条件,与type关联 type为1:关卡ID 为2:上阵式神数 为3:阵位数量 为4:阵位数量 为5:宝具数量 为6:战斗力值
                condition2: res.condition2,   //达成条件2,与type关联 type为3:阵位等级 为4:阵位的进化等级 为5:宝具的强化等级
                nextTaskId: res.nextTaskId,   //下个任务ID, 0:没有下个任务
                items: tempItems,             //物品奖励
                heros: res.heros,             //式神奖励
                heroIds: heroIds            //奖励式神的id
            };
            items[item.id] = item;
        })
        return items;
    }

    public recharge(data: any): any
    {
        let items: any = {};
        data.cfg_recharge.data.forEach((res: any) =>
        {
            let tempItems = res.items.select((t: any) =>
            {
                return this.parseAndCreateItem(t.itemId, t.num);
            });
            let heroIds = [];
            for (let i: number = 0; i < res.heros.length; i++)
            {
                let hero = res.heros[i];
                for (let j: number = 0; j < (hero.num || 1); j++)
                {
                    heroIds.push(hero.heroId);
                }
            }
            let item = {
                id: res.id,                   //10001:首充奖励
                needMoney: res.needMoney,     //领取奖励需要的充值金额(单位:分),首充为0
                nextId: res.nextId,           //下个充值奖励的id, 0:没有下个奖励            
                items: tempItems,             //任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                heros: res.heros,             //任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]
                heroIds: heroIds            //奖励式神的id
            };
            items[item.id] = item;
        })
        return items;
    }

    /**
     * 解析怪物技能配置
     * @author Andrew_Huang
     * @param {*} skill
     * @returns {*}
     * @memberof ConfigFormat
     */
    private parseMonsterSkill(skill: any): any
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

    /**
     * 创建物品对象
     * @author Andrew_Huang
     * @param {number} item
     * @param {number} num
     * @param {number} weight
     * @returns {*}
     * @memberof ConfigFormat
     */
    private parseAndCreateItem(item: number, num: number, weight: number = 0): any
    {
        /*以前5位ID和第6位组成（如物品ID为111，类型为物品：则组合为：400111）
            1为金币，后5位写0，数量写在num上
            2为经验，后5位写0，数量写在num上
            3为代币，后5位写0，数量写在num上
            >3为物品，后5位写物品ID，数量写在num上    
            编号全局定义，400111 也是物品ID
            */
        let itemType = this._utils.getItemType(item);
        if (weight)
        {
            return { id: item, type: itemType, weight: weight, num: num || 1 };
        }
        return { id: item, type: itemType, num: num || 0 };
    }
}
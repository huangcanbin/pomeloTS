var pomelo = require('pomelo');
var logger = require('pomelo-logger').getLogger(__filename);
var utils = require('../util/utils');
var consts = require('../util/consts');

var dbLoader = module.exports;


//更新配置表
dbLoader.updateConfig = function (name, data, cb) {
    var sql = "UPDATE config SET `data`=?, `version`=? WHERE `area_id`=0 AND `name`=?";
    var args = [
        JSON.stringify(data),
        Math.floor(Date.now() / 1000), 
        name
    ];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('update config:"' + name + '" failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
            return;
        }
        logger.info('update config:"' + name + '" success! ');
        utils.invokeCallback(cb, null, 'OK_now');
    });
}


//获取cfg_card表，并格式化
dbLoader.queryConfig = function (table, cb) {
    switch (table)
    {
        case 'cfg_achieve_task' : 
            sql = "SELECT `id`,`type`,`score`,`items`,`heros` FROM ??";
            break;
        case 'cfg_card' : 
            sql = "SELECT `id`,`type`,`price`,`buyAward`,`evydayAward` FROM ??";
            break;
        case 'cfg_character' : 
            sql = "SELECT `id`,`name`,`quality`,`attack`,`hero_attack`,`prop_attack`,`hp`,`hero_hp`,`prop_hp`,`hit`,`hero_hit`,`prop_hit`,`dodge`,`hero_dodge`,`prop_dodge`,`speed`,`hero_speed`,`prop_speed`,`n_skill_id`,`skill_id` FROM ??";
            break;
        case 'cfg_checkpoint' : 
            sql = "SELECT `id`,`point`,`name`,`exp`,`gold`,`boss`,`min_ts`,`amount`,`item1`,`num1`,`item2`,`num2`,`item3`,`num3`,`item4`,`num4`,`item5`,`num5`,`addLineup`,`drop_cd`,`drop_item`,`drop_percent` FROM ??";
            break;
        case 'cfg_const' : 
            sql = "SELECT `name`,`descp`,`num` FROM ??";
            break;
        case 'cfg_daily_task' : 
            sql = "SELECT `id`,`type`,`activity`,`limit` FROM ??";
            break;
        case 'cfg_daily_task_award' : 
            sql = "SELECT `id`,`activity`,`remedialPrice`,`items`,`heros` FROM ??";
            break;
        case 'cfg_goblin':
            sql = "SELECT `id`,`weight`,`point`,`bean`,`time`,`maxHp`,`item1`,`prob1`,`item2`,`prob2`,`item3`,`prob3`,`item4`,`prob4`,`item5`,`prob5`,`exp`,`gold` FROM ??";
            break;
        case 'cfg_hero' : 
            sql = "SELECT `id`,`name`,`quality`,`attack`,`hero_attack`,`prop_attack`,`hp`,`hero_hp`,`prop_hp`,`hit`,`hero_hit`,`prop_hit`,`dodge`,`hero_dodge`,`prop_dodge`,`speed`,`hero_speed`,`prop_speed`,`n_skill_id`,`skill_id` FROM ??";
            break;
        case 'cfg_hero_illustrated' : 
            sql = "SELECT `id`,`quality`,`power` FROM ??";
            break;
        case 'cfg_hero_lottery' : 
            sql = "SELECT `id`,`type`,`hero_id`,`weight` FROM ??";
            break;
        case 'cfg_hero_skill' : 
            sql = "SELECT `id`,`skill_id`,`lv`,`name`,`prob`,`precond`,`precond_num`,`passive`,`effect_type`,`effect_num`,`state_type`,`state_num`,`state_round`,`target`,`descp` FROM ??";
            break;
        case 'cfg_hero_smelt' : 
            sql = "SELECT `id`,`quality`,`fragment`,`lotteryRatio`,`lotteryType` FROM ??";
            break;
        case 'cfg_heropiece_rain' : 
            sql = "SELECT `point`,`num`,`rnum`,`srnum`,`ssrnum`,`rssrnum` FROM ??";
            break;
        case 'cfg_ill_ach' : 
            sql = "SELECT `id`,`needHeroIds`,`items`,`heros`,`skillIdLv` FROM ??";
            break;
        case 'cfg_item' : 
            sql = "SELECT `id`,`name`,`type`,`quality`,`gold`,`max_num`,`logic_type`,`logic_ids`,`logic_nums`,`cost_ids`,`cost_nums`,`use_script` FROM ??";
            break;
        case 'cfg_item_lottery' : 
            sql = "SELECT `id`,`type`,`item_id`,`num`,`weight` FROM ??";
            break;
        case 'cfg_lottery_cost' : 
            sql = "SELECT `type`,`item`,`num`,`free_num`,`ratio`,`xp_num` FROM ??";
            break;
        case 'cfg_lv_cost' : 
            sql = "SELECT `id`,`starLv`,`lv`,`item1`,`num1`,`item2`,`num2`,`item3`,`num3`,`item4`,`num4`,`item5`,`num5` FROM ??";
            break;
        case 'cfg_monster' : 
            sql = "SELECT `id`,`name`,`attack`,`hp`,`hit`,`dodge`,`speed`,`power`,`num`,`skill` FROM ??";
            break;
        case 'cfg_online_award' : 
            sql = "SELECT `id`,`typeid`,`type`,`time`,`items`,`heros` FROM ??";
            break;
        case 'cfg_online_lottery' : 
            sql = "SELECT `item_id`,`weight` FROM ??";
            break;
        case 'cfg_point_award' : 
            sql = "SELECT `id`,`point`,`stageid`,`items`,`heros`,`onceitems` FROM ??";
            break;
        case 'cfg_point_boss' : 
            sql = "SELECT `stageId`,`pointId`,`monsterId`,`heros`,`items` FROM ??";
            break;
        case 'cfg_prop_cost' : 
            sql = "SELECT `lv`,`item1`,`num1`,`item2`,`num2`,`item3`,`num3`,`item4`,`num4`,`item5`,`num5` FROM ??";
            break;
        case 'cfg_recharge' : 
            sql = "SELECT `id`,`needMoney`,`nextId`,`items`,`heros` FROM ??";
            break;
        case 'cfg_recharge_rebate' : 
            sql = "SELECT `id`,`type`,`typeid`,`money`,`items`,`heros`,`times`,`rebatetype` FROM ??";
            break;
        case 'cfg_role_cost' : 
            sql = "SELECT `id`,`type`,`lv`,`item`,`num` FROM ??";
            break;
        case 'cfg_shop' : 
            sql = "SELECT `id`,`item_id`,`type`,`price` FROM ??";
            break;
        case 'cfg_shop_hero_pool' : 
            sql = "SELECT `id`,`hero_id`,`weight`,`fragment` FROM ??";
            break;
        case 'cfg_sign_award' : 
            sql = "SELECT `id`,`items`,`items1`,`vipflag` FROM ??";
            break;
        case 'cfg_signnum' : 
            sql = "SELECT `id`,`num` FROM ??";
            break;
        case 'cfg_skill_cost' : 
            sql = "SELECT `lv`,`item1`,`num1`,`item2`,`num2`,`item3`,`num3`,`item4`,`num4`,`item5`,`num5`,`heros` FROM ??";
            break;
        case 'cfg_skill_state' : 
            sql = "SELECT `id`,`name`,`type`,`weight` FROM ??";
            break;
        case 'cfg_starlv_cost' : 
            sql = "SELECT `id`,`starLv`,`item1`,`num1`,`item2`,`num2`,`item3`,`num3`,`item4`,`num4`,`item5`,`num5` FROM ??";
            break;
        case 'cfg_task' : 
            sql = "SELECT `id`,`type`,`condition`,`condition2`,`nextTaskId`,`items`,`heros` FROM ??";
            break;
        case 'cfg_tower' : 
            sql = "SELECT `id`,`name`,`power`,`monsterId`,`exp`,`gold`,`itemsProb`,`items`,`herosProb`,`heros` FROM ??";
            break;
        case 'cfg_vip_privilege' : 
            sql = "SELECT `id`,`viplev`,`rechargenum`,`exp`,`gold`,`lotterymoney`,`lotteryxp`,`exchange`,`bosscombat`,`heropiecespeed`,`award`,`signaward`,` accusignaward` FROM ??";
            break;
        case 'cfg_lifelike' : 
            sql = "SELECT `id`, `lifelike`, `hp`, `prob1`, `attack`, `prob2`, `hit`, `prob3`, `dodge`, `prob4`, `speed`, `prob5` FROM ??";
            break;
        case 'cfg_point_lottery_update_award' : 
            sql = "SELECT `pointid`, `money`, `heros` FROM ??";
            break;
        case 'cfg_point_lottery_random_award' : 
            sql = "SELECT `id`, `pointid`, `items`, `heros`, `weight` FROM ??";
            break;
        case 'cfg_point_lottery_update' : 
            sql = "SELECT `id`, `pointid`, `level`, `cd`, `times`, `items` FROM ??";
            break;
        case 'cfg_ranked_game_award' : 
            sql = "SELECT `id`,`rank`,`money`,`items`,`heros` FROM ??";
            break;
        case 'cfg_robot' : 
            sql = "SELECT `id`,`robotId`,`name`,`monsterId`,`headerCode` FROM ??";
            break;
        case 'cfg_world_boss' : 
            sql = "SELECT `id`,`weekday`,`monsterid`,`items`,`money` FROM ??";
            break;
        case 'cfg_world_boss_award' : 
            sql = "SELECT `id`,`bossid`,`rank`,`items` FROM ??";
            break;
        default:
            sql = '';
    }
    var args = [
        table
    ];
    pomelo.app.get(consts.DB.Shared.name).query(sql, args, function (err, res) {
        if (err !== null) {
            logger.error('get config from "' + args[0] + '" failed! ' + err.stack);
            utils.invokeCallback(cb, err.message, []);
            return;
        }
        if (!!res && res.length > 0) {
            logger.info('loader table:"' + args[0] + '"' + res.length + ' rows.');
            resFormat = [];
            switch (table)
            {
                case 'cfg_achieve_task' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            type: res[i].type,
                            score: res[i].score,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_card' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            type: res[i].type,
                            price: res[i].price,
                            buyAward: JSON.parse(res[i].buyAward.trim() || "[]"),
                            evydayAward: JSON.parse(res[i].evydayAward.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_character':
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            name: res[i].name,
                            quality: res[i].quality,
                            attack: res[i].attack,
                            hero_attack: res[i].hero_attack,
                            prop_attack: res[i].prop_attack,
                            hp: res[i].hp,
                            hero_hp: res[i].hero_hp,
                            prop_hp: res[i].prop_hp,
                            hit: res[i].hit,
                            hero_hit: res[i].hero_hit,
                            prop_hit: res[i].prop_hit,
                            dodge: res[i].dodge,
                            hero_dodge: res[i].hero_dodge,
                            prop_dodge: res[i].prop_dodge,
                            speed: res[i].speed,
                            hero_speed: res[i].hero_speed,
                            prop_speed: res[i].prop_speed,
                            n_skill_id: res[i].n_skill_id,
                            skill_id: res[i].skill_id,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_checkpoint':
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            point: res[i].point,
                            name: res[i].name,
                            exp: res[i].exp,
                            gold: res[i].gold,
                            boss: res[i].boss,
                            min_ts: res[i].min_ts,
                            amount: res[i].amount,
                            item1: res[i].item1,
                            num1: res[i].num1,
                            item2: res[i].item2,
                            num2: res[i].num2,
                            item3: res[i].item3,
                            num3: res[i].num3,
                            item4: res[i].item4,
                            num4: res[i].num4,
                            item5: res[i].item5,
                            num5: res[i].num5,
                            addLineup: res[i].addLineup,
                            drop_cd: res[i].drop_cd,
                            drop_item: res[i].drop_item,
                            drop_percent: res[i].drop_percent
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_const' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            name: res[i].name,
                            descp: res[i].descp,
                            num: res[i].num,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_daily_task' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            type: res[i].type,
                            activity: res[i].activity,
                            limit: res[i].limit,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_daily_task_award' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            activity: res[i].activity,
                            remedialPrice: res[i].remedialPrice,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_goblin' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            weight: res[i].weight,
                            point: res[i].point,
                            bean: res[i].bean,
                            time: res[i].time,
                            maxHp: res[i].maxHp,
                            item1: res[i].item1,
                            prob1: res[i].prob1,
                            item2: res[i].item2,
                            prob2: res[i].prob2,
                            item3: res[i].item3,
                            prob3: res[i].prob3,
                            item4: res[i].item4,
                            prob4: res[i].prob4,
                            item5: res[i].item5,
                            prob5: res[i].prob5,
                            exp: res[i].exp,
                            gold: res[i].gold,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_hero' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            name: res[i].name,
                            quality: res[i].quality,
                            attack: res[i].attack,
                            hero_attack: res[i].hero_attack,
                            prop_attack: res[i].prop_attack,
                            hp: res[i].hp,
                            hero_hp: res[i].hero_hp,
                            prop_hp: res[i].prop_hp,
                            hit: res[i].hit,
                            hero_hit: res[i].hero_hit,
                            prop_hit: res[i].prop_hit,
                            dodge: res[i].dodge,
                            hero_dodge: res[i].hero_dodge,
                            prop_dodge: res[i].prop_dodge,
                            speed: res[i].speed,
                            hero_speed: res[i].hero_speed,
                            prop_speed: res[i].prop_speed,
                            n_skill_id: res[i].n_skill_id,
                            skill_id: res[i].skill_id,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_hero_illustrated' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            quality: res[i].quality,
                            power: res[i].power,
                        };
                        resFormat.push(item);
                    }
                    break;
                case 'cfg_hero_lottery' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            type: res[i].type,
                            hero_id: res[i].hero_id,
                            weight: res[i].weight,
                        };
                        resFormat.push(item);
                    }
                    break;
                
                case 'cfg_hero_skill' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            skill_id: res[i].skill_id,
                            lv: res[i].lv,
                            name: res[i].name,
                            prob: res[i].prob,
                            precond: res[i].precond,
                            precond_num: res[i].precond_num,
                            passive: res[i].passive,
                            effect_type: res[i].effect_type,
                            effect_num: res[i].effect_num,
                            state_type: res[i].state_type,
                            state_num: res[i].state_num,
                            state_round: res[i].state_round,
                            target: res[i].target,
                            descp: res[i].descp,
                        };
                        resFormat.push(item);
                    }
                    //resFormat = mapByItem('lv',resFormat);
                    break;

                case 'cfg_hero_smelt' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            quality: res[i].quality,
                            fragment: res[i].fragment,
                            lotteryRatio: res[i].lotteryRatio,
                            lotteryType: res[i].lotteryType,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_heropiece_rain' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            point: res[i].point,
                            num: res[i].num,
                            rnum: res[i].rnum,
                            srnum: res[i].srnum,
                            ssrnum: res[i].ssrnum,
                            rssrnum: res[i].rssrnum,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_ill_ach' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            needHeroIds: JSON.parse(res[i].needHeroIds.trim() || "[]"),
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                            skillIdLv: JSON.parse(res[i].skillIdLv.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_item' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            name: res[i].name,
                            type: res[i].type,
                            quality: res[i].quality,
                            gold: res[i].gold,
                            max_num: res[i].max_num,
                            logic_type: res[i].logic_type,
                            logic_ids: res[i].logic_ids,
                            logic_nums: res[i].logic_nums,
                            cost_ids: res[i].cost_ids,
                            cost_nums: res[i].cost_nums,
                            use_script: res[i].use_script,
                        };
                        resFormat.push(item);
                    }
                    //resFormat = mapByItem('type',resFormat);
                    break;

                case 'cfg_item_lottery' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            type: res[i].type,
                            item_id: res[i].item_id,
                            num: res[i].num,
                            weight: res[i].weight,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_lottery_cost' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            type: res[i].type,
                            item: res[i].item,
                            num: res[i].num,
                            free_num: res[i].free_num,
                            ratio: res[i].ratio,
                            xp_num: res[i].xp_num,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_lv_cost' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            starLv: res[i].starLv,
                            lv: res[i].lv,
                            item1: res[i].item1,
                            num1: res[i].num1,
                            item2: res[i].item2,
                            num2: res[i].num2,
                            item3: res[i].item3,
                            num3: res[i].num3,
                            item4: res[i].item4,
                            num4: res[i].num4,
                            item5: res[i].item5,
                            num5: res[i].num5,
                        };
                        resFormat.push(item);
                    }
                    //resFormat = mapByItem('starLv',resFormat);
                    break;

                case 'cfg_monster' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            name: res[i].name,
                            attack: res[i].attack,
                            hp: res[i].hp,
                            hit: res[i].hit,
                            dodge: res[i].dodge,
                            speed: res[i].speed,
                            power: res[i].power,
                            num: res[i].num,
                            skill: res[i].skill,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_online_award' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            typeid: res[i].typeid,
                            type: res[i].type,
                            time: res[i].time,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_online_lottery' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            item_id: res[i].item_id,
                            weight: res[i].weight,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_point_award' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            point: res[i].point,
                            stageid: res[i].stageid,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                            onceitems: JSON.parse(res[i].onceitems.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_point_boss' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            stageId: res[i].stageId,
                            pointId: res[i].pointId,
                            monsterId: res[i].monsterId,
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                            items: JSON.parse(res[i].items.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_prop_cost' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            lv: res[i].lv,
                            item1: res[i].item1,
                            num1: res[i].num1,
                            item2: res[i].item2,
                            num2: res[i].num2,
                            item3: res[i].item3,
                            num3: res[i].num3,
                            item4: res[i].item4,
                            num4: res[i].num4,
                            item5: res[i].item5,
                            num5: res[i].num5,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_recharge' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            needMoney: res[i].needMoney,
                            nextId: res[i].nextId,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_recharge_rebate' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,               //*搜索键*/ 
                            type: res[i].type,           //*返利类型*/ 
                            typeid: res[i].typeid,       //*充值档次*/ 
                            money: res[i].money,         //充值金额   
                            items: JSON.parse(res[i].items.trim() || "[]"),         //物品奖励 itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id
                            heros: JSON.parse(res[i].heros.trim() || "[]"),         //式神奖励
                            times: res[i].times,           //次数
                            rebatetype: res[i].rebatetype  //充值类型，1：当日充值 2：全生涯充值
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_role_cost' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            type: res[i].type,
                            lv: res[i].lv,
                            item: res[i].item,
                            num: res[i].num,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_shop' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            item_id: res[i].item_id,
                            type: res[i].type,
                            price: res[i].price,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_shop_hero_pool' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            hero_id: res[i].hero_id,
                            weight: res[i].weight,
                            fragment: res[i].fragment,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_sign_award' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            items1: JSON.parse(res[i].items1.trim() || "[]"),
                            vipflag: res[i].vipflag,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_signnum' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            num: res[i].num,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_skill_cost' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            lv: res[i].lv,
                            item1: res[i].item1,
                            num1: res[i].num1,
                            item2: res[i].item2,
                            num2: res[i].num2,
                            item3: res[i].item3,
                            num3: res[i].num3,
                            item4: res[i].item4,
                            num4: res[i].num4,
                            item5: res[i].item5,
                            num5: res[i].num5,
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_skill_state' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            name: res[i].name,
                            type: res[i].type,
                            weight: res[i].weight,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_starlv_cost' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            starLv: res[i].starLv,
                            item1: res[i].item1,
                            num1: res[i].num1,
                            item2: res[i].item2,
                            num2: res[i].num2,
                            item3: res[i].item3,
                            num3: res[i].num3,
                            item4: res[i].item4,
                            num4: res[i].num4,
                            item5: res[i].item5,
                            num5: res[i].num5,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_task' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            type: res[i].type,
                            condition: res[i].condition,
                            condition2: res[i].condition2,
                            nextTaskId: res[i].nextTaskId,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_tower' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            name: res[i].name,
                            power: res[i].power,
                            monsterId: res[i].monsterId,
                            exp: res[i].exp,
                            gold: res[i].gold,
                            itemsProb: res[i].itemsProb,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            herosProb: res[i].herosProb,
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_vip_privilege' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            viplev: res[i].viplev,
                            rechargenum: res[i].rechargenum,
                            exp: res[i].exp,
                            gold: res[i].gold,
                            lotterymoney: res[i].lotterymoney,
                            lotteryxp: res[i].lotteryxp,
                            exchange: res[i].exchange,
                            bosscombat: res[i].bosscombat,
                            heropiecespeed: res[i].heropiecespeed,
                            award: JSON.parse(res[i].award.trim() || "[]"),
                            signaward: res[i].signaward,
                            accusignaward: res[i]. accusignaward,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_lifelike' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            level: res[i].level,
                            lifelike: res[i].lifelike,
                            hp: res[i].hp,
                            prob1: res[i].prob1,
                            attack: res[i].attack,
                            prob2: res[i].prob2,
                            hit: res[i].hit,
                            prob3: res[i].prob3,
                            dbdge: res[i].dbdge,
                            prob4: res[i].prob4,
                            speed: res[i].speed,
                            prob5: res[i]. prob5,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_point_lottery_update_award' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            pointid: res[i].pointid,
                            money: res[i].money,
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;
                    
                case 'cfg_point_lottery_random_award' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            pointid: res[i].pointid,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                            weight: res[i].weight,
                        };
                        resFormat.push(item);
                    }
                    break;
                
                case 'cfg_point_lottery_update' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            pointid: res[i].pointid,
                            level: res[i].level,
                            cd: res[i].cd,
                            times: res[i].times,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_ranked_game_award' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            rank: res[i].rank,
                            money: res[i].money,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            heros: JSON.parse(res[i].heros.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;
                case 'cfg_world_boss' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            weekday: res[i].weekday,
                            monsterid: res[i].monsterid,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                            money: res[i].money,
                        };
                        resFormat.push(item);
                    }
                    break;

                case 'cfg_world_boss_award' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            bossid: res[i].bossid,
                            rank: res[i].rank,
                            items: JSON.parse(res[i].items.trim() || "[]"),
                        };
                        resFormat.push(item);
                    }
                    break;
 
                case 'cfg_robot' : 
                    for(var i=0;i<res.length;i++)
                    {
                        var item = {
                            id: res[i].id,
                            robotId: res[i].robotId,
                            name: res[i].name,
                            monsterId: res[i].monsterId,
                            headerCode: res[i].headerCode,
                        };
                        resFormat.push(item);
                    }
                    break;

                default:
                    break;
            }
            utils.invokeCallback(cb, null, resFormat);
        } else {
            utils.invokeCallback(cb, null, []);
        }
    });
}


//根据所选字段分类
function mapByItem (key,data) {
    var keyArr = new Array();
    for(var i=0;i<data.length;i++)
    {
        var keyNow = data[i][key];
        if (!keyArr[keyNow])
        {
            keyArr[keyNow] = [];
        }
        keyArr[keyNow].push(data[i]);
    }
    keyArr.push('branchFlag'); //分表标志位
    return keyArr;
}
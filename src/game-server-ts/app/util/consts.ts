
export default class Consts
{
    public static consts = {
        RES_CODE: {
            SUC_OK: 200,
            ERR_NO_LOGIN: 201,
            ERR_FAIL: 500,
            NO_SERVER_AVAILABLE: 404
        },
        RES_MSG: {
            ERR_FAIL: '服务器出错',
            ERR_HANDLE_TIMEOUT: '处理请求超时',
            ERR_ENTRY_SCENCE_FAIL: '主场景服务器出错',
            ERR_NO_SERVER_AVAILABLE: '没有可用的服务器',
            ERR_NO_DATABASE_AVAILABLE: '没有可用的数据服务器',
            ERR_NO_OAUTH_USER: '您的账号未登录或已过期',
            ERR_OTHER_USER: '账号在其它地方登录',
            ERR_VOID_PARAM: '无效的请求参数',
            ERR_AREA_GET: '读取游戏区列表失败',
            ERR_CHARACTER_NOT_EXIST: '选择的主角不存在',
            ERR_PLAYER_NO_EXIST: '玩家角色不存在',
            ERR_PLAYER_EXIST: '玩家角色已存在',
            ERR_PLAYER_NAME: '角色名称不合法，请重新输入',
            ERR_PLAYER_NAME_EXIST: '角色名已存在，更换其它名称',
            ERR_PLAYER_CREATE: '创建玩家角色失败',
            ERR_NO_FOUND_BOSS: 'BOSS关卡已到最后一关',
            ERR_BOSS_TIME: 'BOSS挑战时间未到',
            ERR_BOSS_COMBAT: 'BOSS挑战失败',
            ERR_EXTRACT_NOT_TIME: '挂机自动抽奖时间还未到',
            ERR_NO_ENERGY: '体力不足',
            ERR_SUMMON_TAKE: '式神召唤失败',
            ERR_SUMMON_NOT_MENOY: '无法抽奖，勾玉不足',
            ERR_SUMMON_NOT_GOLD: '无法抽奖，金币不足',
            ERR_SUMMON_NOT_TICKET: '无法抽奖，奖券不足',
            ERR_SUMMON_NOT_XP: '无法抽奖，XP不足',
            ERR_BUY_ENERGY: '补充体力失败',
            ERR_NOT_MENOY: '勾玉不足',
            ERR_NOT_FOUND_GOBLIN: '未找到百鬼配置',
            ERR_ENTRY_GOBLIN_FAIL: '进入百鬼界面出错',
            ERR_BUY_BEAN_IS_FULL: '仙豆已经到上限，不需要补充',
            ERR_BUY_BEAN_FAIL: '补充仙豆失败',
            ERR_NO_BEAN: '仙豆不足',
            ERR_ATTACK_GOBLIN_FAIL: '攻击百鬼失败',
            ERR_REFRESH_GOBLIN_FAIL: '刷新百鬼失败',
            ERR_EXT_MAX: '您的可扩充次数已满',
            ERR_HERO_LINEUP_DXDP: '式神阵位未开启',
            ERR_HERO_NOT_EXIST: '选择的式神不存在',
            ERR_NOT_FOUND_INTEN: '未找到配置信息',
            ERR_INTEN: '配置信息错误',
            ERR_NOT_GOLD: '金币不足',
            ERR_NOT_EXP: '经验不足',
            ERR_NOT_ITEM: '物品不足',
            ERR_NOT_HERO: '式神不足',
            ERR_NOT_FRAGMENT: '式神碎片不足',
            ERR_NOT_SMELT: '选择的式神无法熔炼',
            ERR_ITEM_NOT_USE: '该物品不能使用',
            ERR_ITEM_NOT_COMPOSE: '该物品不能合成',
            ERR_BAG_PROP_OVERFLOW: '道具背包空间不足',
            ERR_BAG_MAT_OVERFLOW: '材料背包空间不足',
            ERR_BAG_HERO_OVERFLOW: '式神背包空间不足',
            ERR_HERO_NOT_EXCHANGE: '该式神不能兑换',
            ERR_HERO_EXCHANGE: '该式神已被兑换,不能重复兑换',
            ERR_NOT_ADULT: '验证结果,未成年',
            ERR_VERIFIDE: '已经验证过,无需重复验证',
            ERR_NAME: '姓名输入有误',
            ERR_IDNUMBER: '身份证号码有误',
            ERR_POINT_MAX: '超过可选最大关卡',
            ERR_POINT_NOW: '无法选择当前关卡',
            ERR_BUY_ETE_CARD: '已经购买终身卡',
            ERR_NOT_BUY_CARD: '未购买特权卡',
            ERR_NOT_BUY_ETE_CARD: '未购买终身卡',
            ERR_MON_CARD_OUT_TIME: '月卡已过有效期',
            ERR_CARD_TODAY_AWARD: '今日奖励已领取过',
            ERR_TASK_NO_COMPLETE: '未完成任务',
            ERR_TASK_AWARD: '任务奖励已领取',
            ERR_RECHARGE_NO_COMPLETE: '未达到充值金额',
            ERR_AWARD: '奖励已被领取',
            ERR_TOWER_NO_SWEEP: '不能扫荡镇妖塔',
            ERR_TOWER_COMBAT: '镇妖塔挑战失败',
            ERR_TOWER_RESET_MAX: '今天不能再重置镇妖塔',
            ERR_TOWER_NO_FOUND: '已到镇妖塔最后一层',
            ERR_TOWER_NO_VIP: '您不是VIP,还不能进行扫荡',
            ERR_SWEEP_PROP_OVERFLOW: '道具背包空间不足,请清理后继续扫荡',
            ERR_SWEEP_MAT_OVERFLOW: '材料背包空间不足,请清理后继续扫荡',
            ERR_SWEEP_HERO_OVERFLOW: '式神背包空间不足,请清理后继续扫荡',
            ERR_NOT_LV: '请先提升等级',
            ERR_NOT_STARLV: '请先提升星级',
            ERR_LV_MAX: '达到最高等级',
            ERR_STARLV_MAX: '达到最高星级',
            ERR_GOBLIN_COMPLETE: '已挑战过',
            ERR_NOT_ILL_ACH: '图鉴成就未完成',
            ERR_AWARD_ILL_ACH: '图鉴成就奖励已经领取',
            ERR_HAVE_RECEIVED: '已经领取过',
            ERR_ONCE_RECHARGE: '还未一次充值25元，请赶快去充值',
            ERR_HEROPIECERAIN_MINPOINT: '还未达到挑战妖怪雨的关卡',
            ERR_HEROPIECERAIN_OVERINTERVAL: '时间间隔没到',
            ERR_HEROPIECERAIN_OVERFLOW: '拾取数量异常',
            ERR_BOSSCOMBAT_OVERFLOW: '一天只能扫荡一次',
            ERR_BOSSCOMBAT_LIMIT: '本层关卡还未通关，不能挑战BOSS',
            ERR_MAIL_NOMAIL: '没有邮件',
            ERR_MIAL_NOHASTHISMAIL: '不存在这个邮件',
            ERR_SIGN_DAYLIMIT: '累计天数不足，不能领累计签到领奖',
            ERR_NO_VIP: '您不是还不是vip，请充值',
            ERR_NOT_ALL_GET: '前面的要全部领取，才能领取第七天大奖，赶快去领吧。',
            ERR_RECHARGEREBATE_TIMEOUT: '时间过期，无法领取',
            ERR_NOT_LIFELIKE: '命格值不足',
            ERR_NOT_LIFELIKELEVEL: '该重命格还没有开通',
            ERR_NOTDONE_LASTLEVEL: '上一重还没全部炼制完',
            ERR_NOTDONE_LASTBALL: '上一坏还炼制',
            ERR_CARD_CD: '挑战令CD时间区间出错',
            ERR_ENTRY_RANKED_GAME_FAIL: '进入排位赛界面失败',
            ERR_CARD_NUM: '挑战令数量出错',
            ERR_CARD_NOT_ENOUGH: '挑战令不足',
            ERR_IN_CD: '下一次挑战CD未结束',
            ERR_CARD_LIMIT: '挑战令数量已达上限',
            ERR_WORLDBOSSCOMBAT_OVERFLOW: '挑战次数已经达到上限，请下周再来挑战',
            ERR_WORLDBOSSCOMBAT_TIMELIMIT: '今天不能挑战这个BOSS，请去挑战其它BOSS',
            ERR_WORLDBOSS_COMBAT: '世界BOSS挑战失败',
            ERR_WORLDBOSS_GETRANKINFO: '获取排行数据失败',
            ERR_POINTLOTTERY_TIMELIMIT: '抽奖次数已经用完，请耐心等待重置',
            ERR_POINTLOTTERY_UPDATELIMIT: '已经升级到最高级，无法再升级',
            ERR_POINTLOTTERY_UPDATEITEMSLIMIT: '升级材料不足',
            ERR_DATA_NOT_EXIST: '数据不存在',
            ERR_REMEDIAL_NOT_EXIST: '补领奖励数据不存在',
            ERR_ROULETTE_LIMIT: '您已经抽到最高档，不能再抽了。',
            ENEMY_ID_ERR: '挑战对手ID不合法',
        },
        DB: {
            driver: "dbDriver",
            Shared: {
                type: "mysql",
                name: "dbclient"
            },
            Config: {
                type: "mysql",
                name: "configclient"
            },
            Data: {
                type: "mongodb",
                name: "dataclient"
            },
            Log: {
                type: "mysql",
                name: "logclient"
            }
        },

        /**
         * cfg_const 配置的var
         */
        Keys: {
            /**每天刷新时间点 */
            EVERY_DAY_REFRESH_TIME: 'EVERY_DAY_REFRESH_TIME',
            /**体力恢复间隔时间*/
            ENERGY_INTERVAL: 'ENERGY_INTERVAL',
            /**体力恢复上限*/
            ENERGY_MAX: 'ENERGY_MAX',
            /**体力购买单价*/
            ENERGY_PRICE: 'ENERGY_PRICE',
            /**战力系数 */
            COMBAT_POWER_1: 'COMBAT_POWER_1',
            COMBAT_POWER_2: 'COMBAT_POWER_2',
            COMBAT_POWER_3: 'COMBAT_POWER_3',
            COMBAT_POWER_4: 'COMBAT_POWER_4',
            COMBAT_POWER_5: 'COMBAT_POWER_5',
            COMBAT_POWER_6: 'COMBAT_POWER_6',
            COMBAT_POWER_7: 'COMBAT_POWER_7',
            COMBAT_POWER_8: 'COMBAT_POWER_8',
            COMBAT_POWER_9: 'COMBAT_POWER_9',
            COMBAT_MAX_ROUND: 'COMBAT_MAX_ROUND',
            COMBAT_HIT_RATE: 'COMBAT_HIT_RATE',
            /**战斗力压制系数 */
            COMBAT_POWER_INC: 'COMBAT_POWER_INC',
            COMBAT_POWER_DEC: 'COMBAT_POWER_DEC',
            /**仙豆恢复间隔*/
            BEAN_INTERVAL: "BEAN_INTERVAL",
            /**仙豆恢复上限*/
            BEAN_MAX: "BEAN_MAX",
            /**仙豆购买单价*/
            BEAN_PRICE: "BEAN_PRICE",
            /**百鬼刷新BOSS所需代币*/
            GOBLIN_COST_MONEY: "GOBLIN_COST_MONEY",
            /**式神背包初始数量 */
            HERO_BAG_INIT_NUM: "HERO_BAG_INIT_NUM",
            /**扩充式神背包次数上限 */
            HERO_BAG_EXT_MAX: "HERO_BAG_EXT_MAX",
            /**扩充式神背包基础价 */
            HERO_BAG_EXT_PRICE: "HERO_BAG_EXT_PRICE",
            /**式神阵位初始数量 */
            HERO_LINEUP_INIT_NUM: "HERO_LINEUP_INIT_NUM",
            /**扩充式神阵位基础价 */
            HERO_LINEUP_EXT_PRICE: "HERO_LINEUP_EXT_PRICE",
            /**式神阵位上限数 */
            HERO_LINEUP_EXT_MAX: "HERO_LINEUP_EXT_MAX",
            /**扩充背包次数上限 */
            BAG_EXT_MAX: "BAG_EXT_MAX",
            /**扩充背包价格 */
            BAG_EXT_PRICE: "BAG_EXT_PRICE",
            /**刷新式神商店的价格 */
            SHOP_HERO_REFRESH_PRICE: "SHOP_HERO_REFRESH_PRICE",
            /**重置镇妖塔的单价 */
            TOWER_RESET_PRICE: "TOWER_RESET_PRICE",
            /**镇妖塔每日重置次数上限 */
            TOWER_RESET_MAX: "TOWER_RESET_MAX",
            /**最大Xp */
            MAX_XP: "MAX_XP",
            /**离线收益翻倍价格 */
            OFFLINE_TIMES_PRICE: "OFFLINE_TIMES_PRICE",
            /**离线福袋收益时间(单位:时) */
            OFFLINE_DROP_HOUR: "OFFLINE_DROP_HOUR",
            /**离线福袋收益倍数 */
            OFFLINE_DROP_TIMES: "OFFLINE_DROP_TIMES",
            /**战斗力排行下限 */
            RANK_POWER_LIMIT: "RANK_POWER_LIMIT",
            /**式神数量排行下限 */
            RANK_HERONUM_LIMIT: "RANK_HERONUM_LIMIT",
            /**兑换所需勾玉 */
            EXCHANGE_NEED_MONEY: "EXCHANGE_NEED_MONEY",
            /**兑换得到经验 */
            EXCHANGE_AWARD_EXP: "EXCHANGE_AWARD_EXP",
            /**兑换得到金币 */
            EXCHANGE_AWARD_GOLD: "EXCHANGE_AWARD_GOLD",
            /**兑换得到金币 */
            HEROPIECERAIN_RESET_TIME: "HEROPIECERAIN_RESET_TIME",
            /**兑换得到金币 */
            HEROPIECERAIN_POINT_MIN: "HEROPIECERAIN_POINT_MIN",
            /**精英BOSS挑战月卡奖励倍数 */
            BOSSCOMBAT_MONTH_NUM: "BOSSCOMBAT_MONTH_NUM",
            /**精英BOSS挑战终生卡奖励倍数 */
            BOSSCOMBAT_FOREVER_NUM: "BOSSCOMBAT_FOREVER_NUM",
            /**邮件有效时间 */
            MAIL_TIME: "MAIL_TIME",
            /**签到周期 */
            SIGN_PERIOD: "SIGN_PERIOD",
            /**七天在线补领所需勾玉 */
            ONLINE_NEED_MONEY: "ONLINE_NEED_MONEY",
            /**轮盘抽奖最高档 */
            ROULETTE_LIMIT: "ROULETTE_LIMIT",

            /**缓存自动更新时间 */
            CACHE_UPDATE_TIME: "CACHE_UPDATE_TIME",
            /**命格养成每个球每次消耗的命格值 */
            LIFELIKE_BALL_VALUE: "LIFELIKE_BALL_VALUE",
            /**兑换得到命格值 */
            EXCHANGE_AWARD_LIFELIKE: "EXCHANGE_AWARD_LIFELIKE",
            /**命格层级上限 */
            LIFELIKE_LEVEL_LIMIT: "LIFELIKE_LEVEL_LIMIT",
            /**世界boss挑战次数 */
            WORLDBOSS_CHALLENGE_TIMES: "WORLDBOSS_CHALLENGE_TIMES",
        },
        Vars: {
            /**启始最小关卡编号 */
            CHECK_POINT_MIN: 1001,
            /** 代币抽SSR初始次数 */
            SSR_INIT_NUM: 10,
            /** 挂机自动抽奖间隔秒数 */
            CHECKPOINT_EXTRACT_INTERVAL: 60,
            /** 日常任务重置时间点:时 */
            DAILY_TASK_RESET_HOUR: 6,
            /** 日常任务重置时间点:分 */
            DAILY_TASK_RESET_MIN: 30,
            /** 日常任务重置时间点:秒 */
            DAILY_TASK_RESET_SEC: 30,
        },
        Enums: {
            /**升级类型:1：升级，2：升星，3：升宝具，4：进化 */
            UpgradeType: {
                HeroLv: 1,
                StarLv: 2,
                PropLv: 3,
                Evolve: 4
            },
            /**式神召唤类型 */
            SummonType: {
                Money: 1,
                Gold: 2,
                Ticket: 3,
                GouYu: 4,
                /**XP抽奖 */
                XP: 5
            },
            /**技能类型 */
            SkillType: {
                Null: 0,
                /**[攻击时触发]倍率伤害 */
                DamageRate: 1,
                /**[攻击后触发]恢复以我方总血量百分几 */
                ReSelfHP: 2,
                /**[攻击后触发]恢复以我方当前血量百分几 */
                ReSelfHPOfCurrent: 3,
                /**[攻击后触发]恢复以敌方总血量的百分几 */
                ReEnemyHP: 4,
                /**[攻击后触发]恢复以敌方当前血量百分几 */
                ReEnemyHPOfCurrent: 5,
                /**[攻击时触发]造成敌方当前血量百分几的伤害 */
                DamageEnemyHPOfCurrent: 6,

                /**[被动技能]增加我方的攻击属性 */
                IncAttack: 11,
                /**[被动技能]增加我方的血量属性 */
                IncPH: 12,
                /**[被动技能]增加我方的命中属性 */
                IncHit: 13,
                /**[被动技能]增加我方的闪避属性 */
                IncDodge: 14,
                /**[被动技能]增加我方的先攻属性 */
                IncSpeed: 15
            },
            /**物品逻辑类型 */
            ItemLogicType: {
                /**不可使用 */
                None: 0,
                /**合成物品 */
                Compose: 1,
                /**获得物品 */
                Item: 2,
                /**获得式神 */
                Hero: 3,
                /**获得式神抽奖机会 */
                DrawHero: 4,
                /**获得物品抽奖机会 */
                DrawItem: 5,
            },
            /**物品类型 */
            ItemType: {
                /**道具 */
                Prop: 0,
                /**材料 */
                Mat: 1
            },
            /**物品分类 */
            ItemClass: {
                /**金币 */
                Gold: 1,
                /**经验 */
                Exp: 2,
                /**勾玉 */
                Money: 3
            },
            /**物品分类Id */
            ItemClassId: {
                /**金币 */
                Gold: 100000,
                /**经验 */
                Exp: 200000,
                /**勾玉 */
                Money: 300000
            },
            /**式神类型 */
            HeroType: {
                /**主角式神Min ID */
                Main: 90001,
                /**普通Min ID */
                Common: 10001
            },
            /**任务类型 */
            TaskType: {
                /**通过关卡 */
                Checkpoint: 1,
                /**式神上阵 */
                HeroLineup: 2,
                /**达成等级的阵位 */
                LineupLv: 3,
                /**达到进化等级的阵位 */
                SkillLv: 4,
                /**达到强化等级的宝具 */
                PropLv: 5,
                /**达到战斗力 */
                Power: 6,
                /**完成一次百鬼 */
                Goblin: 7,
                /**镇妖塔 */
                Tower: 8,
                /**妖怪雨 */
                HeroPieceRain: 9,
            },
            /**式神图鉴成就状态 */
            illAchStatus: {
                /**未达成 */
                Not: 10,
                /**可领取 */
                Can: 20,
                /**已领取 */
                Alr: 30,
            },
            /**领取状态 */
            getStatus: {
                /**未达成 */
                Not: 10,
                /**可领取 */
                Can: 20,
                /**已领取 */
                Alr: 30,
                /**补领 */
                Rem: 40
            },
            /**首次在线类型 */
            dayType: {
                /**第一天在线 */
                FirstDay: 1,
                /**七天在线 */
                SevenDay: 2,
            },
            /**七天在线最后一天 */
            SevenDayLastDay: 7,
            /**日常任务类型 */
            dailyTaskType: {
                DailyGoblin: 1,         //每日百鬼
                DailyTower: 2,          //每日爬塔
                DailyCombat: 3,         //每日战斗
                DailyExtractGold: 4,    //每日金币抽奖
                DailyExtractMoney: 5,   //每日代币抽奖
                DailyPieceRain: 6,      //每日妖怪雨
                DailyOnline: 7,          //每日持续在线1分钟
            },
            /**成就任务类型 */
            achieveTaskType: {
                AchieveLv: 101,             //式神位总等级
                AchieveStarLv: 102,         //式神位宝具总星级
                AchieveSkillLv: 103,        //式神位进化总等级
                AchieveLinupNum: 104,       //式神总数量
                AchievePointNum: 105,       //关卡完成度
            },
            /**日常任务奖励领取状态 */
            dailyTaskAwardStatus: {
                Not: 0,         //无法领取
                Can: 1,         //可领取
                Alr: 2,         //已领取
            },
            /**日常任务奖励补领方式 */
            remedialType: {
                Free: 0,        //只领取免费的
                Pay: 1,          //付费全领
            },
            /**成就任务奖励领取状态 */
            achieveTaskAwardStatus: {
                Not: 0,         //无法领取
                Can: 1,         //可领取
                Alr: 2,         //已领取
            },
            /**每日任务完成次数基本增量 */
            DailyMinInc: 1,
            /**达摩式神id(升级材料) */
            materialHero: 10009,
            /**红点类型 */
            redPointType: {
                /**邮件 */
                Mail: 1,
                /**图鉴成就 */
                IllAch: 2,
                /**签到 */
                Sign: 3,
            },
            /**返利类型 */
            rebateType: {
                /**当日充值 */
                Today: 1,
                /**当日首充 */
                TodayFirst: 2,
                /**当日累计充值 */
                TodayTotal: 3,
                /**全生涯累计充值 */
                AllTotal: 4,
                /**全生涯投资每日返利充值 */
                AllEvery: 5,
                /**全生涯任性高倍率首充 */
                AllHigtTimes: 6,
                /**全生涯首充抽签 */
                AllFirstLottery: 7
            },
            /**充值类型 */
            rechargeType: {
                /**当日充值 */
                Today: 1,
                /**全生涯累计充值 */
                All: 2
            },
            /**命格属性类型 */
            LifeLikeIncType: {
                /**攻击属性 */
                Attack: 1,
                /**血量属性 */
                Hp: 2,
                /**命中属性 */
                Hit: 3,
                /**闪避属性 */
                Dodge: 4,
                /**先攻属性 */
                Speed: 5
            },
            /**排位赛挑战令上限 */
            RankedCard: 5,
            /**排位赛挑战令价格 */
            RankedPrice: 100,
            /**排位赛挑战令恢复CD(秒) */
            RankedCardCD: 1800, //30分钟
            /**排位赛挑战对手后可再次挑战的CD(秒) */
            RankedFightCD: 300, //5分钟
            /**排位赛玩家redis信息更新时间间隔(秒) */
            RankedRedisUpdate: 3600, //1小时
            /**排位赛玩家redis信息前缀 */
            RankedRedisPlayerPrefix: "ranking:",
            /**排位赛玩家排名的匹配范围 */
            RankedMatchArea: {
                /**第1名 */
                Area1: 0,
                /**第2名 */
                Area2: 1,
                /**第3名 */
                Area3: 2,
                /**第4-9名 */
                Area4: 3,
                /**第10-49名 */
                Area5: 5,
                /**第50-99名 */
                Area6: 10,
                /**第100-199名 */
                Area7: 20,
                /**第200-499名 */
                Area8: 30,
                /**第500-999名 */
                Area9: 50,
                /**第1000-1999名 */
                Area10: 100,
                /**第2000-4999名 */
                Area11: 500,
                /**第5000-9999名 */
                Area12: 1000,
                /**第10000名之后 */
                Area13: 2000,
            },
            /**消费类型 */
            consumeType: {
                /**0:商店购买物品 */
                buyItem: 0,
                /**1:刷新式神商店 */
                reHeroShop: 1,
                /**2:召唤抽奖 */
                heroTake: 2,
                /**3:补充体力 */
                buyenergy: 3,
                /**4:勾玉转经验 */
                exchangexp: 4,
                /**5:勾玉转金币 */
                exchangglod: 5,
                /**6:勾玉转道具 */
                exchanghero: 6,
                /**7:勾玉轮盘 */
                moneyroulette: 7,
            },
            /**消费货币类型 */
            consumeMoneyType: {
                /**代币(非赠送) */
                money: 0,
                /**代币(非赠送) */
                givMoney: 1,
                /**金币 */
                gold: 2
            }
        }
    };
}

/* account table */
CREATE TABLE IF NOT EXISTS `account` (
  `id` bigint) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `password` varchar(50) COLLATE utf8_unicode_ci DEFAULT '',
  `channel_uid` bigint unsigned DEFAULT 0,
  `channel` smallint unsigned DEFAULT 0,
  `first_login` bigint unsigned DEFAULT 0,
  `last_login` bigint unsigned DEFAULT 0,
  `last_logout` bigint unsigned DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_ACCOUNT_NAME` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13000 CHARSET=utf8 COLLATE=utf8_unicode_ci;

/* user_role table */
CREATE TABLE IF NOT EXISTS `user_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_type` smallint unsigned NOT NULL DEFAULT 0,
  `account_id` bigint unsigned NOT NULL,
  `name` varchar(20) COLLATE utf8_unicode_ci NOT NULL,
  `lv` smallint unsigned NOT NULL DEFAULT 1,
  `area_id` bigint unsigned DEFAULT 1,
  `last_login` bigint unsigned DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_USERROLE_NAME_AREAID` (`name`,`area_id`),
  INDEX `IX_USERROLE_UID_AREAID` (`area_id`,`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1000 CHARSET=utf8 COLLATE=utf8_unicode_ci;

/* area_list table */
CREATE TABLE IF NOT EXISTS `area_list` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `area_no` int unsigned DEFAULT 0,
  `area_name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `area_type` smallint unsigned NOT NULL DEFAULT 1, /*提供渠道专区配置,1为官方*/
  `min_ver` int unsigned DEFAULT 0,
  `status` smallint unsigned DEFAULT 0,/*0-未开服, 1-已开服, 2-维护中, 3-新, 4-热, 5-爆满*/
  `t_area_id` int unsigned DEFAULT 0,/*指向实现服id,滚服采用*/
  `db_con_conf` varchar(200) COLLATE utf8_unicode_ci,  
  `db_con_data` varchar(200) COLLATE utf8_unicode_ci,  
  `db_con_log` varchar(200) COLLATE utf8_unicode_ci,
  `start_time` bigint unsigned DEFAULT 0,/*开服时间*/
  `create_time` bigint unsigned DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `INDEX_AREA_NAME_TYPE` (`area_no`,`area_type`)
) ENGINE=InnoDB AUTO_INCREMENT=1 CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*===================================*/
/*config settings*/
/*关卡配置*/
CREATE TABLE IF NOT EXISTS `cfg_checkpoint` (
  `id` bigint unsigned NOT NULL,
  `point` int unsigned NOT NULL, /*关卡数*/
  `name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `exp` bigint unsigned NOT NULL DEFAULT 0,
  `gold` bigint unsigned DEFAULT 0,
  `boss` int unsigned DEFAULT 0,
  `min_ts` int unsigned DEFAULT 0,/*间隔时间(秒)*/
  `amount` int unsigned DEFAULT 0,/*消耗的体力值*/
  `item1` int unsigned DEFAULT 0,
  `num1` int unsigned DEFAULT 0,
  `item2` int unsigned DEFAULT 0,
  `num2` int unsigned DEFAULT 0,
  `item3` int unsigned DEFAULT 0,
  `num3` int unsigned DEFAULT 0,
  `item4` int unsigned DEFAULT 0,
  `num4` int unsigned DEFAULT 0,
  `item5` int unsigned DEFAULT 0,
  `num5` int unsigned DEFAULT 0,
  `addLineup` int unsigned DEFAULT 0,     /*首次通过关卡后,开启式神阵位的数量*/
  `drop_cd` int unsigned DEFAULT 1,       /*关卡掉落奖励的CD，单位：秒*/
  `drop_item` int unsigned DEFAULT 0,     /*掉落的物品ID*/
  `drop_percent` int unsigned DEFAULT 0,  /*掉落物品的几率，单位：万分比*/
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*在线挂机抽奖配置*/
CREATE TABLE IF NOT EXISTS `cfg_online_lottery` (
  `item_id` bigint unsigned NOT NULL,
  `weight` real(5,4) unsigned DEFAULT 0,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*玩家角色配置*/
CREATE TABLE IF NOT EXISTS `cfg_character` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `quality` int unsigned DEFAULT 1,/*R > SR > SSR*/
  `attack` int unsigned DEFAULT 0,/*初始攻击*/
  `hero_attack` real(10,2) unsigned DEFAULT 0,/*式神升级时攻击增加值*/
  `prop_attack` real(10,2) unsigned DEFAULT 0,/*宝具升级时攻击增加值*/
  `hp` int unsigned DEFAULT 0,
  `hero_hp` real(10,2) unsigned DEFAULT 0,
  `prop_hp` real(10,2) unsigned DEFAULT 0,
  `hit` int unsigned DEFAULT 0,
  `hero_hit` real(10,2) unsigned DEFAULT 0,
  `prop_hit` real(10,2) unsigned DEFAULT 0,
  `dodge` int unsigned DEFAULT 0,
  `hero_dodge` real(10,2) unsigned DEFAULT 0,
  `prop_dodge` real(10,2) unsigned DEFAULT 0,
  `speed` int unsigned DEFAULT 0,
  `hero_speed` real(10,2) unsigned DEFAULT 0,
  `prop_speed` real(10,2) unsigned DEFAULT 0,
  `n_skill_id` int unsigned DEFAULT 0,
  `skill_id` int unsigned DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*物品配置*/
CREATE TABLE IF NOT EXISTS `cfg_item` (
  `id` bigint UNSIGNED NOT NULL,
	`name` varchar(50) NOT NULL COLLATE 'utf8_unicode_ci',
	`type` int NOT NULL COMMENT '物品类型 0：道具物品 1：材料物品',
	`quality` int NOT NULL COMMENT '物品品质 5：橙色 4：紫色 3：蓝色 2：绿色 1：灰色',
	`gold` int NOT NULL COMMENT '出售时获得的金币数量',
	`max_num` int UNSIGNED NULL DEFAULT '0',
	`logic_type` int NULL COMMENT '可触发逻辑类型 0：不可使用 1：物品合成 2：使用后可获得物品 3：使用后可获得式神 4：使用后可进行式神抽奖 5:使用后可进行物品抽奖',
	`logic_ids` varchar(100) NULL COMMENT '依据触发类型 类型1:物品ID 2:物品ID 注：金币、经验、代币也有特殊物品ID 3:获得的式神类型ID 4:可触发的抽奖类型ID 多个使用\',\'隔开' COLLATE 'utf8_unicode_ci',
	`logic_nums` varchar(100) NULL COMMENT '依据触发类型 类型1:无含义 2:可获得的物品数量 3:无含义 4:无含义 5:无含义 多个使用\',\'隔开' COLLATE 'utf8_unicode_ci',
  `cost_ids` varchar(100) NULL COMMENT '消耗物品ID 金币、代币特殊物品ID' COLLATE 'utf8_unicode_ci',
	`cost_nums` varchar(100) NULL COMMENT '消耗物品数量' COLLATE 'utf8_unicode_ci',
	`use_script` varchar(1000) NULL DEFAULT NULL COLLATE 'utf8_unicode_ci',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*怪物阵容表*/
CREATE TABLE IF NOT EXISTS `cfg_monster` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `attack` int unsigned DEFAULT 0,/*攻击*/
  `hp` int unsigned DEFAULT 0,
  `hit` int unsigned DEFAULT 0,
  `dodge` int unsigned DEFAULT 0,
  `speed` int unsigned DEFAULT 0,
  `power` int unsigned DEFAULT 0,/*战斗力*/
  `num` int unsigned DEFAULT 0,
  `skill` varchar(200) COLLATE utf8_unicode_ci NOT NULL,/*技能ID与等级的编号规则*/  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*式神类型表*/
CREATE TABLE IF NOT EXISTS `cfg_hero` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `quality` int unsigned DEFAULT 1,/*R > SR > SSR*/
  `attack` int unsigned DEFAULT 0,/*初始攻击*/
  `hero_attack` real(10,2) unsigned DEFAULT 0,/*式神升级时攻击增加值*/
  `prop_attack` real(10,2) unsigned DEFAULT 0,/*宝具升级时攻击增加值*/
  `hp` int unsigned DEFAULT 0,
  `hero_hp` real(10,2) unsigned DEFAULT 0,
  `prop_hp` real(10,2) unsigned DEFAULT 0,
  `hit` int unsigned DEFAULT 0,
  `hero_hit` real(10,2) unsigned DEFAULT 0,
  `prop_hit` real(10,2) unsigned DEFAULT 0,
  `dodge` int unsigned DEFAULT 0,
  `hero_dodge` real(10,2) unsigned DEFAULT 0,
  `prop_dodge` real(10,2) unsigned DEFAULT 0,
  `speed` int unsigned DEFAULT 0,
  `hero_speed` real(10,2) unsigned DEFAULT 0,
  `prop_speed` real(10,2) unsigned DEFAULT 0,
  `n_skill_id` int unsigned DEFAULT 0,
  `skill_id` int unsigned DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*升级消耗表*/
CREATE TABLE IF NOT EXISTS `cfg_lv_cost` (
  `id` bigint unsigned NOT NULL,  
  `starLv` int unsigned DEFAULT 1 COMMENT '需要的星级',
  `lv` int unsigned DEFAULT 1 COMMENT '等级',
  `item1` int unsigned DEFAULT 0 COMMENT '进化材料1 0：无消耗1：金币；2：经验；其它：物品类型ID*/',
  `num1` int unsigned DEFAULT 0 COMMENT '材料1数量*/',
  `item2` int unsigned DEFAULT 0,
  `num2` int unsigned DEFAULT 0,
  `item3` int unsigned DEFAULT 0,
  `num3` int unsigned DEFAULT 0,
  `item4` int unsigned DEFAULT 0,
  `num4` int unsigned DEFAULT 0,
  `item5` int unsigned DEFAULT 0,
  `num5` int unsigned DEFAULT 0,
  PRIMARY KEY (`id`),
   UNIQUE KEY `UNIQUE_LV` (`lv`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*升星消耗表*/
CREATE TABLE IF NOT EXISTS `cfg_starlv_cost` (
  `id` bigint unsigned NOT NULL,  
  `starLv` int unsigned DEFAULT 1 COMMENT '星级',
  `item1` int unsigned DEFAULT 0 COMMENT '进化材料1 0：无消耗1：金币；2：经验；其它：物品类型ID*/',
  `num1` int unsigned DEFAULT 0 COMMENT '材料1数量*/',
  `item2` int unsigned DEFAULT 0,
  `num2` int unsigned DEFAULT 0,
  `item3` int unsigned DEFAULT 0,
  `num3` int unsigned DEFAULT 0,
  `item4` int unsigned DEFAULT 0,
  `num4` int unsigned DEFAULT 0,
  `item5` int unsigned DEFAULT 0,
  `num5` int unsigned DEFAULT 0,
  PRIMARY KEY (`id`),
   UNIQUE KEY `UNIQUE_STARLV` (`starLv`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*宝具强化消耗表*/
CREATE TABLE IF NOT EXISTS `cfg_prop_cost` (
  `lv` bigint unsigned NOT NULL COMMENT '宝具强化等级',
  `item1` int unsigned DEFAULT 0 COMMENT '进化材料1 0：无消耗1：金币；2：经验；其它：物品类型ID',
  `num1` int unsigned DEFAULT 0 COMMENT '材料1数量',
  `item2` int unsigned DEFAULT 0,
  `num2` int unsigned DEFAULT 0,
  `item3` int unsigned DEFAULT 0,
  `num3` int unsigned DEFAULT 0,
  `item4` int unsigned DEFAULT 0,
  `num4` int unsigned DEFAULT 0,
  `item5` int unsigned DEFAULT 0,
  `num5` int unsigned DEFAULT 0,
  PRIMARY KEY (`lv`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*技能进化消耗表*/
CREATE TABLE IF NOT EXISTS `cfg_skill_cost` (
  `lv` bigint unsigned NOT NULL COMMENT '技能进化等级',
  `item1` int unsigned DEFAULT 0 COMMENT '进化材料1 0：无消耗1：金币；2：经验；其它：物品类型ID',
  `num1` int unsigned DEFAULT 0 COMMENT '材料1数量',
  `item2` int unsigned DEFAULT 0,
  `num2` int unsigned DEFAULT 0,
  `item3` int unsigned DEFAULT 0,
  `num3` int unsigned DEFAULT 0,
  `item4` int unsigned DEFAULT 0,
  `num4` int unsigned DEFAULT 0,
  `item5` int unsigned DEFAULT 0,
  `num5` int unsigned DEFAULT 0,
  `heros` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '进化消耗的式神 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]',
  PRIMARY KEY (`lv`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*式神技能表*/
CREATE TABLE IF NOT EXISTS `cfg_hero_skill` (
  `id` bigint unsigned NOT NULL,
  `skill_id` int unsigned DEFAULT 0,
  `lv` int unsigned DEFAULT 1,
  `name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `prob` real(5,4) unsigned DEFAULT 0,/*触发概率*/
  `precond` int unsigned DEFAULT 0,/*前置条件*/
  `precond_num` real(5,4) unsigned DEFAULT 0,
  `passive` bit DEFAULT 0,/*被动*/
  `effect_type` int unsigned DEFAULT 0,/*1：伤害技能，2：回复并攻击，3：反伤并攻击*/
  `effect_num` real(10,2) unsigned DEFAULT 0,
  `state_type` int unsigned DEFAULT 0,
  `state_num` real(10,2) unsigned DEFAULT 0,
  `state_round` int unsigned DEFAULT 0,/*持续回合*/
  'target' int unsigned DEFAULT 0,/*施放目标 1:对方,2:己方*/
  `descp` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UINDEX_SKILL_ID_LV` (`skill_id`,`lv`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*技能状态表*/
CREATE TABLE IF NOT EXISTS `cfg_skill_state` (
  `id` bigint unsigned NOT NULL,
  `name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `type` int unsigned DEFAULT 0,
  `weight` int unsigned DEFAULT 0,/*状态优先级权重*/
  PRIMARY KEY (`id`),
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*主角升级表*/
CREATE TABLE IF NOT EXISTS `cfg_role_cost` (
  `id` bigint unsigned NOT NULL,
  `type` int unsigned DEFAULT 1,/*1：升级，2：升星，3：升宝具，4：进化*/
  `lv` int unsigned DEFAULT 1,
  `item` int unsigned DEFAULT 0,
  `num` int unsigned DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UINDEX_TYPE_LV` (`type`,`lv`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*式神抽奖配置*/
CREATE TABLE IF NOT EXISTS `cfg_hero_lottery` (
  `id` bigint unsigned NOT NULL,
  `type` int unsigned DEFAULT 1,/*1:代币抽，2：金币抽，3：奖券抽。4：勾玉第十次保底抽*/
  `hero_id` bigint unsigned NOT NULL,
  `weight` real(5,4) unsigned DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*式神抽奖消耗表*/
CREATE TABLE IF NOT EXISTS `cfg_lottery_cost` (
  `type` int unsigned DEFAULT 1,/*1:代币抽，2：金币抽，3：奖券抽。4：勾玉第十次保底抽*/
  `item` int unsigned DEFAULT 0,
  `num` int unsigned DEFAULT 0,
  `free_num` int unsigned DEFAULT 0,
  `ratio` real(8,4) unsigned DEFAULT 0,
  `xp_num` int unsigned DEFAULT 0,/*消耗后添加xp的值*/
  PRIMARY KEY (`type`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*常量配置表*/
CREATE TABLE IF NOT EXISTS `cfg_const` (
  `name` varchar(40) COLLATE utf8_unicode_ci NOT NULL,
  `descp` varchar(100) COLLATE utf8_unicode_ci,
  `num` real(12,4) unsigned DEFAULT 0,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*百鬼配置*/
CREATE TABLE IF NOT EXISTS `cfg_goblin` (
  `id` bigint unsigned NOT NULL,
  `weight` real(5,4) unsigned DEFAULT 0,
  `point` bigint unsigned NOT NULL COMMENT '解锁BOSS所需的关卡数',
  `bean` bigint unsigned NOT NULL COMMENT '挑战扣除的豆子',
  `time` bigint unsigned NOT NULL COMMENT '挑战的时限（单位秒）',
  `maxHp` bigint unsigned DEFAULT 0,
  `item1` int unsigned DEFAULT 0,
  `prob1` real(5,4) unsigned DEFAULT 0,
  `item2` int unsigned DEFAULT 0,
  `prob2` real(5,4) unsigned DEFAULT 0,
  `item3` int unsigned DEFAULT 0,
  `prob3` real(5,4) unsigned DEFAULT 0,
  `item4` int unsigned DEFAULT 0,
  `prob4` real(5,4) unsigned DEFAULT 0,
  `item5` int unsigned DEFAULT 0,
  `prob5` real(5,4) unsigned DEFAULT 0,
  `exp` bigint unsigned NOT NULL COMMENT '经验奖励数量,必然获得',
  `gold` bigint unsigned NOT NULL COMMENT '金币奖励数量,必然获得',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


/*式神熔炼配置*/
CREATE TABLE `cfg_hero_smelt` (
	`id` BIGINT UNSIGNED NOT NULL,
	`quality` INT UNSIGNED DEFAULT 1 COMMENT '品质',
	`fragment` INT UNSIGNED DEFAULT 0 COMMENT '式神碎片数量',
	`lotteryRatio` real(8,4) unsigned DEFAULT 0 COMMENT '抽奖概率',
	`lotteryType` INT UNSIGNED DEFAULT 0 COMMENT '抽奖类型ID',
	PRIMARY KEY (`id`),
  UNIQUE INDEX `QUALITY` (`quality`)
)ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*物品商店配置*/
CREATE TABLE `cfg_shop` (
	`id` bigint unsigned NOT NULL,
	`item_id` int unsigned NOT NULL COMMENT '物品编号',
	`type` int unsigned DEFAULT 0 COMMENT '货币类型 0:金币 1:代币',
	`price` int unsigned DEFAULT 0 COMMENT '价格',
	PRIMARY KEY (`id`)
)ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*式神兑换池配置*/
CREATE TABLE `cfg_shop_hero_pool` (
	`id` bigint unsigned NOT NULL,
	`hero_id` int unsigned NOT NULL COMMENT '式神编号',
	`weight` real(5,4) unsigned DEFAULT 0 COMMENT '式神权重',
	`fragment` int unsigned DEFAULT 0 COMMENT '兑换碎片数',
	PRIMARY KEY (`id`)
)ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*物品抽奖配置*/
CREATE TABLE IF NOT EXISTS `cfg_item_lottery` (
  `id` bigint unsigned NOT NULL,
  `type` int unsigned DEFAULT 1 COMMENT '抽奖类型',
  `item_id` bigint unsigned NOT NULL  COMMENT '物品编号',
  `num` bigint unsigned NOT NULL  COMMENT '物品数量',
  `weight` real(5,4) unsigned DEFAULT 0  COMMENT '权重',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*式神图鉴配置*/
CREATE TABLE IF NOT EXISTS `cfg_hero_illustrated` (
  `id` bigint unsigned NOT NULL,
	`quality` int unsigned DEFAULT 1 COMMENT '式神品质',
  `power` int unsigned NOT NULL  COMMENT '图鉴的战力',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*式神图鉴成就*/
CREATE TABLE IF NOT EXISTS `cfg_ill_ach` (
  `id` bigint unsigned NOT NULL COMMENT '成就编号',
  `needHeroIds` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '完成成就需要的式神 格式:[10001,10002]',
  `items` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id',
  `heros` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]',  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*特权卡配置*/
CREATE TABLE IF NOT EXISTS `cfg_card` (
  `id` bigint unsigned NOT NULL,
  `type` bigint unsigned NOT NULL COMMENT '卡类型 1:月卡 2:终身卡',
	`price` bigint unsigned DEFAULT 1 COMMENT '价格,单位:分',
  `buyAward` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '购买时的奖品 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id',
  `evydayAward` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '每日可领的奖品 格式与购买时的奖品系统',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*游戏任务配置*/
CREATE TABLE IF NOT EXISTS `cfg_task` (
  `id` bigint unsigned NOT NULL,
  `type` bigint unsigned NOT NULL COMMENT '任务类型 1:通过关卡 2:上阵式神 3:达成等级的阵位 4:达到进化等级的阵位 5:达到强化等级的宝具 6:达到战斗力',
	`condition` bigint unsigned NOT NULL COMMENT '任务达成条件,与type关联 type为1:关卡ID 为2:上阵式神数 为3:阵位数量 为4:阵位数量 为5:宝具数量 为6:战斗力值',
  `condition2` bigint unsigned NOT NULL COMMENT '任务达成条件2,与type关联 type为3:阵位等级 为4:阵位的进化等级 为5:宝具的强化等级',
  `nextTaskId` bigint unsigned NOT NULL COMMENT '该任务的下个任务ID, 0:没有下个任务',
  `items` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id',
  `heros` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*首充、累充奖励配置*/
CREATE TABLE IF NOT EXISTS `cfg_recharge` (
  `id` bigint unsigned NOT NULL COMMENT '10001:首充奖励',
  `needMoney` bigint unsigned NOT NULL COMMENT '领取奖励需要的充值金额(单位:分),首充为0',
	`nextId` bigint unsigned NOT NULL COMMENT '下个充值奖励的id, 0:没有下个奖励',
  `items` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '任务物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id',
  `heros` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '任务式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*镇妖塔配置*/
CREATE TABLE IF NOT EXISTS `cfg_tower` (
  `id` bigint unsigned NOT NULL COMMENT '塔层编号',
  `name` varchar(50) NOT NULL COLLATE 'utf8_unicode_ci' COMMENT '塔层名称',
	`power` bigint unsigned NOT NULL COMMENT '塔怪物战斗力',
  `monsterId` bigint unsigned NOT NULL COMMENT '怪物阵容ID，即cfg_monster表ID。若不触发战斗，则配置为0。',
  `exp` bigint unsigned NOT NULL COMMENT '经验奖励数量,必然发放',
  `gold` bigint unsigned NOT NULL COMMENT '金币奖励数量,必然发放',
  `itemsProb` real(8,4) unsigned DEFAULT 0 COMMENT '获取物品奖励的几率',
  `items` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '挑战成功物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id',
  `herosProb` real(8,4) unsigned DEFAULT 0 COMMENT '获取式神奖励的几率',
  `heros` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '挑战成功式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]',  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*关卡奖励配置*/
CREATE TABLE IF NOT EXISTS `cfg_point_award` (
  `id` bigint unsigned NOT NULL COMMENT '配置编号',  
	`point` bigint unsigned NOT NULL COMMENT '领奖需要通过的关卡数',
  `items` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '挑战成功物品奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id',  
  `heros` varchar(300) COLLATE utf8_unicode_ci NOT NULL COMMENT '挑战成功式神奖励 格式:[{"heroId":10001, "num":2},{"heroId":10002, "num":1}]',  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*签到奖励配置*/
CREATE TABLE `cfg_sign_award` (
	`id` INT(11) NOT NULL COMMENT '签到天数',
	`items` VARCHAR(300) NOT NULL COMMENT '签到奖励 格式:[{"itemId":100000, "num":100},{"itemId":400000, "num":1}] itemId: 100000:金币 200000:经验 300000:勾玉 >=400000:物品id',
  PRIMARY KEY (`id`)
)ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;
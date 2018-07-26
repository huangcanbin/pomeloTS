
/*日志表*/
CREATE TABLE IF NOT EXISTS `log_player` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `playerId` int unsigned DEFAULT '1',
  `lv` bigint unsigned NOT NULL,
  `exp` bigint unsigned DEFAULT '0',
  `exp_inc` bigint DEFAULT '0',  
  `gold` bigint unsigned NOT NULL,
  `gold_inc` bigint DEFAULT '0',  
  `money` bigint unsigned NOT NULL,
  `money_inc` bigint DEFAULT '0',  
  `energy` bigint unsigned NOT NULL,
  `energy_inc` bigint DEFAULT '0',  
  `bean` bigint unsigned NOT NULL,
  `bean_inc` bigint DEFAULT '0',  
  `from` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `create_date` date NOT NULL,
  `create_time` bigint unsigned DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;


CREATE TABLE IF NOT EXISTS `log_player_bag` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `playerId` int unsigned DEFAULT '1',
  `itemId` bigint unsigned NOT NULL,
  `num` bigint unsigned DEFAULT '0',
  `from` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `create_date` date NOT NULL,
  `create_time` bigint unsigned DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB CHARSET=utf8 COLLATE=utf8_unicode_ci;

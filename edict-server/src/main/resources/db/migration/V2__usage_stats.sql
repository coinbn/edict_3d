-- 创建使用统计表
CREATE TABLE IF NOT EXISTS `usage_stats` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `stat_date` VARCHAR(10) NOT NULL COMMENT '统计日期 yyyy-MM-dd',
  `total_tokens` BIGINT DEFAULT 0 COMMENT '总Token数',
  `total_cost` DECIMAL(10,2) DEFAULT 0.00 COMMENT '总费用',
  `active_sessions` INT DEFAULT 0 COMMENT '活跃会话数',
  `active_agents` INT DEFAULT 0 COMMENT '活跃Agent数',
  `messages_count` BIGINT DEFAULT 0 COMMENT '消息数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='使用统计表';

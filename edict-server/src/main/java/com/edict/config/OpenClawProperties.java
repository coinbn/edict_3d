package com.edict.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * OpenClaw Gateway 配置
 */
@Configuration
@ConfigurationProperties(prefix = "openclaw")
@Data
public class OpenClawProperties {
    
    /** Gateway 地址 */
    private String gatewayUrl = "http://localhost:3000";
    
    /** 默认模型 */
    private String defaultModel = "kimi-coding/k2p5";
    
    /** 是否启用真实 Agent 调用 */
    private boolean enabled = true;
    
    /** 子任务超时时间（秒） */
    private int subagentTimeout = 300;
}

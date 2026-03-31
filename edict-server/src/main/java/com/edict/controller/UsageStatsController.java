package com.edict.controller;

import com.edict.dto.UsageStatsDTO;
import com.edict.service.UsageStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UsageStatsController {
    
    private final UsageStatsService usageStatsService;
    
    /**
     * 获取使用统计
     * GET /api/stats/usage?range=7d
     */
    @GetMapping("/stats/usage")
    public UsageStatsDTO getUsageStats(@RequestParam(defaultValue = "7d") String range) {
        log.info("Fetching usage stats for range: {}", range);
        return usageStatsService.getUsageStats(range);
    }
    
    /**
     * 获取活跃会话数
     * GET /api/stats/active-sessions
     */
    @GetMapping("/stats/active-sessions")
    public Map<String, Object> getActiveSessions() {
        int count = usageStatsService.getActiveSessionsCount();
        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("activeSessions", count);
        return result;
    }
    
    /**
     * 记录当日统计（定时任务调用）
     * POST /api/stats/record
     */
    @PostMapping("/stats/record")
    public Map<String, Object> recordDailyStats() {
        try {
            usageStatsService.recordDailyStats();
            Map<String, Object> result = new HashMap<>();
            result.put("ok", true);
            result.put("message", "Stats recorded successfully");
            return result;
        } catch (Exception e) {
            log.error("Failed to record stats: {}", e.getMessage());
            Map<String, Object> result = new HashMap<>();
            result.put("ok", false);
            result.put("error", e.getMessage());
            return result;
        }
    }
}

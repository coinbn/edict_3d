package com.edict.service;

import com.edict.dto.UsageStatsDTO;
import com.edict.entity.UsageStats;
import com.edict.repository.UsageStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UsageStatsService {
    
    private final UsageStatsRepository usageStatsRepository;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    /**
     * 获取使用统计数据
     */
    @Transactional(readOnly = true)
    public UsageStatsDTO getUsageStats(String range) {
        UsageStatsDTO dto = new UsageStatsDTO();
        dto.setOk(true);
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        
        switch (range) {
            case "24h":
                startDate = endDate.minusDays(1);
                break;
            case "7d":
                startDate = endDate.minusDays(7);
                break;
            case "30d":
                startDate = endDate.minusDays(30);
                break;
            case "90d":
                startDate = endDate.minusDays(90);
                break;
            default:
                startDate = endDate.minusDays(7);
        }
        
        String startDateStr = startDate.format(DATE_FORMATTER);
        String endDateStr = endDate.format(DATE_FORMATTER);
        
        // 获取日期范围内的数据
        List<UsageStats> statsList = usageStatsRepository
            .findByStatDateBetweenOrderByStatDateAsc(startDateStr, endDateStr);
        
        // 获取活跃会话数（当天的最大值）
        String today = LocalDate.now().format(DATE_FORMATTER);
        Integer maxActiveSessions = usageStatsRepository.findMaxActiveSessionsByDate(today);
        dto.setActiveSessions(maxActiveSessions != null ? maxActiveSessions : 0);
        
        return dto;
    }
    
    /**
     * 记录使用统计（定时任务调用）
     */
    @Transactional
    public void recordDailyStats() {
        String today = LocalDate.now().format(DATE_FORMATTER);
        
        Optional<UsageStats> existing = usageStatsRepository.findByStatDate(today);
        
        UsageStats stats;
        if (existing.isPresent()) {
            stats = existing.get();
        } else {
            stats = new UsageStats();
            stats.setStatDate(today);
        }
        
        // 从 Agent 表统计
        stats.setActiveSessions(0);
        stats.setActiveAgents(0);
        
        usageStatsRepository.save(stats);
        log.info("Recorded daily usage stats for {}", today);
    }
    
    /**
     * 获取当前活跃会话数
     */
    @Transactional(readOnly = true)
    public int getActiveSessionsCount() {
        String today = LocalDate.now().format(DATE_FORMATTER);
        Integer maxSessions = usageStatsRepository.findMaxActiveSessionsByDate(today);
        return maxSessions != null ? maxSessions : 0;
    }
}

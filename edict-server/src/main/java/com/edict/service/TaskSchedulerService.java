package com.edict.service;

import com.edict.dto.*;
import com.edict.entity.EdictTask;
import com.edict.repository.EdictTaskRepository;
import com.edict.util.OpenClawCli;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 任务调度器 - 检测新任务并触发对应 Agent 执行
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskSchedulerService {
    
    private final EdictTaskRepository taskRepository;
    
    // 状态与 Agent 映射
    private static final Map<String, String> STATE_AGENT_MAP = new HashMap<>();
    static {
        STATE_AGENT_MAP.put("ToDo", "zhongshu");  // 太子创建后 → 中书省
        STATE_AGENT_MAP.put("Doing", "menxia");    // 中书省完成后 → 门下省
        STATE_AGENT_MAP.put("Review", "shangshu"); // 门下省审核后 → 尚书省
        STATE_AGENT_MAP.put("Assigned", "shangshu"); // 尚书省派发 → 
    }
    
    /**
     * 每 15 秒检查一次待处理任务
     */
    @Scheduled(fixedRate = 15000)
    public void checkPendingTasks() {
        log.debug("检查待处理任务...");
        
        try {
            // 1. 检查 ToDo 状态的新任务（太子刚创建的）
            List<EdictTask> todoTasks = taskRepository.findByStateAndArchivedFalseOrderByUpdatedAtDesc(EdictTask.TaskState.ToDo);
            for (EdictTask task : todoTasks) {
                // 只处理最近 5 分钟内的任务（避免重复处理）
                if (isRecentlyCreated(task)) {
                    triggerAgent(task, "zhongshu", "中书省");
                }
            }
            
            // 2. 检查 Doing 状态的任务
            List<EdictTask> doingTasks = taskRepository.findByStateAndArchivedFalseOrderByUpdatedAtDesc(EdictTask.TaskState.Doing);
            for (EdictTask task : doingTasks) {
                if (isRecentlyUpdated(task)) {
                    // 判断是哪个 Agent 正在处理
                    String currentOrg = task.getOrg();
                    if ("中书省".equals(currentOrg)) {
                        // 中书省完成了，需要触发门下省
                    }
                }
            }
            
        } catch (Exception e) {
            log.error("任务调度检查失败", e);
        }
    }
    
    /**
     * 触发 Agent 执行任务
     */
    private void triggerAgent(EdictTask task, String agentId, String agentName) {
        log.info("触发 Agent: {} 处理任务: {}", agentName, task.getId());
        
        try {
            // 构建任务消息
            String taskMessage = buildTaskMessage(task);
            
            // 调用 OpenClaw CLI 启动 agent
            try {
                OpenClawCli.CliResult result = OpenClawCli.execute(agentId, taskMessage, 300);
                
                if (result.isSuccess()) {
                    log.info("已触发 {} 处理任务 {}, 响应: {}", agentName, task.getId(), 
                        result.getOutput() != null ? result.getOutput().substring(0, Math.min(100, result.getOutput().length())) : "无输出");
                } else {
                    log.warn("触发 {} 失败: exitCode={}, error={}", agentName, result.getExitCode(), result.getError());
                }
            } catch (Exception e) {
                log.warn("无法触发 OpenClaw Agent: {}", e.getMessage());
                // 如果无法触发，记录日志等待人工处理
            }
            
        } catch (Exception e) {
            log.error("触发 Agent 失败: {}", agentName, e);
        }
    }
    
    /**
     * 构建任务消息
     */
    private String buildTaskMessage(EdictTask task) {
        StringBuilder sb = new StringBuilder();
        sb.append("📋 ").append(agentName(task.getOrg())).append("·任务通知\n");
        sb.append("任务ID: ").append(task.getId()).append("\n");
        sb.append("标题: ").append(task.getTitle()).append("\n");
        
        if (task.getNow() != null) {
            sb.append("说明: ").append(task.getNow()).append("\n");
        }
        
        return sb.toString();
    }
    
    /**
     * 获取 Agent 名称
     */
    private String agentName(String org) {
        if (org == null) return "未知";
        switch (org) {
            case "中书省": return "中书省";
            case "门下省": return "门下省";
            case "尚书省": return "尚书省";
            case "户部": return "户部";
            case "礼部": return "礼部";
            case "兵部": return "兵部";
            case "刑部": return "刑部";
            case "工部": return "工部";
            case "吏部": return "吏部";
            default: return org;
        }
    }
    
    /**
     * 检查任务是否最近创建（5分钟内）
     */
    private boolean isRecentlyCreated(EdictTask task) {
        if (task.getCreatedAt() == null) return false;
        long createdAt = task.getCreatedAt().toEpochSecond(ZoneOffset.UTC);
        long now = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC);
        return (now - createdAt) < 300; // 5 分钟
    }
    
    /**
     * 检查任务是否最近更新（5分钟内）
     */
    private boolean isRecentlyUpdated(EdictTask task) {
        if (task.getUpdatedAt() == null) return false;
        long updatedAt = task.getUpdatedAt().toEpochSecond(ZoneOffset.UTC);
        long now = LocalDateTime.now().toEpochSecond(ZoneOffset.UTC);
        return (now - updatedAt) < 300; // 5 分钟
    }
}

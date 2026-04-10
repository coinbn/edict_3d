package com.edict.service;

import com.edict.entity.EdictTask;
import com.edict.entity.FlowLog;
import com.edict.repository.EdictTaskRepository;
import com.edict.repository.FlowLogRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class KanbanSyncService {

    private static final String KANBAN_FILE = "C:\\Users\\admin\\.openclaw\\workspace\\kanban.json";
    private static final Pattern FLOW_PATTERN = Pattern.compile(
        "^(JJC-\\d+-\\d+):\\s*(\\w+)\\s*->\\s*(\\w+)\\s*\\|\\s*(.+)$"
    );
    private static final Pattern CREATE_PATTERN = Pattern.compile(
        "^(JJC-\\d+-\\d+):\\s*(.+)$"
    );
    private static final Pattern DONE_PATTERN = Pattern.compile(
        "^(JJC-\\d+-\\d+)\\s*完成.*$"
    );

    private final EdictTaskRepository taskRepository;
    private final FlowLogRepository flowLogRepository;
    private final ObjectMapper objectMapper;

    // 用于增量同步，记录最后同步的时间戳
    private LocalDateTime lastSyncTime = null;

    /**
     * 每5分钟执行一次同步任务
     */
    @Scheduled(cron = "0 */30 * * * ?")
    @Transactional
    public void syncKanbanData() {
        log.info("========== 开始同步看板数据 ==========");
        
        try {
            File kanbanFile = new File(KANBAN_FILE);
            if (!kanbanFile.exists()) {
                log.warn("看板文件不存在: {}", KANBAN_FILE);
                return;
            }

            JsonNode root = objectMapper.readTree(kanbanFile);
            
            // 1. 获取所有已存在的 flow_log 时间戳，用于增量同步
            Set<String> existingLogKeys = new HashSet<>();
            flowLogRepository.findAll().forEach(log -> {
                String key = log.getCreatedAt().toString() + "-" + log.getRemark();
                existingLogKeys.add(key);
            });

            // 2. 同步任务数据
            JsonNode tasks = root.get("tasks");
            if (tasks != null) {
                tasks.fields().forEachRemaining(entry -> {
                    JsonNode taskData = entry.getValue();
                    syncTask(entry.getKey(), taskData);
                });
            }

            // 3. 同步流转历史（增量）
            JsonNode history = root.get("history");
            if (history != null) {
                for (JsonNode record : history) {
                    syncFlowLog(record, existingLogKeys);
                }
            }
            
            lastSyncTime = LocalDateTime.now();
            log.info("========== 看板数据同步完成 ==========");
            
        } catch (Exception e) {
            log.error("同步看板数据失败", e);
        }
    }

    /**
     * 同步任务数据
     */
    private void syncTask(String taskId, JsonNode data) {
        EdictTask task = taskRepository.findById(taskId).orElse(new EdictTask());
        
        task.setId(taskId);
        task.setTitle(data.has("title") ? data.get("title").asText() : null);
        task.setState(parseState(data.has("state") ? data.get("state").asText() : "ToDo"));
        task.setOrg(data.has("org") ? data.get("org").asText() : null);
        task.setNow(data.has("current_progress") ? data.get("current_progress").asText() : null);
        task.setOutput(data.has("output") ? data.get("output").asText() : null);
        
        if (data.has("created_at")) {
            task.setCreatedAt(parseDateTime(data.get("created_at").asText()));
        }
        if (data.has("updated_at")) {
            task.setUpdatedAt(parseDateTime(data.get("updated_at").asText()));
        }
        if (data.has("completed_at")) {
            task.setUpdatedAt(parseDateTime(data.get("completed_at").asText()));
        }
        
        taskRepository.save(task);
        log.debug("同步任务: {}", taskId);
    }

    /**
     * 同步流转日志（增量）
     */
    private void syncFlowLog(JsonNode record, Set<String> existingLogKeys) {
        String timeStr = record.get("time").asText();
        String action = record.get("action").asText();
        String details = record.get("details").asText();
        
        // 检查是否已存在
        String logKey = timeStr + "-" + details;
        if (existingLogKeys.contains(logKey)) {
            return; // 跳过已存在的记录
        }

        // 查找关联的任务
        String taskId = extractTaskId(details);
        if (taskId == null) {
            return;
        }

        EdictTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) {
            log.warn("任务不存在，跳过流转记录: {}", taskId);
            return;
        }

        // 解析流转信息
        String fromAgent = null;
        String toAgent = null;
        String remark = details;

        if ("flow".equals(action)) {
            // 格式: "JJC-20260407-001: ToDo -> Doing | 中书省接旨，开始规划"
            Matcher matcher = FLOW_PATTERN.matcher(details);
            if (matcher.find()) {
                fromAgent = matcher.group(2);
                toAgent = matcher.group(3);
                remark = matcher.group(4);
            }
        } else if ("create".equals(action)) {
            // 格式: "创建任务 JJC-20260407-001: 开发小游戏测试任务流转"
            fromAgent = "系统";
            toAgent = "太子";
            remark = "任务创建: " + extractTitle(details);
        } else if ("done".equals(action)) {
            // 格式: "JJC-20260407-004 完成: H5猜数字小游戏..."
            fromAgent = "尚书省";
            toAgent = "完成";
            remark = details;
        }

        // 创建流转记录
        FlowLog flowLog = new FlowLog();
        flowLog.setTask(task);
        flowLog.setFromAgent(fromAgent);
        flowLog.setToAgent(toAgent);
        flowLog.setRemark(remark);
        flowLog.setCreatedAt(parseDateTime(timeStr));

        flowLogRepository.save(flowLog);
        existingLogKeys.add(logKey); // 添加到已存在集合，防止重复
        log.debug("同步流转记录: {} -> {}", fromAgent, toAgent);
    }

    /**
     * 从 details 中提取任务ID
     */
    private String extractTaskId(String details) {
        Matcher flowMatcher = FLOW_PATTERN.matcher(details);
        if (flowMatcher.find()) {
            return flowMatcher.group(1);
        }
        
        Matcher createMatcher = CREATE_PATTERN.matcher(details);
        if (createMatcher.matches()) {
            return createMatcher.group(1);
        }
        
        Matcher doneMatcher = DONE_PATTERN.matcher(details);
        if (doneMatcher.find()) {
            return doneMatcher.group(1);
        }
        
        // 尝试直接匹配 JJC-开头
        Pattern idPattern = Pattern.compile("JJC-\\d+-\\d+");
        Matcher idMatcher = idPattern.matcher(details);
        if (idMatcher.find()) {
            return idMatcher.group();
        }
        
        return null;
    }

    /**
     * 从 details 中提取标题
     */
    private String extractTitle(String details) {
        // "创建任务 JJC-20260407-001: 开发小游戏测试任务流转"
        int colonIndex = details.lastIndexOf(": ");
        if (colonIndex > 0) {
            return details.substring(colonIndex + 2);
        }
        return details;
    }

    /**
     * 解析状态
     */
    private EdictTask.TaskState parseState(String state) {
        if (state == null) return EdictTask.TaskState.ToDo;
        
        switch (state) {
            case "ToDo":
                return EdictTask.TaskState.ToDo;
            case "Doing":
                return EdictTask.TaskState.Doing;
            case "Review":
                return EdictTask.TaskState.Review;
            case "Done":
            case "已完成":
                return EdictTask.TaskState.Done;
            case "Blocked":
                return EdictTask.TaskState.Blocked;
            case "Cancelled":
                return EdictTask.TaskState.Cancelled;
            default:
                return EdictTask.TaskState.ToDo;
        }
    }

    /**
     * 解析时间
     */
    private LocalDateTime parseDateTime(String dateStr) {
        try {
            if (dateStr.contains("T")) {
                return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
            } else {
                return LocalDateTime.parse(dateStr);
            }
        } catch (Exception e) {
            log.warn("时间解析失败: {}", dateStr);
            return LocalDateTime.now();
        }
    }
}

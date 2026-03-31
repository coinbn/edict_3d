package com.edict.service;

import com.edict.dto.*;
import com.edict.entity.*;
import com.edict.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {
    
    private final EdictTaskRepository taskRepository;
    private final ProgressLogRepository progressLogRepository;
    private final AgentRepository agentRepository;
    
    private static final DateTimeFormatter ISO_FORMATTER = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
    @Transactional(readOnly = true)
    public SchedulerStateDTO getSchedulerState(String taskId) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        SchedulerStateDTO dto = new SchedulerStateDTO();
        dto.setOk(true);
        
        SchedulerStateDTO.SchedulerInfoDTO scheduler = new SchedulerStateDTO.SchedulerInfoDTO();
        scheduler.setRetryCount(task.getSchedulerRetryCount());
        scheduler.setEscalationLevel(task.getSchedulerEscalationLevel());
        scheduler.setLastDispatchStatus(task.getSchedulerLastDispatchStatus());
        scheduler.setStallThresholdSec(180L); // 默认 3 分钟
        scheduler.setEnabled(true);
        scheduler.setLastProgressAt(task.getSchedulerLastProgressAt() != null ? 
            task.getSchedulerLastProgressAt().format(ISO_FORMATTER) : null);
        scheduler.setLastDispatchAt(task.getSchedulerLastDispatchAt() != null ? 
            task.getSchedulerLastDispatchAt().format(ISO_FORMATTER) : null);
        scheduler.setLastDispatchAgent(task.getSchedulerLastDispatchAgent());
        scheduler.setAutoRollback(true);
        
        dto.setScheduler(scheduler);
        
        // 计算阻塞时间
        if (task.getSchedulerLastProgressAt() != null) {
            long stalledSec = Duration.between(task.getSchedulerLastProgressAt(), LocalDateTime.now()).getSeconds();
            dto.setStalledSec(stalledSec);
        }
        
        return dto;
    }
    
    @Transactional(readOnly = true)
    public TaskActivityDTO getTaskActivity(String taskId) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        List<ProgressLog> logs = progressLogRepository.findByTaskIdOrderByCreatedAtDesc(taskId);
        
        TaskActivityDTO dto = new TaskActivityDTO();
        dto.setOk(true);
        dto.setActivity(logs.stream().map(log -> {
            TaskActivityDTO.ActivityEntryDTO entry = new TaskActivityDTO.ActivityEntryDTO();
            entry.setKind("progress");
            entry.setAt(log.getCreatedAt() != null ? log.getCreatedAt().format(ISO_FORMATTER) : null);
            entry.setText(log.getContent());
            entry.setAgent(log.getAgent());
            return entry;
        }).collect(Collectors.toList()));
        
        // 统计待办事项
        TaskActivityDTO.TodosSummaryDTO todosSummary = new TaskActivityDTO.TodosSummaryDTO();
        int total = task.getTodos().size();
        int completed = (int) task.getTodos().stream().filter(t -> t.getStatus() == TaskTodo.TodoStatus.completed).count();
        int inProgress = (int) task.getTodos().stream().filter(t -> t.getStatus() == TaskTodo.TodoStatus.in_progress).count();
        int notStarted = (int) task.getTodos().stream().filter(t -> t.getStatus() == TaskTodo.TodoStatus.not_started).count();
        
        todosSummary.setTotal(total);
        todosSummary.setCompleted(completed);
        todosSummary.setInProgress(inProgress);
        todosSummary.setNotStarted(notStarted);
        todosSummary.setPercent(total > 0 ? (completed * 100 / total) : 0);
        dto.setTodosSummary(todosSummary);
        
        // 阶段耗时
        List<TaskActivityDTO.PhaseDurationDTO> phases = calculatePhaseDurations(task);
        dto.setPhaseDurations(phases);
        
        // 资源统计
        TaskActivityDTO.ResourceSummaryDTO resourceSummary = new TaskActivityDTO.ResourceSummaryDTO();
        resourceSummary.setTotalElapsedSec(phases.stream()
            .filter(p -> p.getDurationSec() != null)
            .mapToLong(TaskActivityDTO.PhaseDurationDTO::getDurationSec)
            .sum());
        dto.setResourceSummary(resourceSummary);
        
        return dto;
    }
    
    @Transactional
    public ActionResultDTO dispatchTask(String taskId, String agent, String message) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        // 更新调度信息
        task.setSchedulerLastDispatchAt(LocalDateTime.now());
        task.setSchedulerLastDispatchAgent(agent);
        task.setSchedulerLastDispatchStatus("dispatched");
        task.setNow("已派发给 " + agent + "：" + (message != null ? message : ""));
        task.setHeartbeatStatus("active");
        task.setHeartbeatLabel("执行中");
        
        // 添加进度日志
        ProgressLog progress = new ProgressLog();
        progress.setTask(task);
        progress.setAgent(agent);
        progress.setContent("任务派发: " + (message != null ? message : ""));
        progressLogRepository.save(progress);
        
        // 添加流程日志
        FlowLog flow = new FlowLog();
        flow.setTask(task);
        flow.setFromAgent("调度器");
        flow.setToAgent(agent);
        flow.setRemark("派发任务");
        task.getFlowLog().add(flow);
        
        taskRepository.save(task);
        
        // 更新 Agent 状态
        Agent targetAgent = agentRepository.findById(agent).orElse(null);
        if (targetAgent != null) {
            targetAgent.setStatus(Agent.AgentStatus.running);
            targetAgent.setLastActive(LocalDateTime.now());
            targetAgent.setTasksActive(targetAgent.getTasksActive() + 1);
            agentRepository.save(targetAgent);
        }
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Task dispatched to " + agent);
        return result;
    }
    
    @Transactional
    public ActionResultDTO schedulerRetry(String taskId, String reason) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        task.setSchedulerRetryCount(task.getSchedulerRetryCount() + 1);
        task.setNow("重试中: " + (reason != null ? reason : ""));
        
        ProgressLog progress = new ProgressLog();
        progress.setTask(task);
        progress.setAgent("scheduler");
        progress.setContent("调度器重试: " + (reason != null ? reason : ""));
        progressLogRepository.save(progress);
        
        taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Retry scheduled");
        return result;
    }
    
    @Transactional
    public ActionResultDTO schedulerEscalate(String taskId, String reason) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        task.setSchedulerEscalationLevel(task.getSchedulerEscalationLevel() + 1);
        task.setBlock("已升级: " + (reason != null ? reason : ""));
        task.setNow("问题升级，等待上级处理");
        
        ProgressLog progress = new ProgressLog();
        progress.setTask(task);
        progress.setAgent("scheduler");
        progress.setContent("问题升级: " + (reason != null ? reason : ""));
        progressLogRepository.save(progress);
        
        taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Escalated to higher level");
        return result;
    }
    
    @Transactional
    public ActionResultDTO schedulerRollback(String taskId, String reason) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        // 回退到上一个状态
        if (task.getPrevState() != null) {
            EdictTask.TaskState prevState = EdictTask.TaskState.valueOf(task.getPrevState());
            task.setState(prevState);
            task.setNow("已回退: " + (reason != null ? reason : ""));
        }
        
        ProgressLog progress = new ProgressLog();
        progress.setTask(task);
        progress.setAgent("scheduler");
        progress.setContent("状态回退: " + (reason != null ? reason : ""));
        progressLogRepository.save(progress);
        
        taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Rolled back to previous state");
        return result;
    }
    
    private List<TaskActivityDTO.PhaseDurationDTO> calculatePhaseDurations(EdictTask task) {
        List<TaskActivityDTO.PhaseDurationDTO> phases = new ArrayList<>();
        
        // 根据流程日志计算各阶段耗时
        if (task.getFlowLog() != null && !task.getFlowLog().isEmpty()) {
            LocalDateTime prevTime = task.getCreatedAt();
            for (FlowLog log : task.getFlowLog()) {
                if (log.getCreatedAt() != null && prevTime != null) {
                    long seconds = Duration.between(prevTime, log.getCreatedAt()).getSeconds();
                    TaskActivityDTO.PhaseDurationDTO phase = new TaskActivityDTO.PhaseDurationDTO();
                    phase.setPhase(log.getRemark() != null ? log.getRemark() : "未知阶段");
                    phase.setDurationSec(seconds);
                    phase.setDurationText(formatDuration(seconds));
                    phase.setOngoing(false);
                    phases.add(phase);
                    prevTime = log.getCreatedAt();
                }
            }
        }
        
        return phases;
    }
    
    private String formatDuration(long seconds) {
        if (seconds < 60) return seconds + "秒";
        if (seconds < 3600) return (seconds / 60) + "分" + (seconds % 60) + "秒";
        return (seconds / 3600) + "时" + ((seconds % 3600) / 60) + "分";
    }
}

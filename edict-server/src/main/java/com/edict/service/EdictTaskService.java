package com.edict.service;

import com.edict.dto.*;
import com.edict.entity.*;
import com.edict.repository.EdictTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EdictTaskService {
    
    private final EdictTaskRepository taskRepository;
    private final WorkflowService workflowService;
    
    private static final DateTimeFormatter ISO_FORMATTER = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
    @Transactional(readOnly = true)
    public LiveStatusDTO getLiveStatus() {
        List<EdictTask> tasks = taskRepository.findByArchivedFalseOrderByUpdatedAtDesc();
        
        LiveStatusDTO dto = new LiveStatusDTO();
        dto.setTasks(tasks.stream().map(this::convertToTaskDTO).collect(Collectors.toList()));
        dto.setSyncStatus(new LiveStatusDTO.SyncStatusDTO());
        return dto;
    }
    
    @Transactional(readOnly = true)
    public TaskDTO getTask(String taskId) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        return convertToTaskDTO(task);
    }
    
    @Transactional
    public ActionResultDTO createTask(String title, String org, String priority, String creator) {
        EdictTask task = new EdictTask();
        task.setId(UUID.randomUUID().toString().substring(0, 8));
        task.setTraceId(UUID.randomUUID().toString());
        task.setTitle(title);
        task.setOrg(org);
        task.setPriority(priority != null ? priority : "中");
        task.setCreator(creator != null ? creator : "system");
        task.setState(EdictTask.TaskState.ToDo);
        task.setNow("等待开始");
        task.setHeartbeatStatus("idle");
        task.setHeartbeatLabel("等待开始");
        
        EdictTask saved = taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Task created: " + saved.getId());
        result.setTaskId(saved.getId());
        return result;
    }
    
    /**
     * 创建任务并启动 Workflow
     */
    @Transactional
    public ActionResultDTO createTaskAndStartWorkflow(String title, String org, String priority, String creator) {
        // 1. 创建任务
        ActionResultDTO result = createTask(title, org, priority, creator);
        
        if (result.isOk() && result.getTaskId() != null) {
            String taskId = result.getTaskId();
            
            try {
                // 2. 流转到 Doing
                transitionTask(taskId, "Doing", "太子", "皇上通过旨库下旨，自动启动 workflow");
                
                // 3. 添加启动记录
                addProgress(taskId, "太子", "🚀 旨意已下达，启动三省六部 workflow");
                
                // 4. 异步启动 workflow
                workflowService.startWorkflow(taskId);
                
                result.setMessage("Task created and workflow started: " + taskId);
                log.info("✅ Task {} created and workflow started", taskId);
            } catch (Exception e) {
                log.error("Failed to start workflow for task: " + taskId, e);
                result.setMessage("Task created: " + taskId + " (workflow start failed: " + e.getMessage() + ")");
            }
        }
        
        return result;
    }
    
    @Transactional
    public ActionResultDTO taskAction(String taskId, String action, String reason) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        String oldState = task.getState().name();
        
        switch (action) {
            case "stop":
                task.setPrevState(oldState);
                task.setState(EdictTask.TaskState.Blocked);
                task.setBlock(reason != null ? reason : "皇上叫停");
                task.setNow("⏸️ 已暂停：" + (reason != null ? reason : "皇上叫停"));
                task.setHeartbeatStatus("warn");
                task.setHeartbeatLabel("已暂停");
                break;
            case "cancel":
                task.setPrevState(oldState);
                task.setState(EdictTask.TaskState.Cancelled);
                task.setBlock(reason != null ? reason : "皇上取消");
                task.setNow("🚫 已取消：" + (reason != null ? reason : "皇上取消"));
                task.setHeartbeatStatus("unknown");
                task.setHeartbeatLabel("已取消");
                break;
            case "resume":
                String prevState = task.getPrevState();
                if (prevState != null) {
                    task.setState(EdictTask.TaskState.valueOf(prevState));
                } else {
                    task.setState(EdictTask.TaskState.Doing);
                }
                task.setBlock("无");
                task.setNow("▶️ 已恢复执行");
                task.setHeartbeatStatus("active");
                task.setHeartbeatLabel("执行中");
                break;
            default:
                throw new RuntimeException("Unknown action: " + action);
        }
        
        // Add flow log
        FlowLog flowLog = new FlowLog();
        flowLog.setTask(task);
        flowLog.setFromAgent("皇上");
        flowLog.setToAgent(task.getOrg());
        flowLog.setRemark((action.equals("stop") ? "⏸️ 叫停" : action.equals("cancel") ? "🚫 取消" : "▶️ 恢复") + "：" + (reason != null ? reason : "无"));
        task.getFlowLog().add(flowLog);
        
        taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage(taskId + " " + (action.equals("stop") ? "已叫停" : action.equals("cancel") ? "已取消" : "已恢复"));
        return result;
    }
    
    @Transactional
    public ActionResultDTO advanceState(String taskId, String comment) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        EdictTask.TaskState currentState = task.getState();
        EdictTask.TaskState newState;
        
        switch (currentState) {
            case ToDo:
                newState = EdictTask.TaskState.Doing;
                break;
            case Doing:
                newState = EdictTask.TaskState.Review;
                break;
            case Review:
                newState = EdictTask.TaskState.Done;
                break;
            default:
                throw new RuntimeException("Cannot advance from state: " + currentState);
        }
        
        task.setState(newState);
        task.setNow("状态推进至 " + newState.name() + "：" + (comment != null ? comment : ""));
        
        // Add flow log
        FlowLog flowLog = new FlowLog();
        flowLog.setTask(task);
        flowLog.setFromAgent(task.getOrg());
        flowLog.setToAgent("system");
        flowLog.setRemark("状态推进 " + currentState.name() + " → " + newState.name() + "：" + (comment != null ? comment : ""));
        task.getFlowLog().add(flowLog);
        
        taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("状态已推进至 " + newState.name());
        return result;
    }
    
    @Transactional
    public ActionResultDTO archiveTask(String taskId, Boolean archived) {
        if (archived == null) archived = true;
        
        if (taskId == null) {
            // Archive all done/cancelled tasks
            List<EdictTask> tasks = taskRepository.findDoneOrCancelledNotArchived();
            int count = 0;
            for (EdictTask task : tasks) {
                task.setArchived(true);
                task.setArchivedAt(LocalDateTime.now());
                count++;
            }
            taskRepository.saveAll(tasks);
            
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(true);
            result.setMessage("Archived " + count + " tasks");
            result.setCount(count);
            return result;
        }
        
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        task.setArchived(archived);
        if (archived) {
            task.setArchivedAt(LocalDateTime.now());
        } else {
            task.setArchivedAt(null);
        }
        
        taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage(taskId + " " + (archived ? "已归档" : "已取消归档"));
        return result;
    }
    
    @Transactional
    public ActionResultDTO transitionTask(String taskId, String newStateStr, String agent, String reason) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        EdictTask.TaskState newState = EdictTask.TaskState.valueOf(newStateStr);
        EdictTask.TaskState oldState = task.getState();
        
        task.setState(newState);
        task.setNow("状态变更 " + oldState.name() + " → " + newState.name() + "：" + (reason != null ? reason : ""));
        
        // Update heartbeat
        if (newState == EdictTask.TaskState.Done) {
            task.setHeartbeatStatus("active");
            task.setHeartbeatLabel("已完成");
        } else if (newState == EdictTask.TaskState.Blocked) {
            task.setHeartbeatStatus("stalled");
            task.setHeartbeatLabel("阻塞");
        }
        
        // Add flow log
        FlowLog flowLog = new FlowLog();
        flowLog.setTask(task);
        flowLog.setFromAgent(agent);
        flowLog.setToAgent(task.getOrg());
        flowLog.setRemark("状态流转 " + oldState.name() + " → " + newState.name() + "：" + (reason != null ? reason : ""));
        task.getFlowLog().add(flowLog);
        
        taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("状态已变更为 " + newState.name());
        return result;
    }
    
    @Transactional
    public ActionResultDTO addProgress(String taskId, String agent, String content) {
        EdictTask task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
        
        ProgressLog progress = new ProgressLog();
        progress.setTask(task);
        progress.setAgent(agent);
        progress.setContent(content);
        task.getProgressLog().add(progress);
        
        task.setSchedulerLastProgressAt(LocalDateTime.now());
        task.setNow(content);
        
        taskRepository.save(task);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Progress added");
        return result;
    }
    
    // ========== 看板 API 方法 ==========
    
    @Transactional(readOnly = true)
    public List<TaskDTO> getAllTasks() {
        return taskRepository.findByArchivedFalseOrderByUpdatedAtDesc()
            .stream()
            .map(this::convertToTaskDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByState(String stateStr) {
        try {
            EdictTask.TaskState state = EdictTask.TaskState.valueOf(stateStr);
            return taskRepository.findByStateAndArchivedFalseOrderByUpdatedAtDesc(state)
                .stream()
                .map(this::convertToTaskDTO)
                .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            // 支持自定义状态映射
            return taskRepository.findByArchivedFalseOrderByUpdatedAtDesc()
                .stream()
                .filter(t -> stateStr.equals(t.getNow()) || stateStr.equals(t.getOrg()))
                .map(this::convertToTaskDTO)
                .collect(Collectors.toList());
        }
    }
    
    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByOrg(String org) {
        return taskRepository.findByOrgAndArchivedFalseOrderByUpdatedAtDesc(org)
            .stream()
            .map(this::convertToTaskDTO)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public TaskDTO createTask(TaskCreateRequest request) {
        EdictTask task = new EdictTask();
        task.setId(request.getId() != null ? request.getId() : generateTaskId());
        task.setTraceId(UUID.randomUUID().toString());
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setOrg(request.getOrg());
        task.setState(convertState(request.getState()));
        task.setNow(request.getNow() != null ? request.getNow() : "等待开始");
        task.setPriority(request.getPriority() != null ? request.getPriority() : "中");
        task.setCreator("system");
        task.setHeartbeatStatus("idle");
        task.setHeartbeatLabel("等待开始");
        
        // 添加初始流转记录
        if (request.getOrg() != null) {
            FlowLog flowLog = new FlowLog();
            flowLog.setTask(task);
            flowLog.setFromAgent("皇上");
            flowLog.setToAgent(request.getOrg());
            flowLog.setRemark("创建任务：" + request.getTitle());
            task.getFlowLog().add(flowLog);
        }
        
        EdictTask saved = taskRepository.save(task);
        return convertToTaskDTO(saved);
    }
    
    @Transactional
    public TaskDTO updateTask(String taskId, TaskUpdateRequest request) {
        EdictTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return null;
        
        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getState() != null) task.setState(convertState(request.getState()));
        if (request.getOrg() != null) task.setOrg(request.getOrg());
        if (request.getNow() != null) task.setNow(request.getNow());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getEta() != null) task.setEta(request.getEta());
        if (request.getBlock() != null) task.setBlock(request.getBlock());
        if (request.getAc() != null) task.setAc(request.getAc());
        if (request.getOutput() != null) task.setOutput(request.getOutput());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        
        EdictTask saved = taskRepository.save(task);
        return convertToTaskDTO(saved);
    }
    
    @Transactional
    public TaskDTO updateTaskState(String taskId, String stateStr, String now) {
        EdictTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return null;
        
        EdictTask.TaskState oldState = task.getState();
        EdictTask.TaskState newState = convertState(stateStr);
        task.setState(newState);
        
        if (now != null) {
            task.setNow(now);
        } else {
            task.setNow("状态变更：" + oldState.name() + " → " + newState.name());
        }
        
        // 更新心跳状态
        updateHeartbeatByState(task, newState);
        
        EdictTask saved = taskRepository.save(task);
        return convertToTaskDTO(saved);
    }
    
    @Transactional
    public TaskDTO addFlowLog(String taskId, String from, String to, String remark) {
        EdictTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return null;
        
        FlowLog flowLog = new FlowLog();
        flowLog.setTask(task);
        flowLog.setFromAgent(from != null ? from : "系统");
        flowLog.setToAgent(to != null ? to : task.getOrg());
        flowLog.setRemark(remark != null ? remark : "状态流转");
        task.getFlowLog().add(flowLog);
        
        EdictTask saved = taskRepository.save(task);
        return convertToTaskDTO(saved);
    }
    
    @Transactional
    public TaskDTO addProgressLog(String taskId, String text, String todos) {
        EdictTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return null;
        
        ProgressLog progress = new ProgressLog();
        progress.setTask(task);
        progress.setAgent(task.getOrg());
        progress.setContent(text);
        task.getProgressLog().add(progress);
        
        task.setNow(text);
        task.setSchedulerLastProgressAt(LocalDateTime.now());
        
        // 解析 todos 格式 "计划1✅|计划2🔄|计划3"
        if (todos != null && !todos.isEmpty()) {
            String[] items = todos.split("\\|");
            for (int i = 0; i < items.length; i++) {
                String item = items[i].trim();
                if (item.isEmpty()) continue;
                
                TaskTodo.TodoStatus status;
                String title;
                if (item.endsWith("✅")) {
                    status = TaskTodo.TodoStatus.completed;
                    title = item.substring(0, item.length() - 1).trim();
                } else if (item.endsWith("🔄")) {
                    status = TaskTodo.TodoStatus.in_progress;
                    title = item.substring(0, item.length() - 1).trim();
                } else {
                    status = TaskTodo.TodoStatus.not_started;
                    title = item;
                }
                
                TaskTodo todo = new TaskTodo();
                todo.setTask(task);
                todo.setTitle(title);
                todo.setStatus(status);
                task.getTodos().add(todo);
            }
        }
        
        EdictTask saved = taskRepository.save(task);
        return convertToTaskDTO(saved);
    }
    
    @Transactional
    public TaskDTO completeTask(String taskId, String output, String summary) {
        EdictTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return null;
        
        task.setState(EdictTask.TaskState.Done);
        task.setOutput(output);
        task.setNow(summary != null ? summary : "任务已完成");
        task.setHeartbeatStatus("active");
        task.setHeartbeatLabel("已完成");
        
        // 添加完成流转记录
        FlowLog flowLog = new FlowLog();
        flowLog.setTask(task);
        flowLog.setFromAgent(task.getOrg());
        flowLog.setToAgent("皇上");
        flowLog.setRemark("✅ 完成：" + (summary != null ? summary : "任务已完成"));
        task.getFlowLog().add(flowLog);
        
        EdictTask saved = taskRepository.save(task);
        return convertToTaskDTO(saved);
    }
    
    /**
     * 存储执行结果 - 使用现有表结构
     * 将执行结果以JSON格式存入output字段
     */
    @Transactional
    public TaskDTO saveExecutionResult(String taskId, com.edict.controller.KanbanController.ExecutionResultRequest request) {
        EdictTask task = taskRepository.findById(taskId).orElse(null);
        if (task == null) return null;
        
        // 构建执行结果JSON
        StringBuilder outputBuilder = new StringBuilder();
        outputBuilder.append("## 执行结果\n\n");
        
        if (request.getAgentId() != null) {
            outputBuilder.append("**执行Agent：** ").append(request.getAgentId()).append("\n\n");
        }
        
        if (request.getSessionKey() != null) {
            outputBuilder.append("**会话Key：** ").append(request.getSessionKey()).append("\n\n");
        }
        
        if (request.getExecutionStatus() != null) {
            outputBuilder.append("**执行状态：** ").append(request.getExecutionStatus()).append("\n\n");
        }
        
        if (request.getExecutionTimeMs() != null) {
            outputBuilder.append("**执行耗时：** ").append(request.getExecutionTimeMs()).append(" ms\n\n");
        }
        
        if (request.getTokenUsage() != null) {
            outputBuilder.append("**Token使用：** ").append(request.getTokenUsage()).append("\n\n");
        }
        
        if (request.getOutputFiles() != null) {
            outputBuilder.append("**产出文件：** ").append(request.getOutputFiles()).append("\n\n");
        }
        
        if (request.getResultSummary() != null) {
            outputBuilder.append("**结果摘要：** ").append(request.getResultSummary()).append("\n\n");
        }
        
        if (request.getResultDetail() != null) {
            outputBuilder.append("**详细结果：**\n").append(request.getResultDetail()).append("\n\n");
        }
        
        if (request.getErrorMessage() != null) {
            outputBuilder.append("**错误信息：** ").append(request.getErrorMessage()).append("\n");
        }
        
        // 更新任务
        task.setOutput(outputBuilder.toString());
        if (request.getExecutionStatus() != null) {
            if ("success".equals(request.getExecutionStatus())) {
                task.setState(EdictTask.TaskState.Done);
                task.setNow(request.getResultSummary() != null ? request.getResultSummary() : "任务执行完成");
                task.setHeartbeatStatus("active");
                task.setHeartbeatLabel("已完成");
            } else if ("failed".equals(request.getExecutionStatus())) {
                task.setState(EdictTask.TaskState.Blocked);
                task.setNow("执行失败：" + (request.getErrorMessage() != null ? request.getErrorMessage() : "未知错误"));
                task.setHeartbeatStatus("stalled");
                task.setHeartbeatLabel("执行失败");
                task.setBlock(request.getErrorMessage());
            }
        }
        
        // 添加执行结果流转记录
        FlowLog flowLog = new FlowLog();
        flowLog.setTask(task);
        flowLog.setFromAgent(request.getAgentId() != null ? request.getAgentId() : task.getOrg());
        flowLog.setToAgent("皇上");
        flowLog.setRemark("📋 执行结果入库：" + (request.getExecutionStatus() != null ? request.getExecutionStatus() : "completed"));
        task.getFlowLog().add(flowLog);
        
        EdictTask saved = taskRepository.save(task);
        return convertToTaskDTO(saved);
    }
    
    // ========== 辅助方法 ==========
    
    private String generateTaskId() {
        LocalDateTime now = LocalDateTime.now();
        String date = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String seq = String.format("%03d", taskRepository.countByArchivedFalse() + 1);
        return "JJC-" + date + "-" + seq;
    }
    
    private EdictTask.TaskState convertState(String stateStr) {
        if (stateStr == null) return EdictTask.TaskState.ToDo;
        try {
            return EdictTask.TaskState.valueOf(stateStr);
        } catch (IllegalArgumentException e) {
            // 映射自定义状态到系统状态
            switch (stateStr) {
                case "Pending":
                case "ToDo":
                    return EdictTask.TaskState.ToDo;
                case "Zhongshu":
                case "Menxia":
                case "Assigned":
                    return EdictTask.TaskState.ToDo;
                case "Doing":
                    return EdictTask.TaskState.Doing;
                case "Review":
                    return EdictTask.TaskState.Review;
                case "Done":
                    return EdictTask.TaskState.Done;
                case "Blocked":
                    return EdictTask.TaskState.Blocked;
                case "Cancelled":
                    return EdictTask.TaskState.Cancelled;
                default:
                    return EdictTask.TaskState.ToDo;
            }
        }
    }
    
    private void updateHeartbeatByState(EdictTask task, EdictTask.TaskState state) {
        switch (state) {
            case ToDo:
                task.setHeartbeatStatus("idle");
                task.setHeartbeatLabel("等待开始");
                break;
            case Doing:
                task.setHeartbeatStatus("active");
                task.setHeartbeatLabel("执行中");
                break;
            case Review:
                task.setHeartbeatStatus("active");
                task.setHeartbeatLabel("审核中");
                break;
            case Done:
                task.setHeartbeatStatus("active");
                task.setHeartbeatLabel("已完成");
                break;
            case Blocked:
                task.setHeartbeatStatus("stalled");
                task.setHeartbeatLabel("阻塞");
                break;
            case Cancelled:
                task.setHeartbeatStatus("unknown");
                task.setHeartbeatLabel("已取消");
                break;
        }
    }
    
    private TaskDTO convertToTaskDTO(EdictTask task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setState(task.getState().name());
        dto.setOrg(task.getOrg());
        dto.setNow(task.getNow());
        dto.setEta(task.getEta());
        dto.setBlock(task.getBlock());
        dto.setAc(task.getAc());
        dto.setOutput(task.getOutput());
        dto.setReview_round(task.getReviewRound());
        dto.setArchived(task.getArchived());
        dto.setArchivedAt(task.getArchivedAt() != null ? task.getArchivedAt().format(ISO_FORMATTER) : null);
        dto.setUpdatedAt(task.getUpdatedAt() != null ? task.getUpdatedAt().format(ISO_FORMATTER) : null);
        
        // Heartbeat
        TaskDTO.HeartbeatDTO heartbeat = new TaskDTO.HeartbeatDTO();
        heartbeat.setStatus(task.getHeartbeatStatus());
        heartbeat.setLabel(task.getHeartbeatLabel());
        dto.setHeartbeat(heartbeat);
        
        // Flow log
        dto.setFlow_log(task.getFlowLog().stream().map(fl -> {
            TaskDTO.FlowEntryDTO fe = new TaskDTO.FlowEntryDTO();
            fe.setAt(fl.getCreatedAt() != null ? fl.getCreatedAt().format(ISO_FORMATTER) : null);
            fe.setFrom(fl.getFromAgent());
            fe.setTo(fl.getToAgent());
            fe.setRemark(fl.getRemark());
            return fe;
        }).collect(Collectors.toList()));
        
        // Todos
        dto.setTodos(task.getTodos().stream().map(t -> {
            TaskDTO.TodoItemDTO todo = new TaskDTO.TodoItemDTO();
            todo.setId(String.valueOf(t.getId()));
            todo.setTitle(t.getTitle());
            todo.setStatus(t.getStatus().name());
            todo.setDetail(t.getDetail());
            return todo;
        }).collect(Collectors.toList()));
        
        return dto;
    }
}

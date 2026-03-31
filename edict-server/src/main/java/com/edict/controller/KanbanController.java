package com.edict.controller;

import com.edict.dto.ApiResponse;
import com.edict.dto.TaskDTO;
import com.edict.dto.TaskCreateRequest;
import com.edict.dto.TaskUpdateRequest;
import com.edict.entity.FlowLog;
import com.edict.entity.ProgressLog;
import com.edict.repository.FlowLogRepository;
import com.edict.repository.ProgressLogRepository;
import com.edict.service.EdictTaskService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 任务看板控制器 - 供 Agent 调用
 */
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/kanban")
public class KanbanController {
    
    private final EdictTaskService taskService;
    
    @Autowired
    private FlowLogRepository flowLogRepository;
    
    @Autowired
    private ProgressLogRepository progressLogRepository;
    
    /**
     * 获取所有任务
     */
    @GetMapping("/tasks")
    public ApiResponse<List<TaskDTO>> getAllTasks() {
        return ApiResponse.success(taskService.getAllTasks());
    }
    
    /**
     * 根据状态获取任务
     */
    @GetMapping("/tasks/state/{state}")
    public ApiResponse<List<TaskDTO>> getTasksByState(@PathVariable String state) {
        return ApiResponse.success(taskService.getTasksByState(state));
    }
    
    /**
     * 根据部门获取任务
     */
    @GetMapping("/tasks/org/{org}")
    public ApiResponse<List<TaskDTO>> getTasksByOrg(@PathVariable String org) {
        return ApiResponse.success(taskService.getTasksByOrg(org));
    }
    
    /**
     * 获取单个任务
     */
    @GetMapping("/tasks/{taskId}")
    public ApiResponse<TaskDTO> getTask(@PathVariable String taskId) {
        TaskDTO task = taskService.getTask(taskId);
        return task != null ? ApiResponse.success(task) : ApiResponse.error("任务不存在");
    }
    
    /**
     * 创建任务
     */
    @PostMapping("/tasks")
    public ApiResponse<TaskDTO> createTask(@RequestBody TaskCreateRequest request) {
        return ApiResponse.success(taskService.createTask(request));
    }
    
    /**
     * 更新任务
     */
    @PutMapping("/tasks/{taskId}")
    public ApiResponse<TaskDTO> updateTask(@PathVariable String taskId, 
                                           @RequestBody TaskUpdateRequest request) {
        TaskDTO task = taskService.updateTask(taskId, request);
        return task != null ? ApiResponse.success(task) : ApiResponse.error("任务不存在");
    }
    
    /**
     * 更新任务状态
     */
    @PatchMapping("/tasks/{taskId}/state")
    public ApiResponse<TaskDTO> updateTaskState(@PathVariable String taskId,
                                                @RequestBody Map<String, String> body) {
        String state = body.get("state");
        String now = body.get("now");
        TaskDTO task = taskService.updateTaskState(taskId, state, now);
        return task != null ? ApiResponse.success(task) : ApiResponse.error("任务不存在");
    }
    
    /**
     * 添加流转记录
     */
    @PostMapping("/tasks/{taskId}/flow")
    public ApiResponse<TaskDTO> addFlowLog(@PathVariable String taskId,
                                           @RequestBody FlowLogRequest request) {
        TaskDTO task = taskService.addFlowLog(taskId, request.getFrom(), 
                                              request.getTo(), request.getRemark());
        return task != null ? ApiResponse.success(task) : ApiResponse.error("任务不存在");
    }
    
    /**
     * 添加进度记录
     */
    @PostMapping("/tasks/{taskId}/progress")
    public ApiResponse<TaskDTO> addProgress(@PathVariable String taskId,
                                            @RequestBody ProgressRequest request) {
        TaskDTO task = taskService.addProgressLog(taskId, request.getText(), 
                                                   request.getTodos());
        return task != null ? ApiResponse.success(task) : ApiResponse.error("任务不存在");
    }
    
    /**
     * 完成任务 - 存储执行结果
     */
    @PostMapping("/tasks/{taskId}/done")
    public ApiResponse<TaskDTO> completeTask(@PathVariable String taskId,
                                             @RequestBody Map<String, String> body) {
        String output = body.get("output");
        String summary = body.get("summary");
        TaskDTO task = taskService.completeTask(taskId, output, summary);
        return task != null ? ApiResponse.success(task) : ApiResponse.error("任务不存在");
    }
    
    /**
     * 存储执行结果 - 扩展版，支持更多字段
     * Agent执行完任务后调用此接口存储完整结果
     */
    @PostMapping("/tasks/{taskId}/result")
    public ApiResponse<TaskDTO> saveExecutionResult(@PathVariable String taskId,
                                                    @RequestBody ExecutionResultRequest request) {
        TaskDTO task = taskService.saveExecutionResult(taskId, request);
        return task != null ? ApiResponse.success(task) : ApiResponse.error("任务不存在");
    }
    
    // 执行结果请求类
    @Data
    public static class ExecutionResultRequest {
        private String agentId;
        private String sessionKey;
        private String executionStatus;
        private String resultSummary;
        private String resultDetail;
        private String outputFiles;
        private Long executionTimeMs;
        private Integer tokenUsage;
        private String errorMessage;
    }
    
    // 内部请求类
    @Data
    public static class FlowLogRequest {
        private String from;
        private String to;
        private String remark;
    }
    
    @Data
    public static class ProgressRequest {
        private String text;
        private String todos; // 格式: "计划1✅|计划2🔄|计划3"
    }
    
    /**
     * Live Activity - 获取实时任务活动
     */
    @GetMapping("/activities")
    public ApiResponse<List<ActivityDTO>> getRecentActivities(@RequestParam(defaultValue = "20") int limit) {
        List<ActivityDTO> activities = new ArrayList<>();
        
        // 获取最近的流转记录
        List<FlowLog> recentFlows = flowLogRepository.findTop20ByOrderByCreatedAtDesc();
        for (FlowLog flow : recentFlows) {
            ActivityDTO activity = new ActivityDTO();
            activity.setTime(flow.getCreatedAt());
            activity.setAgent(flow.getToAgent() != null ? flow.getToAgent() : "SYSTEM");
            activity.setType("flow");
            String taskTitle = flow.getTask() != null ? flow.getTask().getTitle() : "";
            activity.setText(taskTitle + " - " + (flow.getRemark() != null ? flow.getRemark() : "状态流转"));
            activity.setTaskId(flow.getTask() != null ? flow.getTask().getId() : null);
            activities.add(activity);
        }
        
        // 获取最近的进度记录
        List<ProgressLog> recentProgress = progressLogRepository.findTop20ByOrderByCreatedAtDesc();
        for (ProgressLog prog : recentProgress) {
            ActivityDTO activity = new ActivityDTO();
            activity.setTime(prog.getCreatedAt());
            activity.setAgent(prog.getAgent() != null ? prog.getAgent() : "SYSTEM");
            activity.setType("progress");
            activity.setText(prog.getContent() != null ? prog.getContent() : "进度更新");
            activity.setTaskId(prog.getTask() != null ? prog.getTask().getId() : null);
            activities.add(activity);
        }
        
        // 合并并按时间排序
        activities.sort((a, b) -> b.getTime().compareTo(a.getTime()));
        
        // 限制返回数量
        List<ActivityDTO> result = activities.stream().limit(limit).collect(Collectors.toList());
        
        return ApiResponse.success(result);
    }
    
    // Activity DTO
    @Data
    public static class ActivityDTO {
        private LocalDateTime time;
        private String agent;
        private String type;
        private String text;
        private String taskId;
    }
}

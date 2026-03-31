package com.edict.controller;

import com.edict.dto.*;
import com.edict.service.SchedulerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SchedulerController {
    
    private final SchedulerService schedulerService;
    
    // 调度器状态
    @GetMapping("/scheduler-state/{taskId}")
    public SchedulerStateDTO getSchedulerState(@PathVariable String taskId) {
        return schedulerService.getSchedulerState(taskId);
    }
    
    // 任务活动日志
    @GetMapping("/task-activity/{taskId}")
    public TaskActivityDTO getTaskActivity(@PathVariable String taskId) {
        return schedulerService.getTaskActivity(taskId);
    }
    
    // 派发任务
    @PostMapping("/tasks/{taskId}/dispatch")
    public ActionResultDTO dispatchTask(
            @PathVariable String taskId,
            @RequestParam String agent,
            @RequestParam(defaultValue = "") String message) {
        return schedulerService.dispatchTask(taskId, agent, message);
    }
    
    // 调度器重试
    @PostMapping("/scheduler-retry")
    public ActionResultDTO schedulerRetry(@RequestBody Map<String, String> body) {
        String taskId = body.get("taskId");
        String reason = body.get("reason");
        return schedulerService.schedulerRetry(taskId, reason);
    }
    
    // 调度器升级
    @PostMapping("/scheduler-escalate")
    public ActionResultDTO schedulerEscalate(@RequestBody Map<String, String> body) {
        String taskId = body.get("taskId");
        String reason = body.get("reason");
        return schedulerService.schedulerEscalate(taskId, reason);
    }
    
    // 调度器回退
    @PostMapping("/scheduler-rollback")
    public ActionResultDTO schedulerRollback(@RequestBody Map<String, String> body) {
        String taskId = body.get("taskId");
        String reason = body.get("reason");
        return schedulerService.schedulerRollback(taskId, reason);
    }
}

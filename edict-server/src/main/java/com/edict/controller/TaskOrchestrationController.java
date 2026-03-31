package com.edict.controller;

import com.edict.dto.*;
import com.edict.service.TaskOrchestrationService;
import com.edict.service.EdictTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class TaskOrchestrationController {

    private final TaskOrchestrationService orchestrationService;
    private final EdictTaskService taskService;

    /**
     * 任务拆解API - 自动分析任务并拆分子任务
     * POST /api/task/decompose
     */
    @PostMapping("/task/decompose")
    public TaskDecomposeResponse decompose(@RequestBody TaskDecomposeRequest request) {
        return orchestrationService.decompose(request);
    }

    /**
     * 任务执行API - 派发给指定Agent执行
     * POST /api/task/dispatch
     */
    @PostMapping("/task/dispatch")
    public TaskDispatchResponse dispatch(@RequestBody TaskDispatchRequest request) {
        TaskDispatchResponse response = new TaskDispatchResponse();

        try {
            String agentMessage = request.getMessage();
            String agentId = "zhongshu"; // 默认

            String result = orchestrationService.dispatchToAgent(agentId, agentMessage, 300);

            response.setOk(true);
            response.setAgentId(agentId);
            response.setAgentResponse(result);
            response.setSubtaskId(request.getSubtaskId());

        } catch (Exception e) {
            response.setOk(false);
            response.setError(e.getMessage());
        }

        return response;
    }
    
    /**
     * 一键执行任务 - 创建任务并自动启动 workflow
     * POST /api/task/execute
     * 太子创建任务后，自动流转到 Doing 状态，触发中书省处理
     */
    @PostMapping("/task/execute")
    public Map<String, Object> executeTask(@RequestBody TaskDecomposeRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String taskTitle = request.getTask();
            String creator = request.getCreator() != null ? request.getCreator() : "太子";
            String imageData = request.getImageData();
            
            // 如果有图片，在任务标题中标记
            if (imageData != null && !imageData.isEmpty()) {
                taskTitle = "[含图片] " + taskTitle;
                log.info("任务包含图片数据，长度: {}", imageData.length());
            }
            
            // 创建任务并自动流转到 Doing 状态
            ActionResultDTO createResult = taskService.createTaskAndStartWorkflow(
                taskTitle, 
                "中书省", 
                "中", 
                creator
            );
            
            response.put("ok", true);
            response.put("taskId", createResult.getTaskId());
            response.put("message", createResult.getMessage());
            response.put("status", "Doing");
            if (imageData != null) {
                response.put("hasImage", true);
            }
            
        } catch (Exception e) {
            log.error("创建任务失败: {}", e.getMessage());
            response.put("ok", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }
}

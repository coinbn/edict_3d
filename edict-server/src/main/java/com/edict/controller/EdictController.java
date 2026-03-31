package com.edict.controller;

import com.edict.dto.*;
import com.edict.service.EdictTaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class EdictController {
    
    private final EdictTaskService taskService;
    
    // Live Status
    @GetMapping("/live-status")
    public LiveStatusDTO getLiveStatus() {
        return taskService.getLiveStatus();
    }
    
    // Task Actions
    @PostMapping("/task-action")
    public ActionResultDTO taskAction(@RequestBody Map<String, Object> body) {
        String taskId = (String) body.get("taskId");
        String action = (String) body.get("action");
        String reason = (String) body.get("reason");
        return taskService.taskAction(taskId, action, reason);
    }
    
    @PostMapping("/advance-state")
    public ActionResultDTO advanceState(@RequestBody Map<String, Object> body) {
        String taskId = (String) body.get("taskId");
        String comment = (String) body.get("comment");
        return taskService.advanceState(taskId, comment);
    }
    
    @PostMapping("/archive-task")
    public ActionResultDTO archiveTask(@RequestBody Map<String, Object> body) {
        String taskId = (String) body.get("taskId");
        Boolean archived = (Boolean) body.get("archived");
        Boolean archiveAllDone = (Boolean) body.get("archiveAllDone");
        
        if (Boolean.TRUE.equals(archiveAllDone)) {
            return taskService.archiveTask(null, true);
        }
        return taskService.archiveTask(taskId, archived);
    }
    
    @PostMapping("/create-task")
    public ActionResultDTO createTask(@RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String org = (String) body.get("org");
        String priority = (String) body.get("priority");
        String creator = (String) body.get("creator");
        
        // 创建任务并自动启动 workflow
        return taskService.createTaskAndStartWorkflow(title, org, priority, creator);
    }
    
    // 获取任务列表
    @GetMapping("/tasks")
    public LiveStatusDTO getTasks(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String org,
            @RequestParam(defaultValue = "50") Integer limit,
            @RequestParam(defaultValue = "0") Integer offset) {
        // 简化版：返回所有活跃任务
        return taskService.getLiveStatus();
    }
    
    @GetMapping("/tasks/{id}")
    public TaskDTO getTask(@PathVariable String id) {
        return taskService.getTask(id);
    }
    
    // 状态流转
    @PostMapping("/tasks/{id}/transition")
    public ActionResultDTO transitionTask(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String newState = (String) body.get("new_state");
        String agent = (String) body.getOrDefault("agent", "system");
        String reason = (String) body.get("reason");
        return taskService.transitionTask(id, newState, agent, reason);
    }
    
    @PostMapping("/tasks/{id}/progress")
    public ActionResultDTO addProgress(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String agent = body.get("agent");
        String content = body.get("content");
        return taskService.addProgress(id, agent, content);
    }
    
    // ============ 技能管理接口 ============
    
    // 远程技能存储
    private final java.util.Map<String, java.util.Map<String, String>> remoteSkills = new java.util.HashMap<>();
    private final java.util.List<ModelChangeLogEntry> modelChangeLogs = new java.util.ArrayList<>();
    
    /**
     * 获取所有远程技能
     */
    @GetMapping("/remote-skills-list")
    public java.util.Map<String, Object> listRemoteSkills() {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        for (String agentId : remoteSkills.keySet()) {
            result.put(agentId, remoteSkills.get(agentId).keySet().toArray());
        }
        return result;
    }
    
    /**
     * 添加远程技能
     */
    @PostMapping("/add-remote-skill")
    public ActionResultDTO addRemoteSkill(@RequestBody java.util.Map<String, Object> request) {
        String agentId = (String) request.get("agentId");
        String skillName = (String) request.get("skillName");
        String description = (String) request.get("description");
        
        if (agentId == null || skillName == null) {
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError("agentId and skillName are required");
            return result;
        }
        
        remoteSkills.computeIfAbsent(agentId, k -> new java.util.HashMap<>());
        remoteSkills.get(agentId).put(skillName, description != null ? description : "");
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Skill added successfully");
        return result;
    }
    
    /**
     * 更新远程技能
     */
    @PostMapping("/update-remote-skill")
    public ActionResultDTO updateRemoteSkill(@RequestBody java.util.Map<String, Object> request) {
        String agentId = (String) request.get("agentId");
        String skillName = (String) request.get("skillName");
        String description = (String) request.get("description");
        
        if (agentId == null || skillName == null) {
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError("agentId and skillName are required");
            return result;
        }
        
        java.util.Map<String, String> agentSkills = remoteSkills.get(agentId);
        if (agentSkills == null || !agentSkills.containsKey(skillName)) {
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError("Skill not found");
            return result;
        }
        
        if (description != null) {
            agentSkills.put(skillName, description);
        }
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Skill updated successfully");
        return result;
    }
    
    /**
     * 移除远程技能
     */
    @PostMapping("/remove-remote-skill")
    public ActionResultDTO removeRemoteSkill(@RequestBody java.util.Map<String, Object> request) {
        String agentId = (String) request.get("agentId");
        String skillName = (String) request.get("skillName");
        
        if (agentId == null || skillName == null) {
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError("agentId and skillName are required");
            return result;
        }
        
        if (remoteSkills.get(agentId) != null) {
            remoteSkills.get(agentId).remove(skillName);
        }
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Skill removed successfully");
        return result;
    }
    
    /**
     * 获取技能内容
     */
    @GetMapping("/skill-content/{agentId}/{skillName}")
    public SkillContentResult getSkillContent(@PathVariable String agentId, @PathVariable String skillName) {
        SkillContentResult result = new SkillContentResult();
        result.setAgentId(agentId);
        result.setSkillName(skillName);
        
        java.util.Map<String, String> agentSkills = remoteSkills.get(agentId);
        if (agentSkills != null) {
            String description = agentSkills.get(skillName);
            if (description != null) {
                result.setContent("# " + skillName + "\n\n" + description);
                result.setOk(true);
            } else {
                result.setContent("# " + skillName + "\n\nSkill content not found");
                result.setOk(false);
            }
        } else {
            result.setContent("# " + skillName + "\n\nAgent not found");
            result.setOk(false);
        }
        
        return result;
    }
    
    /**
     * 获取模型变更日志
     */
    @GetMapping("/model-change-log")
    public java.util.List<ModelChangeLogEntry> getModelChangeLog() {
        return modelChangeLogs;
    }
    
    /**
     * 审核操作
     */
    @PostMapping("/review-action")
    public ActionResultDTO reviewAction(@RequestBody java.util.Map<String, Object> request) {
        String taskId = (String) request.get("taskId");
        String action = (String) request.get("action");
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Review action processed: " + action);
        return result;
    }
    
    /**
     * 调度器扫描
     */
    @PostMapping("/scheduler-scan")
    public java.util.Map<String, Object> schedulerScan(@RequestBody java.util.Map<String, Object> request) {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("ok", true);
        result.put("message", "Scan completed");
        result.put("count", 0);
        return result;
    }
    
    // ============ 模型热切换 ============
    
    /**
     * 切换 Agent 模型
     */
    @PostMapping("/apply-model-change")
    public ActionResultDTO applyModelChange(@RequestBody java.util.Map<String, Object> request) {
        String agentId = (String) request.get("agentId");
        String newModel = (String) request.get("model");
        
        if (agentId == null || newModel == null) {
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError("agentId and model are required");
            return result;
        }
        
        // 记录变更日志
        ModelChangeLogEntry log = new ModelChangeLogEntry();
        log.setId(java.util.UUID.randomUUID().toString());
        log.setAgentId(agentId);
        log.setOldModel("current"); // 简化处理
        log.setNewModel(newModel);
        log.setOperator("system");
        log.setChangedAt(new java.util.Date());
        modelChangeLogs.add(0, log);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Model changed to " + newModel + " for " + agentId);
        return result;
    }
    
    /**
     * 获取官员统计数据（看板用）
     */
    @GetMapping("/dashboard-stats")
    public java.util.Map<String, Object> getDashboardStats() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        
        // 返回模拟的统计数据
        stats.put("totalTokensIn", 1250000);
        stats.put("totalTokensOut", 890000);
        stats.put("totalCostCny", 15800.5);
        stats.put("totalCostUsd", 2200.0);
        stats.put("activeAgents", 10);
        stats.put("totalSessions", 156);
        stats.put("totalMessages", 2340);
        stats.put("tasksDone", 89);
        stats.put("ok", true);
        
        return stats;
    }
    
    // ============ OpenClaw 运行时同步 ============
    
    /**
     * 同步 OpenClaw 运行时状态
     */
    @PostMapping("/sync-from-openclaw")
    public java.util.Map<String, Object> syncFromOpenclaw() {
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        
        // 尝试连接 OpenClaw Gateway
        try {
            // 模拟从 OpenClaw 获取状态
            result.put("ok", true);
            result.put("message", "Synced from OpenClaw");
            result.put("agentsConnected", 11);
            result.put("sessionsActive", 3);
            result.put("lastSync", new java.util.Date().toString());
        } catch (Exception e) {
            result.put("ok", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * 获取 OpenClaw Agent 状态
     */
    @GetMapping("/openclaw-agents-status")
    public java.util.Map<String, Object> getOpenclawAgentsStatus() {
        java.util.Map<String, Object> status = new java.util.HashMap<>();
        
        // 返回模拟的 Agent 状态
        java.util.List<java.util.Map<String, Object>> agents = new java.util.ArrayList<>();
        
        String[] agentIds = {"taizi", "zhongshu", "menxia", "shangshu", "bingbu", "gongbu", "hubu", "libu", "xingbu", "libu_hr", "zaochao"};
        String[] labels = {"太子", "中书省", "门下省", "尚书省", "兵部", "工部", "户部", "吏部", "刑部", "吏部HR", "早朝"};
        String[] statuses = {"idle", "busy", "idle", "idle", "idle", "busy", "idle", "idle", "idle", "idle", "idle"};
        
        for (int i = 0; i < agentIds.length; i++) {
            java.util.Map<String, Object> agent = new java.util.HashMap<>();
            agent.put("id", agentIds[i]);
            agent.put("label", labels[i]);
            agent.put("status", statuses[i]);
            agent.put("lastActive", java.time.LocalDateTime.now().minusMinutes(i * 5).toString());
            agents.add(agent);
        }
        
        status.put("agents", agents);
        status.put("total", agents.size());
        status.put("ok", true);
        
        return status;
    }
}

package com.edict.service;

import com.edict.config.OpenClawProperties;
import com.edict.entity.EdictTask;
import com.edict.repository.EdictTaskRepository;
import com.edict.util.OpenClawCli;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Workflow 服务 - 使用 OpenClaw CLI 执行 Agent
 */
@Service
@Slf4j
public class WorkflowService {
    
    private final EdictTaskRepository taskRepository;
    private final EdictTaskService taskService;
    private final OpenClawProperties openClawProperties;
    
    public WorkflowService(EdictTaskRepository taskRepository, 
                          @Lazy EdictTaskService taskService,
                          OpenClawProperties openClawProperties) {
        this.taskRepository = taskRepository;
        this.taskService = taskService;
        this.openClawProperties = openClawProperties;
    }
    
    /**
     * 启动 Workflow - 异步执行三省六部流程
     * 使用 OpenClaw CLI 调用 Agent
     */
    @Async("workflowExecutor")
    public void startWorkflow(String taskId) {
        log.info("🚀 启动 Workflow for task: {}", taskId);
        
        try {
            // 获取任务详情
            EdictTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));
            
            String taskContent = task.getTitle();
            if (task.getDescription() != null) {
                taskContent = taskContent + "\n" + task.getDescription();
            }
            
            // ========== 阶段 1: 太子分拣 ==========
            log.info("Task {}: 太子分拣", taskId);
            taskService.addProgress(taskId, "太子", "📋 太子分拣完成，转交中书省");
            taskService.transitionTask(taskId, "Doing", "太子", "转交中书省起草");
            
            // ========== 阶段 2: 中书省起草 ==========
            log.info("Task {}: 中书省起草", taskId);
            taskService.addProgress(taskId, "中书省", "📝 中书省正在起草方案...");
            
            if (openClawProperties.isEnabled()) {
                String zhongshuTask = buildAgentTask("中书省", taskId, taskContent, 
                    "请根据皇上旨意，起草详细执行方案。完成后请返回方案要点。");
                
                OpenClawCli.CliResult zhongshuResult = OpenClawCli.execute(
                    "zhongshu", zhongshuTask, openClawProperties.getSubagentTimeout());
                
                if (!zhongshuResult.isSuccess()) {
                    throw new RuntimeException("中书省起草失败: " + zhongshuResult.getError());
                }
                
                // 保存中书省输出
                saveAgentOutput(taskId, "中书省", zhongshuResult.getOutput());
            }
            
            // ========== 阶段 3: 门下省审议 ==========
            log.info("Task {}: 门下省审议", taskId);
            taskService.transitionTask(taskId, "Review", "中书省", "提交门下省审议");
            taskService.addProgress(taskId, "门下省", "🔍 门下省正在审议...");
            
            if (openClawProperties.isEnabled()) {
                String menxiaTask = buildAgentTask("门下省", taskId, taskContent,
                    "请审议中书省起草的方案，决定是否准奏。返回审议意见。");
                
                OpenClawCli.CliResult menxiaResult = OpenClawCli.execute(
                    "menxia", menxiaTask, openClawProperties.getSubagentTimeout());
                
                if (!menxiaResult.isSuccess()) {
                    throw new RuntimeException("门下省审议失败: " + menxiaResult.getError());
                }
                
                saveAgentOutput(taskId, "门下省", menxiaResult.getOutput());
            }
            
            // ========== 阶段 4: 尚书省派发 ==========
            log.info("Task {}: 尚书省派发", taskId);
            taskService.addProgress(taskId, "尚书省", "📮 尚书省正在派发任务...");
            
            if (openClawProperties.isEnabled()) {
                String shangshuTask = buildAgentTask("尚书省", taskId, taskContent,
                    "请将任务派发给合适的六部执行。返回派发结果。");
                
                OpenClawCli.CliResult shangshuResult = OpenClawCli.execute(
                    "shangshu", shangshuTask, openClawProperties.getSubagentTimeout());
                
                if (!shangshuResult.isSuccess()) {
                    log.warn("尚书省派发返回警告: {}", shangshuResult.getError());
                }
                
                saveAgentOutput(taskId, "尚书省", shangshuResult.getOutput());
            }
            
            // ========== 阶段 5: 六部执行 ==========
            log.info("Task {}: 六部执行", taskId);
            taskService.addProgress(taskId, "尚书省", "⚙️ 六部正在执行任务...");
            
            // 根据任务内容选择部门
            String deptAgent = selectDepartmentAgent(taskContent);
            log.info("Task {}: 派发给 {} 执行", taskId, deptAgent);
            
            if (openClawProperties.isEnabled()) {
                String deptTask = buildAgentTask(deptAgent, taskId, taskContent,
                    "请执行具体任务，完成后返回执行结果。");
                
                long startTime = System.currentTimeMillis();
                OpenClawCli.CliResult deptResult = OpenClawCli.execute(
                    deptAgent, deptTask, openClawProperties.getSubagentTimeout());
                long executionTime = System.currentTimeMillis() - startTime;
                
                // 存储执行结果
                if (deptResult.isSuccess()) {
                    saveFinalResult(taskId, deptAgent, deptResult.getOutput(), executionTime);
                } else {
                    saveFinalResult(taskId, deptAgent, "执行失败: " + deptResult.getError(), executionTime);
                    throw new RuntimeException(deptAgent + "执行失败: " + deptResult.getError());
                }
            } else {
                // 模拟模式
                simulateCompletion(taskId, deptAgent);
            }
            
            log.info("✅ Workflow completed for task: {}", taskId);
            
        } catch (Exception e) {
            log.error("❌ Workflow failed for task: " + taskId, e);
            try {
                taskService.transitionTask(taskId, "Blocked", "系统", 
                    "Workflow 执行失败: " + e.getMessage());
            } catch (Exception ex) {
                log.error("Failed to mark task as failed", ex);
            }
        }
    }
    
    /**
     * 构建 Agent 任务内容
     */
    private String buildAgentTask(String agentName, String taskId, String originalTask, String instruction) {
        return String.format(
            "📋 %s·任务执行\n" +
            "任务ID: %s\n" +
            "皇上原话: %s\n" +
            "\n执行要求:\n%s",
            agentName, taskId, originalTask, instruction
        );
    }
    
    /**
     * 选择执行的部门 Agent
     */
    private String selectDepartmentAgent(String taskContent) {
        String content = taskContent.toLowerCase();
        
        // 兵部：代码、技术、开发
        if (content.contains("代码") || content.contains("开发") || content.contains("技术") ||
            content.contains("api") || content.contains("接口")) {
            return "bingbu";
        }
        
        // 户部：数据、分析、报告
        if (content.contains("数据") || content.contains("分析") || content.contains("报表") ||
            content.contains("统计")) {
            return "hubu";
        }
        
        // 礼部：文档、文章、内容
        if (content.contains("文档") || content.contains("文章") || content.contains("内容") ||
            content.contains("博客")) {
            return "libu";
        }
        
        // 工部：部署、运维、配置
        if (content.contains("部署") || content.contains("运维") || content.contains("docker") ||
            content.contains("k8s")) {
            return "gongbu";
        }
        
        // 刑部：安全、审查、审计
        if (content.contains("安全") || content.contains("审查") || content.contains("漏洞")) {
            return "xingbu";
        }
        
        // 默认礼部
        return "libu";
    }
    
    /**
     * 保存 Agent 中间输出
     */
    private void saveAgentOutput(String taskId, String agentName, String output) {
        if (output == null) return;
        
        // 截断过长的输出
        String summary = output.length() > 200 
            ? output.substring(0, 200) + "..." 
            : output;
        
        taskService.addProgress(taskId, agentName, summary.replace("\n", " "));
        log.debug("Task {}: {} output saved ({} chars)", taskId, agentName, output.length());
    }
    
    /**
     * 保存最终结果
     */
    private void saveFinalResult(String taskId, String agentName, String output, long executionTimeMs) {
        StringBuilder result = new StringBuilder();
        result.append("## 执行结果\n\n");
        result.append("**执行Agent：** ").append(agentName).append("\n\n");
        result.append("**执行状态：** ").append(output.contains("失败") ? "failed" : "success").append("\n\n");
        result.append("**执行耗时：** ").append(executionTimeMs / 1000).append(" 秒\n\n");
        result.append("**结果摘要：** ").append(output.substring(0, Math.min(100, output.length()))).append("\n\n");
        result.append("**详细结果：**\n").append(output);
        
        taskService.completeTask(taskId, result.toString(), "✅ " + agentName + "执行完成");
        log.info("Task {}: Final result saved", taskId);
    }
    
    /**
     * 模拟完成（当 OpenClaw 禁用时）
     */
    private void simulateCompletion(String taskId, String deptAgent) {
        StringBuilder output = new StringBuilder();
        output.append("## 执行结果\n\n");
        output.append("**执行Agent：** ").append(deptAgent).append("\n\n");
        output.append("**执行状态：** success\n\n");
        output.append("**结果摘要：** Workflow 模拟执行完成\n\n");
        output.append("**详细结果：**\n");
        output.append("1. 太子分拣完成\n");
        output.append("2. 中书省起草方案\n");
        output.append("3. 门下省审议通过\n");
        output.append("4. 尚书省派发任务\n");
        output.append("5. ").append(deptAgent).append("执行完成\n");
        
        taskService.completeTask(taskId, output.toString(), "✅ Workflow 执行完成");
    }
}

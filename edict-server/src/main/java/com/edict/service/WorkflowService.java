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
 * Workflow 服务 - 太子协调模式
 *
 * 不同于之前的同步调用链，现在只调用 taizi agent，
 * 由 taizi 自己通过 OpenClaw CLI 调用其他 agent，完成三省六部流程。
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
     * 启动 Workflow - 太子协调模式
     *
     * 只调用 taizi agent，由 taizi 自己协调中书省、门下省、尚书省、六部完成执行。
     * taizi 会通过 OpenClaw CLI 调用其他 agent，并通过 kanban_update.py 更新任务进度。
     */
    @Async("workflowExecutor")
    public void startWorkflow(String taskId) {
        log.info("🚀 启动 Workflow (太子协调模式) for task: {}", taskId);

        try {
            // 获取任务详情
            EdictTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found: " + taskId));

            String taskContent = task.getTitle();
            if (task.getDescription() != null) {
                taskContent = taskContent + "\n" + task.getDescription();
            }

            // ========== 太子分拣 ==========
            log.info("Task {}: 太子分拣", taskId);
            taskService.addProgress(taskId, "太子", "📋 太子分拣完成，开始协调三省六部");
            taskService.transitionTask(taskId, "Doing", "太子", "太子开始协调");

            if (openClawProperties.isEnabled()) {
                // ========== 调用太子 Agent ==========
                // 给 taizi 足够详细的指令，让它自己协调后续流程
                String taiziTask = buildTaiziTask(taskId, taskContent);

                log.info("Task {}: 调用太子协调", taskId);
                taskService.addProgress(taskId, "太子", "📜 太子正在协调中书省、门下省、尚书省...");

                OpenClawCli.CliResult taiziResult = OpenClawCli.execute(
                    "taizi", taiziTask, openClawProperties.getSubagentTimeout());

                if (!taiziResult.isSuccess()) {
                    throw new RuntimeException("太子协调失败: " + taiziResult.getError());
                }

                // 保存太子协调结果
                saveAgentOutput(taskId, "太子", taiziResult.getOutput());
                log.info("Task {}: 太子协调完成", taskId);
            } else {
                // 模拟模式
                simulateTaiziCoordination(taskId);
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
     * 构建太子协调任务
     *
     * 给 taizi agent 任务ID和旨意内容，
     * 让 taizi 按自己的 SOUL 流程执行。
     */
    private String buildTaiziTask(String taskId, String taskContent) {
        return "[后端任务] taskId=" + taskId + " 旨意=" + taskContent + " 请按SOUL流程执行并更新进度";
    }

    /**
     * 保存 Agent 输出
     */
    private void saveAgentOutput(String taskId, String agentName, String output) {
        if (output == null) return;

        String summary = output.length() > 200
            ? output.substring(0, 200) + "..."
            : output;

        taskService.addProgress(taskId, agentName, summary.replace("\n", " "));
        log.debug("Task {}: {} output saved ({} chars)", taskId, agentName, output.length());
    }

    /**
     * 模拟太子协调完成（当 OpenClaw 禁用时）
     */
    private void simulateTaiziCoordination(String taskId) {
        taskService.addProgress(taskId, "太子", "📜 太子协调中书省起草方案...");
        taskService.addProgress(taskId, "中书省", "📝 方案已起草，提交门下省审议...");
        taskService.addProgress(taskId, "门下省", "🔍 审议通过，提交尚书省派发...");
        taskService.addProgress(taskId, "尚书省", "📮 任务已派发，执行中...");
        taskService.addProgress(taskId, "礼部", "✅ 任务执行完成");

        String output = "## 模拟执行结果\n\n" +
            "**太子协调模拟执行完成**\n\n" +
            "流程：\n" +
            "1. 太子分拣任务\n" +
            "2. 中书省起草方案\n" +
            "3. 门下省审议通过\n" +
            "4. 尚书省派发任务\n" +
            "5. 六部执行完成\n\n" +
            "（OpenClaw 已禁用，使用模拟模式）";

        taskService.completeTask(taskId, output, "✅ Workflow 模拟执行完成");
    }
}

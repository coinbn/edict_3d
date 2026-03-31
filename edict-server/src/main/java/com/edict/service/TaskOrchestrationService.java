package com.edict.service;

import com.edict.dto.TaskDecomposeRequest;
import com.edict.dto.TaskDecomposeResponse;
import com.edict.dto.SubTask;
import com.edict.entity.Agent;
import com.edict.repository.AgentRepository;
import com.edict.util.OpenClawCli;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskOrchestrationService {

    private final AgentRepository agentRepository;

    // Agent 能力映射
    private static final Map<String, List<String>> AGENT_CAPABILITIES = new HashMap<String, List<String>>() {{
        put("bingbu", Arrays.asList("编程", "代码审查", "架构设计", "开发", "调试"));
        put("gongbu", Arrays.asList("DevOps", "部署", "运维", "安装", "配置"));
        put("hubu", Arrays.asList("数据分析", "可视化", "统计", "报表", "计算"));
        put("xingbu", Arrays.asList("测试", "审查", "Bug修复", "调试", "验证"));
        put("libu", Arrays.asList("文档编写", "排版", "写作", "整理"));
        put("libu_hr", Arrays.asList("人事管理", "绩效考核", "统计", "招聘"));
        put("menxia", Arrays.asList("审核", "风险评估", "质量控制", "评审"));
        put("zhongshu", Arrays.asList("起草", "规划", "需求分析", "方案设计"));
        put("shangshu", Arrays.asList("派发", "协调", "汇总", "决策", "调度"));
    }};

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final DateTimeFormatter TASK_ID_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    /**
     * 拆解任务 - 自动分析任务并拆分为子任务
     */
    public TaskDecomposeResponse decompose(TaskDecomposeRequest request) {
        TaskDecomposeResponse response = new TaskDecomposeResponse();
        response.setOriginalTask(request.getTask());

        try {
            // 调用 LLM 进行任务拆解
            String decomposePrompt = buildDecomposePrompt(request.getTask());
            log.info("发送给中书省的提示词: {}", decomposePrompt);

            OpenClawCli.CliResult result = OpenClawCli.execute(
                    "zhongshu",
                    decomposePrompt,
                    120
            );

            if (result.isSuccess()) {
                String output = result.getOutput();
                log.info("中书省返回长度: {}, 内容: {}", output.length(), output.substring(0, Math.min(500, output.length())));
                List<SubTask> subtasks = parseSubtasks(output);
                response.setOk(true);
                response.setSubtasks(subtasks);
                response.setWorkflow(buildWorkflowDescription(subtasks));
            } else {
                response.setOk(false);
                response.setError("任务拆解失败: " + result.getError());
            }

        } catch (Exception e) {
            log.error("任务拆解异常: {}", e.getMessage());
            response.setOk(false);
            response.setError(e.getMessage());
        }

        return response;
    }

    /**
     * 构建拆解提示词 - 单行格式，避免编码问题
     */
    private String buildDecomposePrompt(String task) {
        return "【新任务】请把「" + task + "」拆成多个具体的子任务。" +
               "注意：这是全新的任务，之前没有做过。" +
               "直接返回JSON格式，不要其他内容：{\"subtasks\": [{\"title\":\"标题\",\"description\":\"描述\"}]}";
    }

    /**
     * 解析子任务 - 使用 Jackson JSON 解析
     */
    private List<SubTask> parseSubtasks(String output) {
        List<SubTask> subtasks = new ArrayList<>();

        try {
            // 提取JSON部分
            String jsonStr = extractJson(output);
            
            // 使用 Jackson 解析
            JsonNode rootNode = objectMapper.readTree(jsonStr);
            JsonNode subtasksNode = rootNode.get("subtasks");

            if (subtasksNode != null && subtasksNode.isArray()) {
                for (JsonNode node : subtasksNode) {
                    SubTask st = new SubTask();
                    st.setId(generateSubtaskId());

                    // 提取 title
                    JsonNode titleNode = node.get("title");
                    if (titleNode != null) {
                        st.setTitle(titleNode.asText());
                    }

                    // 提取 description
                    JsonNode descNode = node.get("description");
                    if (descNode != null) {
                        st.setDescription(descNode.asText());
                    }

                    // 根据标题自动分配 Agent
                    String agentInfo = autoSelectAgent(st.getTitle());
                    st.setAgentId(agentInfo);
                    st.setAgentLabel(getAgentLabel(agentInfo));
                    st.setSkills(AGENT_CAPABILITIES.getOrDefault(agentInfo, new ArrayList<>()));
                    st.setPriority("中");

                    subtasks.add(st);
                }
            }

        } catch (Exception e) {
            log.warn("解析子任务JSON失败: {}, 使用默认", e.getMessage());
            // 如果解析失败，创建一个默认子任务
            SubTask fallback = new SubTask();
            fallback.setId(generateSubtaskId());
            fallback.setTitle("处理任务");
            fallback.setDescription(output);
            fallback.setAgentId("zhongshu");
            fallback.setAgentLabel("中书省");
            fallback.setPriority("中");
            subtasks.add(fallback);
        }

        return subtasks;
    }

    /**
     * 根据任务标题自动选择 Agent
     */
    private String autoSelectAgent(String title) {
        if (title == null) return "zhongshu";

        String lower = title.toLowerCase();

        // 前端相关
        if (lower.contains("前端") || lower.contains("页面") || lower.contains("ui") ||
            lower.contains("表单") || lower.contains("vue") || lower.contains("react")) {
            return "bingbu";
        }

        // 后端相关
        if (lower.contains("后端") || lower.contains("接口") || lower.contains("api") ||
            lower.contains("token") || lower.contains("jwt") || lower.contains("加密") ||
            lower.contains("实体") || lower.contains("service") || lower.contains("controller")) {
            return "bingbu";
        }

        // 测试相关
        if (lower.contains("测试") || lower.contains("test") || lower.contains("unit")) {
            return "xingbu";
        }

        // 运维相关
        if (lower.contains("部署") || lower.contains("docker") || lower.contains("k8s") ||
            lower.contains("运维") || lower.contains("ci/cd")) {
            return "gongbu";
        }

        // 数据分析相关
        if (lower.contains("数据") || lower.contains("分析") || lower.contains("报表") ||
            lower.contains("可视化") || lower.contains("chart") || lower.contains("graph")) {
            return "hubu";
        }

        // 文档相关
        if (lower.contains("文档") || lower.contains("说明") || lower.contains("readme")) {
            return "libu";
        }

        // 默认兵部（开发）
        return "bingbu";
    }

    /**
     * 将 assignee 映射到 Agent ID
     */
    private String mapAssigneeToAgent(String assignee) {
        if (assignee == null) return "zhongshu";

        String lower = assignee.toLowerCase();
        if (lower.contains("后端") || lower.contains("backend")) return "bingbu";
        if (lower.contains("前端") || lower.contains("frontend")) return "bingbu";
        if (lower.contains("测试") || lower.contains("test")) return "xingbu";
        if (lower.contains("运维") || lower.contains("devops")) return "gongbu";
        if (lower.contains("数据") || lower.contains("分析")) return "hubu";
        if (lower.contains("文档") || lower.contains("写作")) return "libu";
        if (lower.contains("审核") || lower.contains("审查")) return "menxia";

        return "zhongshu";
    }

    /**
     * 从输出中提取JSON - 改进版
     */
    private String extractJson(String output) {
        // 去除 Config warnings 等前缀
        int jsonStart = output.indexOf("{");
        
        if (jsonStart >= 0) {
            // 从第一个 { 开始找最后一个 }
            int braceEnd = output.lastIndexOf("}");
            if (braceEnd > jsonStart) {
                return output.substring(jsonStart, braceEnd + 1);
            }
        }
        
        return output;
    }

    /**
     * 提取JSON值
     */
    private String extractValue(String line) {
        int colonIndex = line.indexOf(":");
        if (colonIndex >= 0) {
            String value = line.substring(colonIndex + 1).trim();
            value = value.replace("\"", "").replace(",", "");
            return value.trim();
        }
        return "";
    }

    /**
     * 获取Agent标签
     */
    private String getAgentLabel(String agentId) {
        return agentRepository.findById(agentId)
                .map(Agent::getLabel)
                .orElse(agentId);
    }

    /**
     * 生成子任务ID
     */
    private String generateSubtaskId() {
        return "ST-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /**
     * 构建工作流描述
     */
    private String buildWorkflowDescription(List<SubTask> subtasks) {
        if (subtasks == null || subtasks.isEmpty()) {
            return "无需拆解";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("共").append(subtasks.size()).append("个子任务:\n");

        for (int i = 0; i < subtasks.size(); i++) {
            SubTask st = subtasks.get(i);
            sb.append(i + 1).append(". ");
            sb.append(st.getTitle());
            sb.append(" → ").append(st.getAgentLabel());
            sb.append("\n");
        }

        return sb.toString();
    }

    /**
     * 派发任务到指定Agent
     */
    public String dispatchToAgent(String agentId, String message, int timeout) {
        try {
            OpenClawCli.CliResult result = OpenClawCli.execute(agentId, message, timeout);

            if (result.isSuccess()) {
                return result.getOutput();
            } else {
                return "ERROR: " + result.getError();
            }

        } catch (Exception e) {
            log.error("派发任务失败: agent={}, error={}", agentId, e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }
}

package com.edict.service;

import com.edict.dto.*;
import com.edict.entity.Agent;
import com.edict.entity.AgentSkill;
import com.edict.repository.AgentRepository;
import com.edict.repository.AgentSkillRepository;
import com.edict.util.OpenClawCli;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final AgentRepository agentRepository;
    private final AgentSkillRepository skillRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // OpenClaw 配置文件路径
    private static final String OPENCLAW_CONFIG_PATH = "C:\\Users\\admin\\.openclaw\\openclaw.json";

    private static final DateTimeFormatter ISO_FORMATTER = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    
    @Transactional(readOnly = true)
    public AgentConfigDTO getAgentConfig() {
        List<Agent> agents = agentRepository.findAllByOrderByLabelAsc();

        // 从 openclaw.json 获取真实模型配置
        Map<String, String> realModels = getAgentModelsFromConfig();
        String defaultModel = realModels.getOrDefault("_default", "kimi-coding/k2p5");
        realModels.remove("_default");

        AgentConfigDTO dto = new AgentConfigDTO();
        dto.setAgents(agents.stream().map(a -> {
            AgentConfigDTO.AgentInfoDTO info = convertToAgentInfo(a);
            // 优先使用 openclaw.json 中的真实模型
            String realModel = realModels.get(a.getId());
            if (realModel != null && !realModel.isEmpty()) {
                info.setModel(realModel);
            } else if (info.getModel() == null || info.getModel().isEmpty()) {
                info.setModel(defaultModel);
            }
            return info;
        }).collect(Collectors.toList()));

        // 预设的已知模型（与 OpenClaw 实际配置一致）
        dto.setKnownModels(Arrays.asList(
            createKnownModel("minimax-portal/MiniMax-M2.5", "MiniMax M2.5", "MiniMax"),
            createKnownModel("minimax-portal/MiniMax-M2.1", "MiniMax M2.1", "MiniMax"),
            createKnownModel("kimi-coding/k2p5", "Kimi Coding K2.5", "Moonshot"),
            createKnownModel("moonshot/kimi-k2.5", "Kimi K2.5", "Moonshot"),
            createKnownModel("gpt-4o", "GPT-4o", "OpenAI"),
            createKnownModel("gpt-4o-mini", "GPT-4o Mini", "OpenAI"),
            createKnownModel("claude-3-5-sonnet", "Claude 3.5 Sonnet", "Anthropic"),
            createKnownModel("claude-3-opus", "Claude 3 Opus", "Anthropic"),
            createKnownModel("glm-4", "GLM-4", "Zhipu")
        ));

        return dto;
    }

    /**
     * 从 openclaw.json 读取 Agent 的真实模型配置
     */
    private Map<String, String> getAgentModelsFromConfig() {
        Map<String, String> modelMap = new HashMap<>();
        try {
            File configFile = new File(OPENCLAW_CONFIG_PATH);
            if (!configFile.exists()) {
                log.warn("OpenClaw 配置文件不存在: {}", OPENCLAW_CONFIG_PATH);
                return modelMap;
            }

            JsonNode root = objectMapper.readTree(configFile);
            JsonNode agentsNode = root.path("agents").path("list");

            if (agentsNode.isArray()) {
                for (JsonNode agentNode : agentsNode) {
                    String agentId = agentNode.path("id").asText(null);
                    String model = agentNode.path("model").asText(null);
                    if (agentId != null && model != null && !model.isEmpty()) {
                        modelMap.put(agentId, model);
                    }
                }
            }

            // 获取默认模型
            String defaultModel = root.path("agents").path("defaults").path("model").path("primary").asText(null);
            if (defaultModel != null) {
                modelMap.put("_default", defaultModel);
            }

            log.debug("从 openclaw.json 读取到 {} 个 Agent 模型配置", modelMap.size());
        } catch (Exception e) {
            log.error("读取 openclaw.json 失败: {}", e.getMessage());
        }
        return modelMap;
    }

    /**
     * 获取 Agent 状态（从 openclaw.json 读取真实模型）
     */
    @Transactional(readOnly = true)
    public AgentsStatusDTO getAgentsStatus() {
        List<Agent> agents = agentRepository.findAll();

        // 从 openclaw.json 获取真实模型配置
        Map<String, String> realModels = getAgentModelsFromConfig();
        String defaultModel = realModels.getOrDefault("_default", "unknown");
        realModels.remove("_default");

        AgentsStatusDTO dto = new AgentsStatusDTO();
        dto.setOk(true);
        dto.setCheckedAt(LocalDateTime.now().format(ISO_FORMATTER));

        // Gateway status
        AgentsStatusDTO.GatewayStatusDTO gateway = new AgentsStatusDTO.GatewayStatusDTO();
        gateway.setAlive(true);
        gateway.setProbe(true);
        gateway.setStatus("healthy");
        dto.setGateway(gateway);

        // Agents status - 优先使用 openclaw.json 中的真实模型
        dto.setAgents(agents.stream().map(a -> {
            AgentsStatusDTO.AgentStatusInfoDTO info = new AgentsStatusDTO.AgentStatusInfoDTO();
            info.setId(a.getId());
            info.setLabel(a.getLabel());
            info.setEmoji(a.getEmoji());
            info.setRole(a.getRole());

            // 优先使用 openclaw.json 中的真实模型，否则用数据库的，最后用默认值
            String realModel = realModels.get(a.getId());
            info.setModel(realModel != null ? realModel : (a.getModel() != null ? a.getModel() : defaultModel));

            Agent.AgentStatus realtimeStatus = calculateRealtimeStatus(a);
            info.setStatus(realtimeStatus.name());
            info.setStatusLabel(getStatusLabel(realtimeStatus));

            info.setLastActive(a.getLastActive() != null ? a.getLastActive().format(ISO_FORMATTER) : null);
            info.setSessions(a.getSessions() != null ? a.getSessions() : 0);
            info.setMessages(a.getMessages() != null ? a.getMessages() : 0);
            return info;
        }).collect(Collectors.toList()));

        return dto;
    }

    
    /**
     * 从 OpenClaw 同步会话数据到数据库
     */
    private void syncSessionsFromOpenClaw() {
        try {
            OpenClawCli.CliResult result = OpenClawCli.getSessionsList();
            if (!result.isSuccess()) {
                log.warn("获取 OpenClaw 会话列表失败: {}", result.getError());
                return;
            }
            
            String output = result.getOutput();
            if (output == null || output.trim().isEmpty()) {
                log.warn("OpenClaw 会话列表为空");
                return;
            }
            
            // 解析 JSON 输出
            JsonNode rootNode = objectMapper.readTree(output);
            JsonNode sessionsNode = rootNode.get("sessions");
            
            if (sessionsNode == null || !sessionsNode.isArray()) {
                log.warn("OpenClaw 会话列表格式不正确");
                return;
            }
            
            // 统计每个 Agent 的会话数和消息数
            Map<String, Integer> agentSessionCount = new HashMap<>();
            Map<String, Integer> agentMessageCount = new HashMap<>();
            Map<String, LocalDateTime> agentLastActive = new HashMap<>();
            
            for (JsonNode session : sessionsNode) {
                String agentId = session.has("agentId") ? session.get("agentId").asText() : null;
                if (agentId == null) continue;
                
                // 统计会话数
                agentSessionCount.merge(agentId, 1, Integer::sum);
                
                // 统计消息数
                int messageCount = session.has("messageCount") ? session.get("messageCount").asInt() : 0;
                agentMessageCount.merge(agentId, messageCount, Integer::sum);
                
                // 最后活跃时间
                if (session.has("lastActivity")) {
                    String lastActivity = session.get("lastActivity").asText();
                    try {
                        LocalDateTime activityTime = LocalDateTime.parse(lastActivity, ISO_FORMATTER);
                        agentLastActive.merge(agentId, activityTime, (a, b) -> a.isAfter(b) ? a : b);
                    } catch (Exception e) {
                        // 忽略解析错误
                    }
                }
            }
            
            // 更新数据库
            List<Agent> agents = agentRepository.findAll();
            for (Agent agent : agents) {
                String agentId = agent.getId();
                boolean updated = false;
                
                Integer sessions = agentSessionCount.get(agentId);
                if (sessions != null) {
                    agent.setSessions(sessions);
                    updated = true;
                }
                
                Integer messages = agentMessageCount.get(agentId);
                if (messages != null) {
                    agent.setMessages(messages);
                    updated = true;
                }
                
                LocalDateTime lastActive = agentLastActive.get(agentId);
                if (lastActive != null) {
                    if (agent.getLastActive() == null || lastActive.isAfter(agent.getLastActive())) {
                        agent.setLastActive(lastActive);
                        updated = true;
                    }
                }
                
                if (updated) {
                    agentRepository.save(agent);
                }
            }
            
            log.info("同步 OpenClaw 会话数据完成: {} 个 Agent 更新", 
                agents.stream().filter(a -> agentSessionCount.containsKey(a.getId())).count());
            
        } catch (Exception e) {
            log.error("同步 OpenClaw 会话数据失败: {}", e.getMessage());
        }
    }
    
    /**
     * 根据最近活动时间计算实时状态
     */
    private Agent.AgentStatus calculateRealtimeStatus(Agent agent) {
        if (agent.getLastActive() == null) {
            return Agent.AgentStatus.idle;
        }
        
        LocalDateTime now = LocalDateTime.now();
        java.time.Duration duration = java.time.Duration.between(agent.getLastActive(), now);
        long minutesAgo = duration.toMinutes();
        
        if (minutesAgo <= 5) {
            return Agent.AgentStatus.running;
        } else if (minutesAgo <= 30) {
            return Agent.AgentStatus.idle;
        } else {
            return Agent.AgentStatus.offline;
        }
    }
    
    @Transactional(readOnly = true)
    public OfficialsStatsDTO getOfficialsStats() {
        List<Agent> agents = agentRepository.findAll();
        
        OfficialsStatsDTO dto = new OfficialsStatsDTO();
        dto.setOfficials(agents.stream().map(this::convertToOfficialInfo).collect(Collectors.toList()));
        
        // Totals
        OfficialsStatsDTO.TotalsDTO totals = new OfficialsStatsDTO.TotalsDTO();
        totals.setTasks_done(agents.stream().mapToInt(Agent::getTasksDone).sum());
        totals.setCost_cny(agents.stream().mapToDouble(Agent::getCostCny).sum());
        dto.setTotals(totals);
        
        // Top official (by merit score)
        agents.stream()
            .max((a1, a2) -> Integer.compare(a1.getMeritScore(), a2.getMeritScore()))
            .ifPresent(top -> dto.setTop_official(top.getLabel()));
        
        return dto;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAgentSessionsStats() {
        List<Agent> agents = agentRepository.findAll();
        int totalAgents = agents.size();
        int totalSessions = agents.stream().mapToInt(a -> a.getSessions() != null ? a.getSessions() : 0).sum();
        int totalMessages = agents.stream().mapToInt(a -> a.getMessages() != null ? a.getMessages() : 0).sum();
        long activeAgents = agents.stream()
            .filter(a -> calculateRealtimeStatus(a) == Agent.AgentStatus.running)
            .count();

        List<Map<String, Object>> details = agents.stream().map(a -> {
            Map<String, Object> item = new HashMap<>();
            item.put("agentId", a.getId());
            item.put("label", a.getLabel());
            item.put("status", calculateRealtimeStatus(a).name());
            item.put("sessions", a.getSessions() != null ? a.getSessions() : 0);
            item.put("messages", a.getMessages() != null ? a.getMessages() : 0);
            item.put("lastActive", a.getLastActive() != null ? a.getLastActive().format(ISO_FORMATTER) : null);
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("totalAgents", totalAgents);
        result.put("activeAgents", activeAgents);
        result.put("totalSessions", totalSessions);
        result.put("totalMessages", totalMessages);
        result.put("agents", details);
        result.put("checkedAt", LocalDateTime.now().format(ISO_FORMATTER));
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAgentSessionStats(String agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));

        Map<String, Object> result = new HashMap<>();
        result.put("ok", true);
        result.put("agentId", agent.getId());
        result.put("label", agent.getLabel());
        result.put("status", calculateRealtimeStatus(agent).name());
        result.put("sessions", agent.getSessions() != null ? agent.getSessions() : 0);
        result.put("messages", agent.getMessages() != null ? agent.getMessages() : 0);
        result.put("lastActive", agent.getLastActive() != null ? agent.getLastActive().format(ISO_FORMATTER) : null);
        result.put("checkedAt", LocalDateTime.now().format(ISO_FORMATTER));
        return result;
    }
    
    @Transactional
    public ActionResultDTO setModel(String agentId, String model) {
        Agent agent = agentRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));
        
        agent.setModel(model);
        agentRepository.save(agent);
        
        ActionResultDTO result = new ActionResultDTO();
        result.setOk(true);
        result.setMessage("Model updated for " + agentId);
        return result;
    }
    
    @Transactional
    public ActionResultDTO agentWake(String agentId) {
        Agent agent = agentRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));
        
        String wakeMessage = "🔔 系统唤醒请求 - 请回复 OK 确认在线";
        
        try {
            OpenClawCli.CliResult result = OpenClawCli.execute(agentId, wakeMessage, 60);
            
            if (result.isSuccess()) {
                log.info("Agent {} 唤醒成功", agentId);
                agent.setStatus(Agent.AgentStatus.running);
                agent.setLastActive(LocalDateTime.now());
                agentRepository.save(agent);
                
                ActionResultDTO res = new ActionResultDTO();
                res.setOk(true);
                res.setMessage("Agent " + agentId + " 已唤醒");
                return res;
            } else {
                log.warn("Agent {} 唤醒失败: exitCode={}", agentId, result.getExitCode());
                
                ActionResultDTO res = new ActionResultDTO();
                res.setOk(false);
                res.setError("唤醒失败: " + result.getError());
                return res;
            }
        } catch (Exception e) {
            log.error("调用 OpenClaw CLI 失败: {}", e.getMessage());
            
            agent.setStatus(Agent.AgentStatus.running);
            agent.setLastActive(LocalDateTime.now());
            agentRepository.save(agent);
            
            ActionResultDTO res = new ActionResultDTO();
            res.setOk(true);
            res.setMessage("Agent " + agentId + " 状态已更新 (CLI 调用异常)");
            return res;
        }
    }
    
    private AgentConfigDTO.AgentInfoDTO convertToAgentInfo(Agent agent) {
        AgentConfigDTO.AgentInfoDTO dto = new AgentConfigDTO.AgentInfoDTO();
        dto.setId(agent.getId());
        dto.setLabel(agent.getLabel());
        dto.setEmoji(agent.getEmoji());
        dto.setRole(agent.getRole());
        dto.setModel(agent.getModel());
        dto.setSkills(agent.getSkills().stream().map(s -> {
            AgentConfigDTO.SkillInfoDTO skill = new AgentConfigDTO.SkillInfoDTO();
            skill.setName(s.getName());
            skill.setDescription(s.getDescription());
            skill.setPath(s.getPath());
            return skill;
        }).collect(Collectors.toList()));
        return dto;
    }
    
    private OfficialsStatsDTO.OfficialInfoDTO convertToOfficialInfo(Agent agent) {
        OfficialsStatsDTO.OfficialInfoDTO dto = new OfficialsStatsDTO.OfficialInfoDTO();
        dto.setId(agent.getId());
        dto.setLabel(agent.getLabel());
        dto.setEmoji(agent.getEmoji());
        dto.setRole(agent.getRole());
        dto.setRank(getRank(agent.getRole()));
        dto.setModel(agent.getModel());
        dto.setModel_short(getShortModel(agent.getModel()));
        dto.setTokens_in(agent.getTokensIn());
        dto.setTokens_out(agent.getTokensOut());
        dto.setCache_read(agent.getCacheRead());
        dto.setCache_write(agent.getCacheWrite());
        dto.setCost_cny(agent.getCostCny());
        dto.setCost_usd(agent.getCostUsd());
        dto.setSessions(agent.getSessions());
        dto.setMessages(agent.getMessages());
        dto.setTasks_done(agent.getTasksDone());
        dto.setTasks_active(agent.getTasksActive());
        dto.setFlow_participations(0);
        dto.setMerit_score(agent.getMeritScore());
        dto.setMerit_rank(agent.getMeritRank());
        dto.setLast_active(agent.getLastActive() != null ? agent.getLastActive().format(ISO_FORMATTER) : null);
        
        TaskDTO.HeartbeatDTO heartbeat = new TaskDTO.HeartbeatDTO();
        Agent.AgentStatus realtimeStatus = calculateRealtimeStatus(agent);
        heartbeat.setStatus(realtimeStatus.name());
        heartbeat.setLabel(getStatusLabel(realtimeStatus));
        dto.setHeartbeat(heartbeat);
        
        return dto;
    }
    
    private AgentConfigDTO.KnownModelDTO createKnownModel(String id, String label, String provider) {
        AgentConfigDTO.KnownModelDTO dto = new AgentConfigDTO.KnownModelDTO();
        dto.setId(id);
        dto.setLabel(label);
        dto.setProvider(provider);
        return dto;
    }
    
    private String getStatusLabel(Agent.AgentStatus status) {
        switch (status) {
            case running: return "运行中";
            case idle: return "空闲";
            case offline: return "离线";
            case unconfigured: return "未配置";
            default: return "未知";
        }
    }
    
    private String getRank(String role) {
        if (role == null) return "九品";
        if (role.contains("尚书")) return "一品";
        if (role.contains("侍郎")) return "二品";
        if (role.contains("郎中")) return "三品";
        if (role.contains("员外")) return "四品";
        if (role.contains("主事")) return "五品";
        return "九品";
    }
    
    private String getShortModel(String model) {
        if (model == null) return "unknown";
        if (model.contains("gpt-4o-mini")) return "4o-mini";
        if (model.contains("gpt-4o")) return "4o";
        if (model.contains("claude-3-5")) return "C3.5";
        if (model.contains("claude-3-opus")) return "C3O";
        if (model.contains("kimi")) return "Kimi";
        return model;
    }
    
    /**
     * 从 OpenClaw CLI 同步 Agent 真实数据
     */
    @Transactional
    public ActionResultDTO syncAgentsFromOpenClaw() {
        ActionResultDTO result = new ActionResultDTO();
        try {
            log.info("开始同步 Agent 数据...");
            
            ProcessBuilder pb = new ProcessBuilder();
            pb.command("cmd.exe", "/c", "C:\\Users\\admin\\AppData\\Roaming\\npm\\openclaw.cmd", "agents", "list");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(process.getInputStream(), "UTF-8")
            );
            
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            
            int exitCode = process.waitFor();
            String outputStr = output.toString();
            
            String[] lines = outputStr.split("\n");
            StringBuilder cleanOutput = new StringBuilder();
            for (String l : lines) {
                if (!l.contains("Config warnings") && !l.startsWith("|") && !l.startsWith("+---")) {
                    cleanOutput.append(l).append("\n");
                }
            }
            String cleanStr = cleanOutput.toString();
            
            log.info("OpenClaw 解析后: {}", cleanStr.substring(0, Math.min(500, cleanStr.length())));
            
            if (exitCode == 0) {
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                    "- (\\w+)[\\s\\S]*?Model:\\s*(\\S+)"
                );
                java.util.regex.Matcher matcher = pattern.matcher(cleanStr);
                
                int synced = 0;
                while (matcher.find()) {
                    String agentId = matcher.group(1);
                    String model = matcher.group(2);
                    
                    if (agentId != null && model != null) {
                        Agent agent = agentRepository.findById(agentId).orElse(null);
                        if (agent != null) {
                            if (!model.equals(agent.getModel())) {
                                agent.setModel(model);
                                agentRepository.save(agent);
                                synced++;
                                log.info("同步 Agent {} 模型: {} -> {}", agentId, agent.getModel(), model);
                            }
                        }
                    }
                }
                
                result.setOk(true);
                result.setMessage("同步成功，共更新 " + synced + " 个 Agent");
            } else {
                result.setOk(false);
                result.setError("OpenClaw CLI 执行失败");
            }
            
        } catch (Exception e) {
            log.error("同步 Agent 失败", e);
            result.setOk(false);
            result.setError(e.getMessage());
        }
        
        return result;
    }
}

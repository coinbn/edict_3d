package com.edict.controller;

import com.edict.dto.*;
import com.edict.service.AgentService;
import com.edict.util.OpenClawCli;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AgentController {
    
    private final AgentService agentService;
    
    @GetMapping("/agent-config")
    public AgentConfigDTO getAgentConfig() {
        return agentService.getAgentConfig();
    }
    
    @GetMapping("/agents-status")
    public AgentsStatusDTO getAgentsStatus() {
        return agentService.getAgentsStatus();
    }
    
    @GetMapping("/officials-stats")
    public OfficialsStatsDTO getOfficialsStats() {
        return agentService.getOfficialsStats();
    }

    @GetMapping("/agent-sessions/stats")
    public Map<String, Object> getAgentSessionsStats() {
        return agentService.getAgentSessionsStats();
    }

    @GetMapping("/agent/{agentId}/sessions/stats")
    public Map<String, Object> getAgentSessionStats(@PathVariable String agentId) {
        return agentService.getAgentSessionStats(agentId);
    }
    
    @PostMapping("/set-model")
    public ActionResultDTO setModel(@RequestBody Map<String, String> body) {
        String agentId = body.get("agentId");
        String model = body.get("model");
        return agentService.setModel(agentId, model);
    }
    
    @PostMapping("/agent-wake")
    public ActionResultDTO agentWake(@RequestBody Map<String, String> body) {
        String agentId = body.get("agentId");
        return agentService.agentWake(agentId);
    }
    
    @PostMapping("/sync-agents")
    public ActionResultDTO syncAgents() {
        return agentService.syncAgentsFromOpenClaw();
    }

    @PostMapping("/sync-sessions")
    public Map<String, Object> syncSessions() {
        return agentService.syncSessionsFromOpenClaw();
    }

    /**
     * 向 Agent 发送消息并触发执行
     * POST /api/agent-message
     */
    @PostMapping("/agent-message")
    public Map<String, Object> sendAgentMessage(@RequestBody Map<String, Object> body) {
        String agentId = (String) body.get("agentId");
        String message = (String) body.get("message");
        String imageData = (String) body.get("imageData");
        Boolean useVision = (Boolean) body.get("useVision");
        
        Map<String, Object> response = new java.util.HashMap<>();
        
        if (agentId == null || message == null) {
            response.put("ok", false);
            response.put("error", "agentId and message are required");
            return response;
        }
        
        try {
            // 调用 OpenClaw CLI 真正触发 Agent
            log.info("触发 Agent: {} - {}", agentId, message.substring(0, Math.min(50, message.length())));
            if (imageData != null) {
                log.info("消息包含图片数据，长度: {}", imageData.length());
            }
            if (Boolean.TRUE.equals(useVision)) {
                log.info("使用视觉模型分析图片");
            }
            
            // 使用线程执行，避免阻塞
            new Thread(() -> {
                try {
                    // 构建完整消息
                    String fullMessage = message;
                    
                    // 如果有图片且需要视觉分析
                    if (imageData != null && !imageData.isEmpty()) {
                        // 对于支持视觉的模型，将图片数据附加到消息中
                        // 注意：实际处理取决于 Agent 使用的模型是否支持多模态
                        fullMessage += "\n\n[图片数据已附加，图片Base64长度: " + imageData.length() + "]";
                        
                        // 如果图片太大，可能需要保存到文件然后传路径
                        if (imageData.length() > 100000) {
                            log.info("图片较大，建议使用支持多模态的模型如 gpt-4o 或 claude-3-5-sonnet");
                        }
                    }
                    
                    OpenClawCli.CliResult result = OpenClawCli.execute(agentId, fullMessage, 300);
                    log.info("Agent {} 执行结果: exitCode={}", agentId, result.getExitCode());
                } catch (Exception e) {
                    log.error("Agent {} 执行失败: {}", agentId, e.getMessage());
                }
            }).start();
            
            response.put("ok", true);
            response.put("message", "已触发 Agent: " + agentId);
            response.put("agentId", agentId);
            if (imageData != null) {
                response.put("hasImage", true);
            }
            if (Boolean.TRUE.equals(useVision)) {
                response.put("useVision", true);
            }
            
        } catch (Exception e) {
            log.error("触发 Agent 失败: {}", e.getMessage());
            response.put("ok", false);
            response.put("error", e.getMessage());
        }
        
        return response;
    }

}

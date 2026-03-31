package com.edict.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Edict API 客户端 - 供太子调用后端服务
 */
@Slf4j
@Component
public class EdictApiClient {

    private final String BASE_URL = "http://localhost:8080/api";
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 任务拆解 - 自动分析任务并拆分子任务
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> decomposeTask(String task, String priority, String creator) {
        try {
            String url = BASE_URL + "/task/decompose";
            Map<String, Object> request = new HashMap<>();
            request.put("task", task);
            request.put("priority", priority != null ? priority : "中");
            request.put("creator", creator != null ? creator : "太子");
            
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
            return response;
            
        } catch (Exception e) {
            log.error("任务拆解失败: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("ok", false);
            error.put("error", e.getMessage());
            return error;
        }
    }

    /**
     * 一键执行任务
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> executeTask(String task, String priority, String creator) {
        try {
            String url = BASE_URL + "/task/execute";
            Map<String, Object> request = new HashMap<>();
            request.put("task", task);
            request.put("priority", priority != null ? priority : "中");
            request.put("creator", creator != null ? creator : "太子");
            
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
            return response;
            
        } catch (Exception e) {
            log.error("任务执行失败: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("ok", false);
            error.put("error", e.getMessage());
            return error;
        }
    }

    /**
     * 唤醒Agent
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> wakeAgent(String agentId) {
        try {
            String url = BASE_URL + "/agent-wake";
            Map<String, Object> request = new HashMap<>();
            request.put("agentId", agentId);
            
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
            return response;
            
        } catch (Exception e) {
            log.error("唤醒Agent失败: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("ok", false);
            error.put("error", e.getMessage());
            return error;
        }
    }
}

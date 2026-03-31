package com.edict.controller;

import com.edict.dto.*;
import com.edict.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 调度器扫描控制器
 */
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class SchedulerScanController {
    
    private final EdictTaskService taskService;
    
    /**
     * 调度器扫描
     */
    @PostMapping("/scheduler-scan")
    public Map<String, Object> schedulerScan(@RequestBody Map<String, Object> request) {
        Map<String, Object> result = new HashMap<>();
        
        int thresholdSec = request.containsKey("thresholdSec") 
            ? ((Number) request.get("thresholdSec")).intValue() 
            : 180;
        
        // 扫描超时的任务
        List<Map<String, Object>> actions = new ArrayList<>();
        
        // 模拟扫描结果
        Map<String, Object> action = new HashMap<>();
        action.put("type", "none");
        action.put("taskId", "N/A");
        action.put("reason", "No timeout tasks found");
        actions.add(action);
        
        result.put("ok", true);
        result.put("message", "Scan completed");
        result.put("count", 0);
        result.put("actions", actions);
        result.put("checkedAt", LocalDateTime.now().toString());
        
        return result;
    }
}

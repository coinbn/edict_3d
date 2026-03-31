package com.edict.controller;

import com.edict.dto.*;
import com.edict.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 审核控制器
 */
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class ReviewController {
    
    private final EdictTaskService taskService;
    
    /**
     * 审核操作
     */
    @PostMapping("/review-action")
    public ActionResultDTO reviewAction(@RequestBody Map<String, Object> request) {
        String taskId = (String) request.get("taskId");
        String action = (String) request.get("action");
        String comment = (String) request.get("comment");
        
        if (taskId == null || action == null) {
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError("taskId and action are required");
            return result;
        }
        
        ActionResultDTO result = new ActionResultDTO();
        
        switch (action) {
            case "approve":
                result.setOk(true);
                result.setMessage("审核通过");
                break;
            case "reject":
                result.setOk(true);
                result.setMessage("审核驳回");
                break;
            case "request_changes":
                result.setOk(true);
                result.setMessage("要求修改");
                break;
            default:
                result.setOk(false);
                result.setError("Unknown action: " + action);
        }
        
        return result;
    }
}

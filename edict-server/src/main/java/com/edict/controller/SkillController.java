package com.edict.controller;

import com.edict.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 技能管理控制器
 */
@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@RequestMapping("/api")
public class SkillController {
    
    // 模拟技能存储: agentId -> {skillName -> description}
    private Map<String, Map<String, String>> remoteSkills = new HashMap<>();
    private List<ModelChangeLogEntry> modelChangeLogs = new ArrayList<>();
    
    /**
     * 获取所有远程技能
     */
    @GetMapping("/remote-skills-list")
    public Map<String, Object> listRemoteSkills() {
        Map<String, Object> result = new HashMap<>();
        for (String agentId : remoteSkills.keySet()) {
            result.put(agentId, remoteSkills.get(agentId).keySet().toArray());
        }
        return result;
    }
    
    /**
     * 添加远程技能
     */
    @PostMapping("/add-remote-skill")
    public ActionResultDTO addRemoteSkill(@RequestBody Map<String, Object> request) {
        String agentId = (String) request.get("agentId");
        String skillName = (String) request.get("skillName");
        String description = (String) request.get("description");
        
        if (agentId == null || skillName == null) {
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError("agentId and skillName are required");
            return result;
        }
        
        remoteSkills.computeIfAbsent(agentId, k -> new HashMap<>());
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
    public ActionResultDTO updateRemoteSkill(@RequestBody Map<String, Object> request) {
        String agentId = (String) request.get("agentId");
        String skillName = (String) request.get("skillName");
        String description = (String) request.get("description");
        
        if (agentId == null || skillName == null) {
            ActionResultDTO result = new ActionResultDTO();
            result.setOk(false);
            result.setError("agentId and skillName are required");
            return result;
        }
        
        Map<String, String> agentSkills = remoteSkills.get(agentId);
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
    public ActionResultDTO removeRemoteSkill(@RequestBody Map<String, Object> request) {
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
        
        Map<String, String> agentSkills = remoteSkills.get(agentId);
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
    public List<ModelChangeLogEntry> getModelChangeLog() {
        return modelChangeLogs;
    }
}

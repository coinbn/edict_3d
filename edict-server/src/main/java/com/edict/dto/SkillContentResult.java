package com.edict.dto;

import lombok.Data;

@Data
public class SkillContentResult {
    private boolean ok;
    private String agentId;
    private String skillName;
    private String content;
}

package com.edict.dto;

import lombok.Data;

import java.util.List;

@Data
public class AgentConfigDTO {
    private List<AgentInfoDTO> agents;
    private List<KnownModelDTO> knownModels;
    
    @Data
    public static class AgentInfoDTO {
        private String id;
        private String label;
        private String emoji;
        private String role;
        private String model;
        private List<SkillInfoDTO> skills;
    }
    
    @Data
    public static class SkillInfoDTO {
        private String name;
        private String description;
        private String path;
    }
    
    @Data
    public static class KnownModelDTO {
        private String id;
        private String label;
        private String provider;
    }
}

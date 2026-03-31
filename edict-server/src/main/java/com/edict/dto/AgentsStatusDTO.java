package com.edict.dto;

import lombok.Data;

import java.util.List;

@Data
public class AgentsStatusDTO {
    private boolean ok;
    private GatewayStatusDTO gateway;
    private List<AgentStatusInfoDTO> agents;
    private String checkedAt;
    
    @Data
    public static class GatewayStatusDTO {
        private boolean alive;
        private boolean probe;
        private String status;
    }
    
    @Data
    public static class AgentStatusInfoDTO {
        private String id;
        private String label;
        private String emoji;
        private String role;
        private String model;
        private String status; // running, idle, offline, unconfigured
        private String statusLabel;
        private String lastActive;
        private int tokensIn;
        private int tokensOut;
        private int sessions;
        private int messages;
    }
}

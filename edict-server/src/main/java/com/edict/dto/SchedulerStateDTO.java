package com.edict.dto;

import lombok.Data;

@Data
public class SchedulerStateDTO {
    private boolean ok;
    private String error;
    private SchedulerInfoDTO scheduler;
    private Long stalledSec;
    
    @Data
    public static class SchedulerInfoDTO {
        private Integer retryCount;
        private Integer escalationLevel;
        private String lastDispatchStatus;
        private Long stallThresholdSec;
        private Boolean enabled;
        private String lastProgressAt;
        private String lastDispatchAt;
        private String lastDispatchAgent;
        private Boolean autoRollback;
    }
}

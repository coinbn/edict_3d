package com.edict.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class LiveStatusDTO {
    private List<TaskDTO> tasks;
    private SyncStatusDTO syncStatus;
    
    @Data
    public static class SyncStatusDTO {
        private boolean ok = true;
    }
}

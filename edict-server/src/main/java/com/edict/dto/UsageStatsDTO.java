package com.edict.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class UsageStatsDTO {
    private boolean ok;
    private Integer activeSessions;
    private Integer activeAgents;
    private Map<String, Object> trend;
}

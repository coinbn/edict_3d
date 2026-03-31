package com.edict.dto;

import lombok.Data;

@Data
public class TaskDispatchResponse {
    private boolean ok;
    private String taskId;
    private String subtaskId;
    private String agentId;
    private String agentResponse;
    private String error;
}

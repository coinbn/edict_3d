package com.edict.dto;

import lombok.Data;

@Data
public class TaskDispatchRequest {
    private String taskId;
    private String subtaskId;
    private String message;
}

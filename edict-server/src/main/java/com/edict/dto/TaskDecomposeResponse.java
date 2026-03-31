package com.edict.dto;

import lombok.Data;
import java.util.List;

@Data
public class TaskDecomposeResponse {
    private boolean ok;
    private String originalTask;
    private List<SubTask> subtasks;
    private String workflow;
    private String error;
}

package com.edict.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ActionResultDTO {
    private boolean ok;
    private String message;
    private String error;
    private String taskId;
    private Integer count;
}

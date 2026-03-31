package com.edict.dto;

import lombok.Data;
import java.util.Date;

@Data
public class ModelChangeLogEntry {
    private String id;
    private String agentId;
    private String oldModel;
    private String newModel;
    private String operator;
    private Date changedAt;
}

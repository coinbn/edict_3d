package com.edict.dto;

import lombok.Data;
import java.util.List;

@Data
public class SubTask {
    private String id;
    private String title;
    private String description;
    private String agentId;
    private String agentLabel;
    private String priority;
    private List<String> skills;
}

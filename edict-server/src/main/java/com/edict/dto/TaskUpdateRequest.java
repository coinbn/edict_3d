package com.edict.dto;

import lombok.Data;

/**
 * 更新任务请求
 */
@Data
public class TaskUpdateRequest {
    private String title;
    private String state;
    private String org;
    private String now;
    private String description;
    private String eta;
    private String block;
    private String ac;
    private String output;
    private String priority;
}

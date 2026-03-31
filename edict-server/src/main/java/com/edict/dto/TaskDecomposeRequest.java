package com.edict.dto;

import lombok.Data;

@Data
public class TaskDecomposeRequest {
    private String task;
    private String priority;
    private String creator;
    private String imageData; // Base64 图片数据
}

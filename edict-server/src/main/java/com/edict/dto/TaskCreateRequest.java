package com.edict.dto;

import lombok.Data;

/**
 * 创建任务请求
 */
@Data
public class TaskCreateRequest {
    private String id;          // JJC-YYYYMMDD-NNN
    private String title;       // 任务标题
    private String state;       // Pending/Zhongshu/Menxia/Assigned/Doing/Done/Blocked
    private String org;         // 太子/中书省/门下省/尚书省/工部/兵部/户部/礼部/刑部/吏部
    private String official;    // 负责人
    private String now;         // 当前状态描述
    private String description; // 详细描述
    private String priority;    // 高/中/低
}

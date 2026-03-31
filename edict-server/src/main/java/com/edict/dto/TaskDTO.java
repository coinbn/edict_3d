package com.edict.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class TaskDTO {
    private String id;
    private String title;
    private String state;
    private String org;
    private String now;
    private String eta;
    private String block;
    private String ac;
    private String output;
    private HeartbeatDTO heartbeat;
    private List<FlowEntryDTO> flow_log;
    private List<TodoItemDTO> todos;
    private Integer review_round;
    private Boolean archived;
    private String archivedAt;
    private String updatedAt;
    private Map<String, Object> sourceMeta;
    private String _prev_state;
    
    @Data
    public static class HeartbeatDTO {
        private String status; // active, warn, stalled, unknown, idle
        private String label;
    }
    
    @Data
    public static class FlowEntryDTO {
        private String at;
        private String from;
        private String to;
        private String remark;
    }
    
    @Data
    public static class TodoItemDTO {
        private String id;
        private String title;
        private String status; // not-started, in-progress, completed
        private String detail;
    }
}

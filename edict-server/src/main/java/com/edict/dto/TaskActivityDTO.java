package com.edict.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class TaskActivityDTO {
    private boolean ok;
    private String message;
    private String error;
    private List<ActivityEntryDTO> activity;
    private List<String> relatedAgents;
    private String agentLabel;
    private String lastActive;
    private List<PhaseDurationDTO> phaseDurations;
    private String totalDuration;
    private TodosSummaryDTO todosSummary;
    private ResourceSummaryDTO resourceSummary;
    
    @Data
    public static class ActivityEntryDTO {
        private String kind;
        private String at;
        private String text;
        private String thinking;
        private String agent;
        private String from;
        private String to;
        private String remark;
        private List<ToolDTO> tools;
        private String tool;
        private String output;
        private Integer exitCode;
        private List<TaskDTO.TodoItemDTO> items;
        private DiffDTO diff;
    }
    
    @Data
    public static class ToolDTO {
        private String name;
        private String input_preview;
    }
    
    @Data
    public static class DiffDTO {
        private List<ChangeDTO> changed;
        private List<AddRemoveDTO> added;
        private List<AddRemoveDTO> removed;
    }
    
    @Data
    public static class ChangeDTO {
        private String id;
        private String from;
        private String to;
    }
    
    @Data
    public static class AddRemoveDTO {
        private String id;
        private String title;
    }
    
    @Data
    public static class PhaseDurationDTO {
        private String phase;
        private Long durationSec;
        private String durationText;
        private Boolean ongoing;
    }
    
    @Data
    public static class TodosSummaryDTO {
        private Integer total;
        private Integer completed;
        private Integer inProgress;
        private Integer notStarted;
        private Integer percent;
    }
    
    @Data
    public static class ResourceSummaryDTO {
        private Long totalTokens;
        private Double totalCost;
        private Long totalElapsedSec;
    }
}

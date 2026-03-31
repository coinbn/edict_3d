package com.edict.dto;

import lombok.Data;

import java.util.List;

@Data
public class OfficialsStatsDTO {
    private List<OfficialInfoDTO> officials;
    private TotalsDTO totals;
    private String top_official;
    
    @Data
    public static class OfficialInfoDTO {
        private String id;
        private String label;
        private String emoji;
        private String role;
        private String rank;
        private String model;
        private String model_short;
        private Long tokens_in;
        private Long tokens_out;
        private Long cache_read;
        private Long cache_write;
        private Double cost_cny;
        private Double cost_usd;
        private Integer sessions;
        private Integer messages;
        private Integer tasks_done;
        private Integer tasks_active;
        private Integer flow_participations;
        private Integer merit_score;
        private Integer merit_rank;
        private String last_active;
        private TaskDTO.HeartbeatDTO heartbeat;
        private List<ParticipatedEdictDTO> participated_edicts;
    }
    
    @Data
    public static class ParticipatedEdictDTO {
        private String id;
        private String title;
        private String state;
    }
    
    @Data
    public static class TotalsDTO {
        private Integer tasks_done;
        private Double cost_cny;
    }
}

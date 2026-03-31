package com.edict.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class SubtitleDTO {
    private Long id;
    private Long projectId;
    private Integer subIndex;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long startTimeMs;
    private Long endTimeMs;
    private String text;
    private String speaker;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

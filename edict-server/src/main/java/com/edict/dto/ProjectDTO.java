package com.edict.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProjectDTO {
    private Long id;
    private String name;
    private String description;
    private String videoPath;
    private String videoName;
    private String audioPath;
    private Double videoDuration;
    private Integer videoWidth;
    private Integer videoHeight;
    private String status;
    private Integer subtitleCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

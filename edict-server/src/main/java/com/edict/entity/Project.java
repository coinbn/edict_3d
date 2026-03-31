package com.edict.entity;

import javax.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Data
public class Project {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "video_path", length = 1000)
    private String videoPath;
    
    @Column(name = "video_name", length = 200)
    private String videoName;
    
    @Column(name = "audio_path", length = 1000)
    private String audioPath;
    
    @Column(name = "video_duration")
    private Double videoDuration;
    
    @Column(name = "video_width")
    private Integer videoWidth;
    
    @Column(name = "video_height")
    private Integer videoHeight;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProjectStatus status = ProjectStatus.ACTIVE;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("startTime ASC")
    private List<Subtitle> subtitles = new ArrayList<>();
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum ProjectStatus {
        ACTIVE,     // 进行中
        COMPLETED,  // 已完成
        ARCHIVED    // 已归档
    }
}

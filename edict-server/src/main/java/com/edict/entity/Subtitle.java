package com.edict.entity;

import javax.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "subtitles", indexes = {
    @Index(name = "idx_project_time", columnList = "project_id, start_time, end_time")
})
@Data
public class Subtitle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    
    @Column(name = "sub_index")
    private Integer subIndex;
    
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;
    
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;
    
    @Column(name = "start_time_ms")
    private Long startTimeMs;
    
    @Column(name = "end_time_ms")
    private Long endTimeMs;
    
    @Column(nullable = false, length = 2000)
    private String text;
    
    @Column(length = 100)
    private String speaker;
    
    @Column(length = 500)
    private String note;
    
    @Version
    private Long version;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

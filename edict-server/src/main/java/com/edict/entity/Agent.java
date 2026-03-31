package com.edict.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "agents")
@Data
public class Agent {
    
    @Id
    @Column(length = 50)
    private String id;
    
    @Column(length = 100)
    private String label;
    
    @Column(length = 10)
    private String emoji;
    
    @Column(length = 50)
    private String role;
    
    @Column(length = 50)
    private String model;
    
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private AgentStatus status = AgentStatus.idle;
    
    @Column(name = "last_active")
    private LocalDateTime lastActive;
    
    @OneToMany(mappedBy = "agent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AgentSkill> skills = new ArrayList<>();
    
    // 统计信息
    @Column(name = "tokens_in")
    private Long tokensIn = 0L;
    
    @Column(name = "tokens_out")
    private Long tokensOut = 0L;
    
    @Column(name = "cache_read")
    private Long cacheRead = 0L;
    
    @Column(name = "cache_write")
    private Long cacheWrite = 0L;
    
    @Column(name = "cost_cny")
    private Double costCny = 0.0;
    
    @Column(name = "cost_usd")
    private Double costUsd = 0.0;
    
    @Column(name = "sessions")
    private Integer sessions = 0;
    
    @Column(name = "messages")
    private Integer messages = 0;
    
    @Column(name = "tasks_done")
    private Integer tasksDone = 0;
    
    @Column(name = "tasks_active")
    private Integer tasksActive = 0;
    
    @Column(name = "merit_score")
    private Integer meritScore = 0;
    
    @Column(name = "merit_rank")
    private Integer meritRank = 0;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum AgentStatus {
        running, idle, offline, unconfigured
    }
}

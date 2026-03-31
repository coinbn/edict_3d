package com.edict.entity;

import lombok.Data;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usage_stats")
@Data
public class UsageStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "stat_date")
    private String statDate; // yyyy-MM-dd
    
    @Column(name = "total_tokens")
    private Long totalTokens;
    
    @Column(name = "total_cost")
    private Double totalCost;
    
    @Column(name = "active_sessions")
    private Integer activeSessions;
    
    @Column(name = "active_agents")
    private Integer activeAgents;
    
    @Column(name = "messages_count")
    private Long messagesCount;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

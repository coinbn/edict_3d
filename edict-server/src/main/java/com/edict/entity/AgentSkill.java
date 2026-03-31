package com.edict.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agent_skills")
@Data
public class AgentSkill {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private Agent agent;
    
    @Column(length = 100, nullable = false)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(length = 500)
    private String path;
    
    @Column(name = "`trigger`", length = 50)
    private String trigger;
    
    // 远程技能相关
    @Column(name = "is_remote")
    private Boolean isRemote = false;
    
    @Column(name = "source_url", length = 500)
    private String sourceUrl;
    
    @Column(name = "local_path", length = 500)
    private String localPath;
    
    @Column(name = "status", length = 20)
    private String status = "valid"; // valid, not-found
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

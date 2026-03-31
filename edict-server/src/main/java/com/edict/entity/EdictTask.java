package com.edict.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "edict_tasks")
@Data
public class EdictTask {
    
    @Id
    @Column(length = 50)
    private String id;
    
    @Column(length = 50)
    private String traceId;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(length = 2000)
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskState state = TaskState.ToDo;
    
    @Column(length = 50)
    private String org; // 负责部门/Agent
    
    @Column(length = 50)
    private String assigneeOrg; // 指派部门
    
    @Column(length = 50)
    private String creator;
    
    @Column(length = 10)
    private String priority = "中";
    
    @Column(length = 500)
    private String now; // 当前状态描述
    
    @Column(length = 100)
    private String eta; // 预计完成时间
    
    @Column(length = 500)
    private String block; // 阻塞原因
    
    @Column(length = 1000)
    private String ac; // 验收标准
    
    @Column(length = 2000)
    private String output; // 产出物
    
    @Column(name = "review_round")
    private Integer reviewRound = 0;
    
    @Column
    private Boolean archived = false;
    
    @Column(name = "archived_at")
    private LocalDateTime archivedAt;
    
    @Column(name = "heartbeat_status", length = 20)
    private String heartbeatStatus = "idle";
    
    @Column(name = "heartbeat_label", length = 100)
    private String heartbeatLabel = "等待开始";
    
    @Column(name = "prev_state", length = 20)
    private String prevState; // 用于恢复
    
    // Scheduler 相关
    @Column(name = "scheduler_retry_count")
    private Integer schedulerRetryCount = 0;
    
    @Column(name = "scheduler_escalation_level")
    private Integer schedulerEscalationLevel = 0;
    
    @Column(name = "scheduler_last_dispatch_status", length = 50)
    private String schedulerLastDispatchStatus;
    
    @Column(name = "scheduler_last_progress_at")
    private LocalDateTime schedulerLastProgressAt;
    
    @Column(name = "scheduler_last_dispatch_at")
    private LocalDateTime schedulerLastDispatchAt;
    
    @Column(name = "scheduler_last_dispatch_agent", length = 50)
    private String schedulerLastDispatchAgent;
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<FlowLog> flowLog = new ArrayList<>();
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ProgressLog> progressLog = new ArrayList<>();
    
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TaskTodo> todos = new ArrayList<>();
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum TaskState {
        ToDo, Doing, Review, Done, Blocked, Cancelled
    }
}

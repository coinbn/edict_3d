package com.edict.entity;

import lombok.Data;

import javax.persistence.*;

@Entity
@Table(name = "task_todos")
@Data
public class TaskTodo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private EdictTask task;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TodoStatus status = TodoStatus.not_started;
    
    @Column(length = 1000)
    private String detail;
    
    public enum TodoStatus {
        not_started, in_progress, completed
    }
}

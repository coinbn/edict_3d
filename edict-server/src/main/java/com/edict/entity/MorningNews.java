package com.edict.entity;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "morning_news")
@Data
public class MorningNews {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 50)
    private String category;
    
    @Column(nullable = false, length = 200)
    private String title;
    
    @Column(length = 1000)
    private String summary;
    
    @Column(length = 500)
    private String source;
    
    @Column(length = 500)
    private String link;
    
    @Column(length = 50)
    private String pubDate;
    
    @Column(nullable = false)
    private LocalDate newsDate; // 新闻日期
    
    @Column(length = 2000)
    private String rawContent; // 原始内容
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

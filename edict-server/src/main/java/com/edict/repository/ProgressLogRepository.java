package com.edict.repository;

import com.edict.entity.ProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgressLogRepository extends JpaRepository<ProgressLog, Long> {
    
    List<ProgressLog> findByTaskIdOrderByCreatedAtDesc(String taskId);
    
    List<ProgressLog> findByTaskIdAndAgentOrderByCreatedAtDesc(String taskId, String agent);
    
    List<ProgressLog> findTop20ByOrderByCreatedAtDesc();
}

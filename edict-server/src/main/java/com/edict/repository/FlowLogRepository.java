package com.edict.repository;

import com.edict.entity.FlowLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FlowLogRepository extends JpaRepository<FlowLog, Long> {
    
    List<FlowLog> findByTaskIdOrderByCreatedAtDesc(String taskId);
    
    List<FlowLog> findTop20ByOrderByCreatedAtDesc();
}

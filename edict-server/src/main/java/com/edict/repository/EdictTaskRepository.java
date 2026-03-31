package com.edict.repository;

import com.edict.entity.EdictTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EdictTaskRepository extends JpaRepository<EdictTask, String> {
    
    List<EdictTask> findByArchivedFalseOrderByUpdatedAtDesc();
    
    List<EdictTask> findByStateAndArchivedFalseOrderByUpdatedAtDesc(EdictTask.TaskState state);
    
    List<EdictTask> findByOrgAndArchivedFalseOrderByUpdatedAtDesc(String org);
    
    List<EdictTask> findByArchivedTrueOrderByArchivedAtDesc();
    
    @Query("SELECT t FROM EdictTask t WHERE t.archived = false AND (t.state = 'Done' OR t.state = 'Cancelled')")
    List<EdictTask> findDoneOrCancelledNotArchived();
    
    long countByState(EdictTask.TaskState state);
    
    long countByArchivedFalse();
}

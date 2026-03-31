package com.edict.repository;

import com.edict.entity.Subtitle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalTime;

@Repository
public interface SubtitleRepository extends JpaRepository<Subtitle, Long> {
    
    List<Subtitle> findByProjectIdOrderByStartTimeAsc(Long projectId);
    
    @Query("SELECT s FROM Subtitle s WHERE s.project.id = :projectId AND " +
           "((s.startTime <= :startTime AND s.endTime >= :startTime) OR " +
           " (s.startTime <= :endTime AND s.endTime >= :endTime) OR " +
           " (s.startTime >= :startTime AND s.endTime <= :endTime))")
    List<Subtitle> findOverlappingSubtitles(@Param("projectId") Long projectId,
                                            @Param("startTime") LocalTime startTime,
                                            @Param("endTime") LocalTime endTime);
    
    @Modifying
    @Query("DELETE FROM Subtitle s WHERE s.project.id = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
    
    long countByProjectId(Long projectId);
}

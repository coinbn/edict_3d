package com.edict.repository;

import com.edict.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    List<Project> findByStatusOrderByCreatedAtDesc(Project.ProjectStatus status);
    
    List<Project> findAllByOrderByUpdatedAtDesc();
    
    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.subtitles WHERE p.id = :id")
    Optional<Project> findByIdWithSubtitles(Long id);
}

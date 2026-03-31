package com.edict.repository;

import com.edict.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentRepository extends JpaRepository<Agent, String> {
    
    List<Agent> findAllByOrderByLabelAsc();
    
    List<Agent> findByStatus(Agent.AgentStatus status);
    
    Optional<Agent> findByLabel(String label);
}

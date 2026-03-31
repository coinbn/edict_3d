package com.edict.repository;

import com.edict.entity.AgentSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentSkillRepository extends JpaRepository<AgentSkill, Long> {
    
    List<AgentSkill> findByAgentId(String agentId);
    
    List<AgentSkill> findByIsRemoteTrue();
    
    Optional<AgentSkill> findByAgentIdAndName(String agentId, String name);
    
    void deleteByAgentIdAndName(String agentId, String name);
}

package com.edict.config;

import com.edict.entity.*;
import com.edict.repository.*;
import com.edict.service.MorningBriefService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final AgentRepository agentRepository;
    private final AgentSkillRepository skillRepository;
    private final EdictTaskRepository taskRepository;
    private final MorningBriefService morningBriefService;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing sample data...");

        // 确保所有 agent 存在并更新模型
        syncAgents();
        
        // 初始化任务（只在空表时执行）
        if (taskRepository.count() == 0) {
            initTasks();
        }

        // 禁用启动时采集早报（避免阻塞）
        // morningBriefService.refreshMorningBrief();

        log.info("Sample data initialized!");
    }
    
    private void syncAgents() {
        log.info("Skipping JSON read, using default agents");
        syncSkills();
    }
    
    private void syncSkills() {
        log.info("Skipping skills sync from JSON");
    }

    private void initTasks() {
        // 创建示例任务
    }

    private Agent createAgent(String id, String emoji, String label, String role, String model, int meritScore, int meritRank) {
        Agent agent = new Agent();
        agent.setId(id);
        agent.setEmoji(emoji);
        agent.setLabel(label);
        agent.setRole(role);
        agent.setModel(model);
        agent.setStatus(Agent.AgentStatus.idle);
        agent.setMeritScore(meritScore);
        agent.setMeritRank(meritRank);
        agent.setLastActive(LocalDateTime.now());
        agent.setTokensIn(100000L);
        agent.setTokensOut(50000L);
        agent.setSessions(10);
        agent.setMessages(100);
        agent.setTasksDone(5);
        agent.setTasksActive(0);
        agent.setCostCny(100.0);
        agent.setCostUsd(15.0);
        agentRepository.save(agent);
        return agent;
    }
}

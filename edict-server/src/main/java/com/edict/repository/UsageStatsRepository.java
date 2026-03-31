package com.edict.repository;

import com.edict.entity.UsageStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsageStatsRepository extends JpaRepository<UsageStats, Long> {
    
    Optional<UsageStats> findByStatDate(String statDate);
    
    List<UsageStats> findByStatDateBetweenOrderByStatDateAsc(String startDate, String endDate);
    
    @Query("SELECT COALESCE(SUM(u.totalTokens), 0) FROM UsageStats u WHERE u.statDate BETWEEN :startDate AND :endDate")
    Long sumTokensBetween(@Param("startDate") String startDate, @Param("endDate") String endDate);
    
    @Query("SELECT COALESCE(SUM(u.totalCost), 0) FROM UsageStats u WHERE u.statDate BETWEEN :startDate AND :endDate")
    Double sumCostBetween(@Param("startDate") String startDate, @Param("endDate") String endDate);
    
    @Query("SELECT COALESCE(SUM(u.messagesCount), 0) FROM UsageStats u WHERE u.statDate BETWEEN :startDate AND :endDate")
    Long sumMessagesBetween(@Param("startDate") String startDate, @Param("endDate") String endDate);
    
    @Query("SELECT MAX(u.activeSessions) FROM UsageStats u WHERE u.statDate = :date")
    Integer findMaxActiveSessionsByDate(@Param("date") String date);
}

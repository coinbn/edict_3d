package com.edict.repository;

import com.edict.entity.MorningNews;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MorningNewsRepository extends JpaRepository<MorningNews, Long> {
    
    List<MorningNews> findByNewsDateOrderByCategoryAscIdAsc(LocalDate newsDate);
    
    void deleteByNewsDate(LocalDate newsDate);
    
    long countByNewsDateAndCategory(LocalDate newsDate, String category);
}

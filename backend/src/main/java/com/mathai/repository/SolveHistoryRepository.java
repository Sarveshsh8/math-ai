package com.mathai.repository;

import com.mathai.model.SolveHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SolveHistoryRepository extends MongoRepository<SolveHistory, String> {
    List<SolveHistory> findByUserIdOrderBySolvedAtDesc(String userId);
}

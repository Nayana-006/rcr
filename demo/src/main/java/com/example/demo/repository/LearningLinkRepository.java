package com.example.demo.repository;

import com.example.demo.entity.LearningLink;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LearningLinkRepository extends JpaRepository<LearningLink, Long> {
    List<LearningLink> findByCourseId(Long courseId);
}

package com.example.demo.repository;

import com.example.demo.entity.StudentPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface StudentPerformanceRepository extends JpaRepository<StudentPerformance, Long> {
    Optional<StudentPerformance> findByStudentId(Long studentId);
}

package com.example.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginLogRepository extends JpaRepository<com.example.demo.entity.LoginLog, Long> {
    // Simple count of login entries for a student
    long countByStudentId(Long studentId);
}

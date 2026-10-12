package com.example.demo.repository;

import com.example.demo.entity.Assignment;
import com.example.demo.entity.Submission;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByAssignmentId(Long assignmentId);
    List<Submission> findByStudentId(Long studentId);
    boolean existsByAssignmentAndStudent(Assignment assignment, User student);
    Optional<Submission> findByAssignmentAndStudent(Assignment assignment, User student);
}

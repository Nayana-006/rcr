package com.example.demo.repository;

import com.example.demo.entity.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {
    List<CourseProgress> findByStudentId(Long studentId);
    Optional<CourseProgress> findByStudentIdAndCourseId(Long studentId, Long courseId);
}

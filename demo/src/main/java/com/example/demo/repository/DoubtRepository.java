package com.example.demo.repository;

import com.example.demo.entity.Doubt;
import com.example.demo.entity.DoubtStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoubtRepository extends JpaRepository<Doubt, Long> {
    List<Doubt> findByStudentId(Long studentId);
    List<Doubt> findByFacultyId(Long facultyId);
    List<Doubt> findByCourseId(Long courseId);
    List<Doubt> findByStatus(DoubtStatus status);
}

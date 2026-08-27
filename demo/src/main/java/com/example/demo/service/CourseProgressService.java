package com.example.demo.service;

import com.example.demo.dto.CourseProgressResponse;
import com.example.demo.entity.Course;
import com.example.demo.entity.CourseProgress;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CourseProgressRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.EnrollmentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseProgressService {

    private final CourseProgressRepository courseProgressRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public List<CourseProgressResponse> getProgressByStudent(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
        return courseProgressRepository.findByStudentId(studentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CourseProgressResponse getProgress(Long studentId, Long courseId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        return courseProgressRepository.findByStudentIdAndCourseId(studentId, courseId)
                .map(this::toResponse)
                .orElseGet(() -> CourseProgressResponse.builder()
                        .studentId(student.getId())
                        .studentName(student.getName())
                        .courseId(course.getId())
                        .courseTitle(course.getTitle())
                        .progressPercent(0)
                        .lastAccessed(null)
                        .build());
    }

    @Transactional
    public CourseProgressResponse markCourseOpened(Long studentId, Long courseId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));

        if (!enrollmentRepository.existsByStudentAndCourse(student, course)) {
            throw new IllegalArgumentException("Student is not enrolled in this course");
        }

        CourseProgress progress = courseProgressRepository.findByStudentIdAndCourseId(studentId, courseId)
                .orElseGet(() -> CourseProgress.builder()
                        .student(student)
                        .course(course)
                        .progressPercent(0)
                        .lastAccessed(Instant.now())
                        .build());

        progress.setProgressPercent(Math.max(progress.getProgressPercent(), 100));
        progress.setLastAccessed(Instant.now());
        return toResponse(courseProgressRepository.save(progress));
    }

    private CourseProgressResponse toResponse(CourseProgress progress) {
        return CourseProgressResponse.builder()
                .id(progress.getId())
                .studentId(progress.getStudent().getId())
                .studentName(progress.getStudent().getName())
                .courseId(progress.getCourse().getId())
                .courseTitle(progress.getCourse().getTitle())
                .progressPercent(progress.getProgressPercent())
                .lastAccessed(progress.getLastAccessed())
                .build();
    }
}

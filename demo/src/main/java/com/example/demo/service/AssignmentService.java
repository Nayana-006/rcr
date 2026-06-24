package com.example.demo.service;

import com.example.demo.dto.AssignmentRequest;
import com.example.demo.dto.AssignmentResponse;
import com.example.demo.entity.Assignment;
import com.example.demo.entity.Course;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AssignmentRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public List<AssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public AssignmentResponse getAssignmentById(Long id) {
        Assignment a = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));
        return toResponse(a);
    }

    @Transactional
    public AssignmentResponse createAssignment(AssignmentRequest request, Long facultyId) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));

        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + facultyId));

        if (!course.getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You can only create assignments for your own courses");
        }

        Assignment a = Assignment.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .course(course)
                .build();

        return toResponse(assignmentRepository.save(a));
    }

    @Transactional
    public AssignmentResponse updateAssignment(Long id, AssignmentRequest request, Long facultyId, boolean isAdmin) {
        Assignment a = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        if (!isAdmin && !a.getCourse().getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only update assignments for your own courses");
        }

        a.setTitle(request.getTitle());
        a.setDescription(request.getDescription());
        a.setDueDate(request.getDueDate());

        return toResponse(assignmentRepository.save(a));
    }

    @Transactional
    public void deleteAssignment(Long id, Long facultyId, boolean isAdmin) {
        Assignment a = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        if (!isAdmin && !a.getCourse().getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only delete assignments for your own courses");
        }

        assignmentRepository.delete(a);
    }

    public List<AssignmentResponse> getAssignmentsByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        return assignmentRepository.findByCourseId(courseId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    private AssignmentResponse toResponse(Assignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .description(a.getDescription())
                .dueDate(a.getDueDate())
                .createdAt(a.getCreatedAt())
                .courseId(a.getCourse().getId())
                .courseTitle(a.getCourse().getTitle())
                .build();
    }
}

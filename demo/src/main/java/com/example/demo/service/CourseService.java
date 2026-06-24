package com.example.demo.service;

import com.example.demo.dto.CourseRequest;
import com.example.demo.dto.CourseResponse;
import com.example.demo.entity.Course;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final com.example.demo.repository.LearningLinkRepository learningLinkRepository;

    public List<CourseResponse> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public CourseResponse getCourseById(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));
        return toResponse(course);
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest request, Long facultyId) {
        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + facultyId));

        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .faculty(faculty)
                .build();

        return toResponse(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request, Long facultyId, boolean isAdmin) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        if (!isAdmin && !course.getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only update your own courses");
        }

        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setThumbnailUrl(request.getThumbnailUrl());

        return toResponse(courseRepository.save(course));
    }

    @Transactional
    public void deleteCourse(Long id, Long facultyId, boolean isAdmin) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + id));

        if (!isAdmin && !course.getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only delete your own courses");
        }

        courseRepository.delete(course);
    }

    public List<CourseResponse> getCoursesByFacultyId(Long facultyId) {
        return courseRepository.findByFacultyId(facultyId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private CourseResponse toResponse(Course course) {
    java.util.List<com.example.demo.dto.LearningLinkResponse> links = learningLinkRepository.findByCourseId(course.getId())
        .stream()
        .map(l -> com.example.demo.dto.LearningLinkResponse.builder()
            .id(l.getId())
            .label(l.getLabel())
            .type(l.getType())
            .url(l.getUrl())
            .createdAt(l.getCreatedAt())
            .build())
        .toList();

    return CourseResponse.builder()
        .id(course.getId())
        .title(course.getTitle())
        .description(course.getDescription())
        .thumbnailUrl(course.getThumbnailUrl())
        .createdAt(course.getCreatedAt())
        .facultyId(course.getFaculty().getId())
        .facultyName(course.getFaculty().getName())
        .learningLinks(links)
        .build();
    }

    @Transactional
    public com.example.demo.dto.LearningLinkResponse addLearningLink(Long courseId, com.example.demo.dto.LearningLinkRequest req, Long facultyId, boolean isAdmin) {
    Course course = courseRepository.findById(courseId)
        .orElseThrow(() -> new com.example.demo.exception.ResourceNotFoundException("Course not found with id: " + courseId));

    if (!isAdmin && !course.getFaculty().getId().equals(facultyId)) {
        throw new IllegalArgumentException("You can only modify your own courses");
    }

    com.example.demo.entity.LearningLink link = com.example.demo.entity.LearningLink.builder()
        .label(req.getLabel())
        .type(req.getType())
        .url(req.getUrl())
        .course(course)
        .build();

    com.example.demo.entity.LearningLink saved = learningLinkRepository.save(link);

    return com.example.demo.dto.LearningLinkResponse.builder()
        .id(saved.getId())
        .label(saved.getLabel())
        .type(saved.getType())
        .url(saved.getUrl())
        .createdAt(saved.getCreatedAt())
        .build();
    }
}
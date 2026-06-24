package com.example.demo.service;

import com.example.demo.dto.DoubtRequest;
import com.example.demo.dto.DoubtResponse;
import com.example.demo.entity.Course;
import com.example.demo.entity.Doubt;
import com.example.demo.entity.DoubtStatus;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.DoubtRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoubtService {

    private final DoubtRepository doubtRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public DoubtResponse createDoubt(DoubtRequest req) {
        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + req.getStudentId()));

        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + req.getCourseId()));

        Doubt d = Doubt.builder()
                .title(req.getTitle())
                .message(req.getMessage())
                .student(student)
                .course(course)
                .build();

        return toResponse(doubtRepository.save(d));
    }

    @Transactional
    public DoubtResponse replyToDoubt(Long id, String replyMessage, Long facultyId) {
        Doubt d = doubtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doubt not found with id: " + id));

        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + facultyId));

        d.setFaculty(faculty);
        d.setMessage(d.getMessage() == null ? replyMessage : d.getMessage() + "\n\nReply:\n" + replyMessage);

        return toResponse(doubtRepository.save(d));
    }

    @Transactional
    public DoubtResponse resolveDoubt(Long id, Long facultyId) {
        Doubt d = doubtRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doubt not found with id: " + id));

        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + facultyId));

        d.setFaculty(faculty);
        d.setStatus(DoubtStatus.RESOLVED);

        return toResponse(doubtRepository.save(d));
    }

    public List<DoubtResponse> getDoubtsByStudent(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
        return doubtRepository.findByStudentId(studentId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DoubtResponse> getDoubtsByFaculty(Long facultyId) {
        if (!userRepository.existsById(facultyId)) {
            throw new ResourceNotFoundException("Faculty not found with id: " + facultyId);
        }
        Map<Long, Doubt> unique = new LinkedHashMap<>();
        for (Course course : courseRepository.findByFacultyId(facultyId)) {
            for (Doubt doubt : doubtRepository.findByCourseId(course.getId())) {
                unique.putIfAbsent(doubt.getId(), doubt);
            }
        }
        for (Doubt doubt : doubtRepository.findByFacultyId(facultyId)) {
            unique.putIfAbsent(doubt.getId(), doubt);
        }
        return unique.values().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<DoubtResponse> getDoubtsByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        return doubtRepository.findByCourseId(courseId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    private DoubtResponse toResponse(Doubt d) {
        return DoubtResponse.builder()
                .id(d.getId())
                .title(d.getTitle())
                .message(d.getMessage())
                .status(d.getStatus())
                .createdAt(d.getCreatedAt())
                .studentId(d.getStudent().getId())
                .studentName(d.getStudent().getName())
                .facultyId(d.getFaculty() == null ? null : d.getFaculty().getId())
                .facultyName(d.getFaculty() == null ? null : d.getFaculty().getName())
                .courseId(d.getCourse().getId())
                .courseTitle(d.getCourse().getTitle())
                .build();
    }
}

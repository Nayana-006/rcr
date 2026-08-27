package com.example.demo.service;

import com.example.demo.dto.AttendanceRequest;
import com.example.demo.dto.AttendanceResponse;
import com.example.demo.entity.Attendance;
import com.example.demo.entity.Course;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AttendanceRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @Transactional
    public AttendanceResponse markAttendance(AttendanceRequest req) {
        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + req.getStudentId()));

        User faculty = userRepository.findById(req.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty not found with id: " + req.getFacultyId()));

        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + req.getCourseId()));

        LocalDate date = req.getDate();
        var existing = attendanceRepository.findByStudentIdAndCourseIdAndDate(student.getId(), course.getId(), date);
        if (existing.isPresent()) {
            Attendance attendance = existing.get();
            attendance.setPresent(req.getPresent());
            attendance.setFaculty(faculty);
            return toResponse(attendanceRepository.save(attendance));
        }

        Attendance a = Attendance.builder()
                .student(student)
                .faculty(faculty)
                .course(course)
                .date(date)
                .present(req.getPresent())
                .build();

        return toResponse(attendanceRepository.save(a));
    }

    @Transactional
    public AttendanceResponse updateAttendance(Long id, AttendanceRequest req, Long facultyId, boolean isAdmin) {
        Attendance a = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance not found with id: " + id));

        if (!isAdmin && !a.getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only update attendance you created");
        }

        a.setPresent(req.getPresent());
        return toResponse(attendanceRepository.save(a));
    }

    public List<AttendanceResponse> getAttendanceByStudent(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
        return attendanceRepository.findByStudentId(studentId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<AttendanceResponse> getAttendanceByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        return attendanceRepository.findByCourseId(courseId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public double getAttendancePercentage(Long studentId) {
        List<Attendance> records = attendanceRepository.findByStudentId(studentId);
        if (records.isEmpty()) return 0.0;
        long present = records.stream().filter(Attendance::isPresent).count();
        return (present * 100.0) / records.size();
    }

    private AttendanceResponse toResponse(Attendance a) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .date(a.getDate())
                .present(a.isPresent())
                .createdAt(a.getCreatedAt())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getName())
                .courseId(a.getCourse().getId())
                .courseTitle(a.getCourse().getTitle())
                .facultyId(a.getFaculty().getId())
                .facultyName(a.getFaculty().getName())
                .build();
    }
}

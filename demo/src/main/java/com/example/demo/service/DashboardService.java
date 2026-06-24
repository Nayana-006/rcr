package com.example.demo.service;

import com.example.demo.dto.AdminDashboardResponse;
import com.example.demo.dto.FacultyDashboardResponse;
import com.example.demo.dto.StudentDashboardResponse;
import com.example.demo.entity.DoubtStatus;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final AttendanceRepository attendanceRepository;
    private final DoubtRepository doubtRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public StudentDashboardResponse getStudentDashboard(Long studentId) {
        long totalEnrolledCourses = enrollmentRepository.findByStudentId(studentId).size();
        long totalAssignments = assignmentRepository.findByCourseIdIn(
                enrollmentRepository.findByStudentId(studentId).stream().map(e -> e.getCourse().getId()).toList()
        ).size();

        long submittedAssignments = submissionRepository.findByStudentId(studentId).size();
        long pendingAssignments = totalAssignments - submittedAssignments;

        double attendancePercentage = attendanceRepository.findByStudentId(studentId).stream()
                .collect(java.util.stream.Collectors.teeing(
                        java.util.stream.Collectors.filtering(a -> a.isPresent(), java.util.stream.Collectors.counting()),
                        java.util.stream.Collectors.counting(),
                        (present, total) -> total == 0 ? 0.0 : (present * 100.0) / total
                ));

        long totalDoubtsRaised = doubtRepository.findByStudentId(studentId).size();
        long totalNotifications = notificationRepository.findByUserId(studentId).size();

        return StudentDashboardResponse.builder()
                .totalEnrolledCourses(totalEnrolledCourses)
                .totalAssignments(totalAssignments)
                .submittedAssignments(submittedAssignments)
                .pendingAssignments(pendingAssignments)
                .attendancePercentage(attendancePercentage)
                .totalDoubtsRaised(totalDoubtsRaised)
                .totalNotifications(totalNotifications)
                .build();
    }

    public FacultyDashboardResponse getFacultyDashboard(Long facultyId) {
        long totalCoursesCreated = courseRepository.findByFacultyId(facultyId).size();

        // total students across those courses (unique)
        var courseIds = courseRepository.findByFacultyId(facultyId).stream().map(c -> c.getId()).toList();
        var enrollments = enrollmentRepository.findAll().stream().filter(e -> courseIds.contains(e.getCourse().getId())).toList();
        long totalStudents = enrollments.stream().map(e -> e.getStudent().getId()).distinct().count();

        long totalAssignments = assignmentRepository.findByCourseIdIn(courseIds).size();

        long totalSubmissions = submissionRepository.findAll().stream().filter(s -> courseIds.contains(s.getAssignment().getCourse().getId())).count();

        long totalAttendanceRecords = attendanceRepository.findByFacultyId(facultyId).size();

        long totalDoubts = doubtRepository.findByFacultyId(facultyId).size();

        // notifications for faculty user
        long totalNotifications = notificationRepository.findByUserId(facultyId).size();

        return FacultyDashboardResponse.builder()
                .totalCoursesCreated(totalCoursesCreated)
                .totalStudents(totalStudents)
                .totalAssignments(totalAssignments)
                .totalSubmissions(totalSubmissions)
                .totalAttendanceRecords(totalAttendanceRecords)
                .totalDoubts(totalDoubts)
                .totalNotifications(totalNotifications)
                .build();
    }

    public AdminDashboardResponse getAdminDashboard() {
        long totalStudents = userRepository.findAll().stream().filter(u -> u.getRole().name().equals("STUDENT")).count();
        long totalFaculty = userRepository.findAll().stream().filter(u -> u.getRole().name().equals("FACULTY")).count();
        long totalCourses = courseRepository.count();
        long totalEnrollments = enrollmentRepository.count();
        long totalAssignments = assignmentRepository.count();
        long totalSubmissions = submissionRepository.count();
        long totalAttendanceRecords = attendanceRepository.count();
        long totalDoubts = doubtRepository.count();
        long totalNotifications = notificationRepository.count();

        return AdminDashboardResponse.builder()
                .totalStudents(totalStudents)
                .totalFaculty(totalFaculty)
                .totalCourses(totalCourses)
                .totalEnrollments(totalEnrollments)
                .totalAssignments(totalAssignments)
                .totalSubmissions(totalSubmissions)
                .totalAttendanceRecords(totalAttendanceRecords)
                .totalDoubts(totalDoubts)
                .totalNotifications(totalNotifications)
                .build();
    }
}

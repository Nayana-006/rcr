package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminDashboardResponse {
    private long totalStudents;
    private long totalFaculty;
    private long totalCourses;
    private long totalEnrollments;
    private long totalAssignments;
    private long totalSubmissions;
    private long totalAttendanceRecords;
    private long totalDoubts;
    private long totalNotifications;
}

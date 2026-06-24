package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FacultyDashboardResponse {
    private long totalCoursesCreated;
    private long totalStudents;
    private long totalAssignments;
    private long totalSubmissions;
    private long totalAttendanceRecords;
    private long totalDoubts;
    private long totalNotifications;
}

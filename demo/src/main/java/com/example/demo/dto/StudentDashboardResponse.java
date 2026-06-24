package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentDashboardResponse {
    private long totalEnrolledCourses;
    private long totalAssignments;
    private long submittedAssignments;
    private long pendingAssignments;
    private double attendancePercentage;
    private long totalDoubtsRaised;
    private long totalNotifications;
}

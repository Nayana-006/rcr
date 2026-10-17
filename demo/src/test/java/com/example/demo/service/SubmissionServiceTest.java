package com.example.demo.service;

import com.example.demo.dto.SubmissionRequest;
import com.example.demo.entity.Assignment;
import com.example.demo.entity.Course;
import com.example.demo.entity.Role;
import com.example.demo.entity.Submission;
import com.example.demo.entity.SubmissionStatus;
import com.example.demo.entity.User;
import com.example.demo.repository.AssignmentRepository;
import com.example.demo.repository.EnrollmentRepository;
import com.example.demo.repository.SubmissionRepository;
import com.example.demo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {
    @Mock private SubmissionRepository submissionRepository;
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private EnrollmentRepository enrollmentRepository;

    private SubmissionService service;
    private User faculty;
    private User anotherFaculty;
    private User student;
    private Course course;
    private Assignment assignment;

    @BeforeEach
    void setup() {
        service = new SubmissionService(submissionRepository, assignmentRepository, userRepository, enrollmentRepository);
        faculty = user(1L, Role.FACULTY);
        anotherFaculty = user(2L, Role.FACULTY);
        student = user(3L, Role.STUDENT);
        course = Course.builder().id(10L).title("Math").faculty(faculty).build();
        assignment = Assignment.builder().id(20L).title("Algebra").course(course)
                .maxMarks(25.0).dueDate(Instant.now().plusSeconds(3600)).build();
    }

    @Test
    void enrolledStudentSubmitsAndResubmitsSameRecordClearingGradeAndFeedback() {
        stubEligibleSubmission();
        SubmissionRequest request = request("First answer");
        var first = service.submitAssignment(request, student);
        assertEquals("First answer", first.getAnswerText());
        ArgumentCaptor<Submission> captor = ArgumentCaptor.forClass(Submission.class);
        verify(submissionRepository).save(captor.capture());
        Submission stored = captor.getValue();
        stored.setId(5L);
        stored.setGrade(20.0);
        stored.setFeedback("Review this");
        stored.setGradedAt(Instant.now());
        when(submissionRepository.findByAssignmentAndStudent(assignment, student)).thenReturn(Optional.of(stored));

        var updated = service.submitAssignment(request("Revised answer"), student);
        assertEquals(5L, updated.getId());
        assertEquals("Revised answer", updated.getAnswerText());
        assertNull(updated.getGrade());
        assertNull(updated.getFeedback());
        assertNull(updated.getGradedAt());
        verify(submissionRepository, times(2)).save(any());
    }

    @Test
    void lateSubmissionsFollowAssignmentPolicyAndAreMarkedLate() {
        stubEligibleSubmission();
        assignment.setDueDate(Instant.now().minusSeconds(10));
        assertThrows(IllegalArgumentException.class, () -> service.submitAssignment(request("Late"), student));
        assignment.setAllowLateSubmission(true);
        assertTrue(service.submitAssignment(request("Late"), student).getLate());
    }

    @Test
    void studentMustBeEnrolledAndCannotReadAnotherStudentsSubmission() {
        when(assignmentRepository.findById(20L)).thenReturn(Optional.of(assignment));
        when(enrollmentRepository.existsByStudentAndCourse(student, course)).thenReturn(false);
        assertThrows(AccessDeniedException.class, () -> service.submitAssignment(request("Answer"), student));
        assertThrows(AccessDeniedException.class, () -> service.getSubmissionsByStudent(99L, student));
    }

    @Test
    void marksAreBoundedAndOnlyOwningFacultyCanGrade() {
        Submission submission = Submission.builder().id(5L).assignment(assignment).student(student)
                .submittedAt(Instant.now()).status(SubmissionStatus.SUBMITTED).answerText("answer").build();
        when(submissionRepository.findById(5L)).thenReturn(Optional.of(submission));
        stubSubmissionSave();
        assertThrows(AccessDeniedException.class, () -> service.gradeSubmission(5L, 10.0, "x", anotherFaculty));
        assertThrows(IllegalArgumentException.class, () -> service.gradeSubmission(5L, -1.0, "x", faculty));
        assertThrows(IllegalArgumentException.class, () -> service.gradeSubmission(5L, 26.0, "x", faculty));
        var graded = service.gradeSubmission(5L, 24.0, "Well done", faculty);
        assertEquals(24.0, graded.getGrade(), 0.0001);
        assertEquals("answer", graded.getAnswerText());
        assertEquals("Well done", graded.getFeedback());
        assertNotNull(graded.getGradedAt());
    }

    @Test
    void facultyTrackingIncludesEnrolledStudentsWhoHaveNotSubmitted() {
        User secondStudent = user(4L, Role.STUDENT);
        var firstEnrollment = com.example.demo.entity.Enrollment.builder().student(student).course(course).build();
        var secondEnrollment = com.example.demo.entity.Enrollment.builder().student(secondStudent).course(course).build();
        Submission existing = Submission.builder().id(6L).assignment(assignment).student(student)
                .submittedAt(Instant.now()).status(SubmissionStatus.SUBMITTED).answerText("answer").late(false).build();
        when(assignmentRepository.findById(20L)).thenReturn(Optional.of(assignment));
        when(enrollmentRepository.findByCourseId(10L)).thenReturn(java.util.List.of(firstEnrollment, secondEnrollment));
        when(submissionRepository.findByAssignmentId(20L)).thenReturn(java.util.List.of(existing));

        var tracking = service.getAssignmentTracking(20L, faculty);
        assertEquals(2, tracking.size());
        assertTrue(tracking.get(0).isSubmitted());
        assertFalse(tracking.get(1).isSubmitted());
        assertEquals("NOT_SUBMITTED", tracking.get(1).getStatus());
    }

    private void stubEligibleSubmission() {
        when(assignmentRepository.findById(20L)).thenReturn(Optional.of(assignment));
        when(enrollmentRepository.existsByStudentAndCourse(student, course)).thenReturn(true);
        stubSubmissionSave();
    }

    private void stubSubmissionSave() {
        when(submissionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private SubmissionRequest request(String answer) {
        SubmissionRequest request = new SubmissionRequest();
        request.setAssignmentId(20L);
        request.setAnswerText(answer);
        return request;
    }

    private static User user(Long id, Role role) {
        return User.builder().id(id).name("User " + id).email("u" + id + "@example.test").role(role).build();
    }
}

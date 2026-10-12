package com.example.demo.service;

import com.example.demo.dto.AssignmentTrackingResponse;
import com.example.demo.dto.SubmissionRequest;
import com.example.demo.dto.SubmissionResponse;
import com.example.demo.entity.Assignment;
import com.example.demo.entity.Course;
import com.example.demo.entity.Role;
import com.example.demo.entity.Submission;
import com.example.demo.entity.SubmissionStatus;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AssignmentRepository;
import com.example.demo.repository.EnrollmentRepository;
import com.example.demo.repository.SubmissionRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionService {
    private static final double LEGACY_DEFAULT_MAX_MARKS = 100.0;

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional
    public SubmissionResponse submitAssignment(SubmissionRequest request, User actor) {
        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        User student = resolveStudent(request, actor);
        if (student.getRole() != Role.STUDENT
                || !enrollmentRepository.existsByStudentAndCourse(student, assignment.getCourse())) {
            throw new AccessDeniedException("Access denied");
        }

        Instant now = Instant.now();
        boolean late = assignment.getDueDate() != null && now.isAfter(assignment.getDueDate());
        if (late && !Boolean.TRUE.equals(assignment.getAllowLateSubmission())) {
            throw new IllegalArgumentException("The submission deadline has passed");
        }
        String answer = request.getAnswerText() != null ? request.getAnswerText() : request.getFeedback();
        if (answer == null || answer.isBlank()) throw new IllegalArgumentException("Answer text is required");

        Submission submission = submissionRepository.findByAssignmentAndStudent(assignment, student)
                .orElseGet(() -> Submission.builder().assignment(assignment).student(student).build());
        submission.setAnswerText(answer.trim());
        submission.setSubmittedAt(now);
        submission.setLate(late);
        submission.setStatus(late ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED);
        submission.setGrade(null);
        submission.setFeedback(null);
        submission.setGradedAt(null);
        return toResponse(submissionRepository.save(submission));
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByAssignment(Long assignmentId, User actor) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        ensureCanManage(assignment.getCourse(), actor);
        return submissionRepository.findByAssignmentId(assignmentId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AssignmentTrackingResponse> getAssignmentTracking(Long assignmentId, User actor) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        ensureCanManage(assignment.getCourse(), actor);
        Map<Long, Submission> byStudent = submissionRepository.findByAssignmentId(assignmentId).stream()
                .collect(Collectors.toMap(s -> s.getStudent().getId(), Function.identity()));
        return enrollmentRepository.findByCourseId(assignment.getCourse().getId()).stream()
                .map(enrollment -> {
                    User student = enrollment.getStudent();
                    Submission submission = byStudent.get(student.getId());
                    return AssignmentTrackingResponse.builder()
                            .studentId(student.getId()).studentName(student.getName())
                            .submitted(submission != null)
                            .status(submission == null ? "NOT_SUBMITTED" : submission.getStatus().name())
                            .submittedAt(submission == null ? null : submission.getSubmittedAt())
                            .answerText(submission == null ? null : legacyAnswer(submission))
                            .late(submission != null && Boolean.TRUE.equals(submission.getLate()))
                            .grade(submission == null ? null : submission.getGrade())
                            .feedback(submission == null ? null : submission.getFeedback())
                            .gradedAt(submission == null ? null : submission.getGradedAt())
                            .build();
                }).toList();
    }

    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByStudent(Long studentId, User actor) {
        if (actor.getRole() == Role.STUDENT && !actor.getId().equals(studentId)) {
            throw new AccessDeniedException("Access denied");
        }
        if (actor.getRole() != Role.STUDENT && actor.getRole() != Role.FACULTY && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        List<Submission> submissions = submissionRepository.findByStudentId(studentId);
        if (actor.getRole() == Role.FACULTY) {
            submissions = submissions.stream()
                    .filter(s -> s.getAssignment().getCourse().getFaculty().getId().equals(actor.getId())).toList();
        }
        return submissions.stream().map(this::toResponse).toList();
    }

    @Transactional
    public SubmissionResponse gradeSubmission(Long submissionId, Double grade, String feedback, User grader) {
        if (grader.getRole() != Role.FACULTY && grader.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));
        ensureCanManage(submission.getAssignment().getCourse(), grader);
        double maxMarks = submission.getAssignment().getMaxMarks() == null
                ? LEGACY_DEFAULT_MAX_MARKS : submission.getAssignment().getMaxMarks();
        if (grade == null || !Double.isFinite(grade) || grade < 0 || grade > maxMarks) {
            throw new IllegalArgumentException("Marks must be between 0 and the assignment maximum");
        }
        if (feedback != null && feedback.length() > 2000) {
            throw new IllegalArgumentException("Feedback must be at most 2000 characters");
        }
        submission.setGrade(grade);
        submission.setFeedback(feedback);
        submission.setGradedAt(Instant.now());
        submission.setStatus(SubmissionStatus.GRADED);
        return toResponse(submissionRepository.save(submission));
    }

    private User resolveStudent(SubmissionRequest request, User actor) {
        if (actor.getRole() == Role.STUDENT) return actor;
        if (actor.getRole() != Role.ADMIN || request.getStudentId() == null) {
            throw new AccessDeniedException("Access denied");
        }
        return userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
    }

    private void ensureCanManage(Course course, User actor) {
        if (actor.getRole() != Role.ADMIN
                && (actor.getRole() != Role.FACULTY || !course.getFaculty().getId().equals(actor.getId()))) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private String legacyAnswer(Submission submission) {
        if (submission.getAnswerText() != null) return submission.getAnswerText();
        // Before answerText existed, ungraded submissions stored answers in feedback.
        return submission.getGrade() == null && submission.getStatus() != SubmissionStatus.GRADED
                ? submission.getFeedback() : null;
    }

    private SubmissionResponse toResponse(Submission s) {
        return SubmissionResponse.builder()
                .id(s.getId()).submittedAt(s.getSubmittedAt()).answerText(legacyAnswer(s))
                .status(s.getStatus().name()).grade(s.getGrade()).gradedAt(s.getGradedAt())
                .late(Boolean.TRUE.equals(s.getLate()))
                .feedback(s.getGrade() == null && s.getStatus() != SubmissionStatus.GRADED
                        ? null : s.getFeedback())
                .assignmentId(s.getAssignment().getId()).assignmentTitle(s.getAssignment().getTitle())
                .studentId(s.getStudent().getId()).studentName(s.getStudent().getName())
                .studentEmail(s.getStudent().getEmail()).build();
    }
}

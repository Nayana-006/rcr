package com.example.demo.service;

import com.example.demo.dto.SubmissionRequest;
import com.example.demo.dto.SubmissionResponse;
import com.example.demo.entity.Assignment;
import com.example.demo.entity.Submission;
import com.example.demo.entity.SubmissionStatus;
import com.example.demo.entity.User;
import com.example.demo.exception.DuplicateResourceException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AssignmentRepository;
import com.example.demo.repository.SubmissionRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public SubmissionResponse submitAssignment(SubmissionRequest request) {
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.getStudentId()));

        Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + request.getAssignmentId()));

        if (submissionRepository.existsByAssignmentAndStudent(assignment, student)) {
            throw new DuplicateResourceException("Student has already submitted this assignment");
        }

        Submission s = Submission.builder()
                .assignment(assignment)
                .student(student)
                .feedback(request.getFeedback())
                .build();

        return toResponse(submissionRepository.save(s));
    }

    public List<SubmissionResponse> getSubmissionsByAssignment(Long assignmentId) {
        if (!assignmentRepository.existsById(assignmentId)) {
            throw new ResourceNotFoundException("Assignment not found with id: " + assignmentId);
        }
        return submissionRepository.findByAssignmentId(assignmentId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<SubmissionResponse> getSubmissionsByStudent(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
        return submissionRepository.findByStudentId(studentId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public SubmissionResponse gradeSubmission(Long submissionId, Double grade, String feedback, Long graderId) {
        Submission s = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + submissionId));

        // Optionally, in controller/service validate grader is faculty for the course

        s.setGrade(grade);
        s.setFeedback(feedback);
        s.setStatus(SubmissionStatus.GRADED);

        return toResponse(submissionRepository.save(s));
    }

    private SubmissionResponse toResponse(Submission s) {
        return SubmissionResponse.builder()
                .id(s.getId())
                .submittedAt(s.getSubmittedAt())
                .status(s.getStatus().name())
                .grade(s.getGrade())
                .feedback(s.getFeedback())
                .assignmentId(s.getAssignment().getId())
                .assignmentTitle(s.getAssignment().getTitle())
                .studentId(s.getStudent().getId())
                .studentName(s.getStudent().getName())
                .studentEmail(s.getStudent().getEmail())
                .build();
    }
}

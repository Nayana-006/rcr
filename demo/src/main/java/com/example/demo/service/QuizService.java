package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public List<QuizResponse> getQuizzesByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with id: " + courseId);
        }
        return quizRepository.findByCourseId(courseId).stream()
                .map(this::toQuizResponse)
                .collect(Collectors.toList());
    }

    public QuizResponse getQuizById(Long id) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));
        return toQuizResponse(quiz);
    }

    @Transactional
    public QuizResponse createQuiz(QuizRequest request, Long facultyId) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + request.getCourseId()));

        User faculty = userRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + facultyId));

        if (faculty.getRole() == Role.FACULTY && !course.getFaculty().getId().equals(faculty.getId())) {
            throw new IllegalArgumentException("You can only create quizzes for your own courses");
        }

        Quiz quiz = Quiz.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .totalMarks(request.getTotalMarks())
                .course(course)
                .build();

        return toQuizResponse(quizRepository.save(quiz));
    }

    @Transactional
    public QuizResponse updateQuiz(Long id, QuizRequest request, Long facultyId, boolean isAdmin) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));

        if (!isAdmin && !quiz.getCourse().getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only update quizzes for your own courses");
        }

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setDurationMinutes(request.getDurationMinutes());
        quiz.setTotalMarks(request.getTotalMarks());

        return toQuizResponse(quizRepository.save(quiz));
    }

    @Transactional
    public void deleteQuiz(Long id, Long facultyId, boolean isAdmin) {
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + id));

        if (!isAdmin && !quiz.getCourse().getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only delete quizzes for your own courses");
        }

        quizRepository.delete(quiz);
    }

    // Question management
    public List<QuizQuestionResponse> getQuestionsByQuiz(Long quizId) {
        if (!quizRepository.existsById(quizId)) {
            throw new ResourceNotFoundException("Quiz not found with id: " + quizId);
        }
        return quizQuestionRepository.findByQuizId(quizId).stream()
                .map(this::toQuestionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuizQuestionResponse addQuestion(Long quizId, QuizQuestionRequest req, Long facultyId, boolean isAdmin) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

        if (!isAdmin && !quiz.getCourse().getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only add questions to quizzes for your own courses");
        }

        QuizQuestion q = QuizQuestion.builder()
                .questionText(req.getQuestionText())
                .optionA(req.getOptionA())
                .optionB(req.getOptionB())
                .optionC(req.getOptionC())
                .optionD(req.getOptionD())
                .correctOption(req.getCorrectOption().toUpperCase())
                .marks(req.getMarks())
                .quiz(quiz)
                .build();

        return toQuestionResponse(quizQuestionRepository.save(q));
    }

    @Transactional
    public void deleteQuestion(Long questionId, Long facultyId, boolean isAdmin) {
        QuizQuestion q = quizQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

        if (!isAdmin && !q.getQuiz().getCourse().getFaculty().getId().equals(facultyId)) {
            throw new IllegalArgumentException("You can only delete questions from quizzes for your own courses");
        }

        quizQuestionRepository.delete(q);
    }

    // Quiz Attempt and Auto-Grading
    @Transactional
    public QuizAttemptResponse submitAttempt(Long quizId, QuizAttemptRequest req) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found with id: " + quizId));

        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + req.getStudentId()));

        List<QuizQuestion> questions = quizQuestionRepository.findByQuizId(quizId);

        // Parse student answers
        Map<String, String> studentAnswers = new HashMap<>();
        try {
            studentAnswers = objectMapper.readValue(req.getAnswersJson(), new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            // If parsing fails, treat it as empty or invalid submission
        }

        int score = 0;
        int totalQuizMarks = 0;

        for (QuizQuestion q : questions) {
            totalQuizMarks += q.getMarks();
            String submittedOption = studentAnswers.get(q.getId().toString());
            if (submittedOption != null && submittedOption.trim().equalsIgnoreCase(q.getCorrectOption())) {
                score += q.getMarks();
            }
        }

        // If the quiz's specified total marks differ from the sum of questions, use the sum or the specified.
        // Let's use the sum of all questions as the total marks for this attempt, or quiz totalMarks.
        int quizTotalMarks = quiz.getTotalMarks() > 0 ? quiz.getTotalMarks() : totalQuizMarks;

        QuizAttempt attempt = QuizAttempt.builder()
                .quiz(quiz)
                .student(student)
                .score(score)
                .totalMarks(quizTotalMarks)
                .answersJson(req.getAnswersJson())
                .build();

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);
        return toAttemptResponse(savedAttempt);
    }

    public List<QuizAttemptResponse> getAttemptsByStudent(Long studentId) {
        return quizAttemptRepository.findByStudentId(studentId).stream()
                .map(this::toAttemptResponse)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponse> getAttemptsByQuiz(Long quizId) {
        return quizAttemptRepository.findByQuizId(quizId).stream()
                .map(this::toAttemptResponse)
                .collect(Collectors.toList());
    }

    public List<QuizAttemptResponse> getAttemptsByQuizAndStudent(Long quizId, Long studentId) {
        return quizAttemptRepository.findByQuizIdAndStudentId(quizId, studentId).stream()
                .map(this::toAttemptResponse)
                .collect(Collectors.toList());
    }

    // Mapper helpers
    private QuizResponse toQuizResponse(Quiz q) {
        return QuizResponse.builder()
                .id(q.getId())
                .title(q.getTitle())
                .description(q.getDescription())
                .durationMinutes(q.getDurationMinutes())
                .totalMarks(q.getTotalMarks())
                .createdAt(q.getCreatedAt())
                .courseId(q.getCourse().getId())
                .courseTitle(q.getCourse().getTitle())
                .build();
    }

    private QuizQuestionResponse toQuestionResponse(QuizQuestion q) {
        return QuizQuestionResponse.builder()
                .id(q.getId())
                .questionText(q.getQuestionText())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .correctOption(q.getCorrectOption())
                .marks(q.getMarks())
                .quizId(q.getQuiz().getId())
                .build();
    }

    private QuizAttemptResponse toAttemptResponse(QuizAttempt a) {
        return QuizAttemptResponse.builder()
                .id(a.getId())
                .quizId(a.getQuiz().getId())
                .quizTitle(a.getQuiz().getTitle())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getName())
                .score(a.getScore())
                .totalMarks(a.getTotalMarks())
                .attemptedAt(a.getAttemptedAt())
                .answersJson(a.getAnswersJson())
                .build();
    }
}

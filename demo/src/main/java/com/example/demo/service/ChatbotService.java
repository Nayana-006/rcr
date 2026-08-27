package com.example.demo.service;

import com.example.demo.dto.ChatRequest;
import com.example.demo.dto.ChatResponse;
import com.example.demo.entity.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.EnrollmentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional
    public ChatResponse processMessage(ChatRequest req) {
        User student = userRepository.findById(req.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + req.getStudentId()));

        // 1. Save student's user message
        ChatMessage userMsg = ChatMessage.builder()
                .content(req.getMessage())
                .sender("USER")
                .student(student)
                .build();
        chatMessageRepository.save(userMsg);

        // 2. Generate chatbot reply
        String reply = generateReply(req.getMessage().toLowerCase().trim(), student);

        // 3. Save bot's reply message
        ChatMessage botMsg = ChatMessage.builder()
                .content(reply)
                .sender("BOT")
                .student(student)
                .build();
        chatMessageRepository.save(botMsg);

        return ChatResponse.builder()
                .reply(reply)
                .studentId(student.getId())
                .sender("BOT")
                .createdAt(Instant.now())
                .build();
    }

    public List<ChatMessage> getHistory(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
        return chatMessageRepository.findByStudentIdOrderByCreatedAtAsc(studentId);
    }

    @Transactional
    public void clearHistory(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student not found with id: " + studentId);
        }
        chatMessageRepository.deleteByStudentId(studentId);
    }

    // Smart Rule-based Keyword Matching (LLM-ready wrapper)
    private String generateReply(String msg, User student) {
        if (msg.contains("hello") || msg.contains("hi ") || msg.equals("hi") || msg.contains("hey")) {
            return "Hello " + student.getName() + "! Welcome to your Remote Classroom Assistant. How can I help you today?";
        }

        if (msg.contains("offline") || msg.contains("internet") || msg.contains("network") || msg.contains("connectivity")) {
            return "RCR Platform has a robust **Rural Offline Mode**. You can download notes, assignments, and quizzes while connected. Once offline, you can continue learning. All quiz attempts and study progress are stored on your device and will sync automatically when your internet connection is restored!";
        }

        if (msg.contains("sync") || msg.contains("synchronize") || msg.contains("connection")) {
            return "Our synchronization system monitors your network. In offline mode, a status banner will show 'Offline'. When your network returns, click 'Sync Now' in the offline status bar, or let the platform auto-sync your completed quizzes and progress logs.";
        }

        if (msg.contains("course") || msg.contains("class") || msg.contains("learn")) {
            List<Enrollment> enrolls = enrollmentRepository.findByStudentId(student.getId());
            if (enrolls.isEmpty()) {
                return "You are not enrolled in any courses yet. Go to the 'Available Courses' page to browse and enroll!";
            }
            String coursesList = enrolls.stream()
                    .map(e -> "- " + e.getCourse().getTitle())
                    .collect(Collectors.joining("\n"));
            return "You are currently enrolled in:\n" + coursesList + "\n\nYou can access course materials, download notes, and watch recorded lectures on your 'My Courses' tab.";
        }

        if (msg.contains("assignment") || msg.contains("homework") || msg.contains("submit")) {
            return "To view or submit your homework, go to the **Assignments** tab in your sidebar. You can type text-only answers and submit them directly. Your faculty will grade them and provide feedback.";
        }

        if (msg.contains("quiz") || msg.contains("exam") || msg.contains("test")) {
            return "Navigate to the **Quizzes** tab in the sidebar to take multiple-choice quizzes created by your faculty. Each quiz has a timer, and your score will be calculated and graded automatically upon submission.";
        }

        if (msg.contains("doubt") || msg.contains("ask") || msg.contains("question")) {
            return "Stuck on a topic? You can go to the **Doubts & Replies** page, select a course, and post a question. Your course faculty will be notified and will reply to guide you.";
        }

        if (msg.contains("help") || msg.contains("guide") || msg.contains("support")) {
            return "Here are the topics I can help you with:\n" +
                    "1. **Offline Learning** (keywords: offline, sync, internet)\n" +
                    "2. **Courses** (keywords: course, lectures)\n" +
                    "3. **Assignments** (keywords: assignment, submit)\n" +
                    "4. **Quizzes** (keywords: quiz, test)\n" +
                    "5. **Doubts** (keywords: doubt, question)\n" +
                    "Just ask me anything!";
        }

        // Fallback
        return "I'm not sure I fully understand. You can ask me about 'offline mode', 'my courses', 'assignments', 'quizzes', or type 'help' for a full list of guide topics.";
    }
}

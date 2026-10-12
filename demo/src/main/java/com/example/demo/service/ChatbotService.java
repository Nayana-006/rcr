package com.example.demo.service;

import com.example.demo.dto.ChatRequest;
import com.example.demo.dto.ChatResponse;
import com.example.demo.entity.*;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatbotService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    @Value("${openai.model:gpt-3.5-turbo}")
    private String openAiModel;

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

        // 2. Generate chatbot reply via OpenAI
        String reply = generateReplyFromLLM(req.getMessage(), student);

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

    private String generateReplyFromLLM(String msg, User student) {
        if (openAiApiKey == null || openAiApiKey.trim().isEmpty()) {
            return generateLocalReply(msg);
        }

        RestTemplate restTemplate = new RestTemplate();
        String url = "https://api.openai.com/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openAiApiKey);

        String systemPrompt = "You are an AI educational assistant for a remote learning platform. " +
                "Your goal is to help student '" + student.getName() + "' understand academic concepts clearly. " +
                "Explain difficult concepts in clear, student-friendly language. " +
                "Do not invent facts if you do not know the answer.";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", openAiModel);
        requestBody.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", msg)
        ));
        requestBody.put("max_tokens", 500);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            @SuppressWarnings("unchecked")
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) body.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            return "Error: Could not parse response from AI provider.";
        } catch (Exception e) {
            e.printStackTrace();
            return generateLocalReply(msg);
        }
    }

    private String generateLocalReply(String message) {
        String question = message == null ? "" : message.toLowerCase(Locale.ROOT);

        if (containsAny(question, "course", "enroll", "enrollment")) {
            return "To start a course, open Available Courses and choose Enroll. Faculty can publish a course from Manage Courses. Enrolled courses and their learning materials appear under My Courses.";
        }
        if (containsAny(question, "assignment", "homework", "submission", "grade")) {
            return "Students can open Assignments to view work and submit an answer. Faculty can create assignments and review submissions from Manage Assignments. A course must exist first.";
        }
        if (containsAny(question, "quiz", "question", "exam", "test")) {
            return "Students can take published quizzes from Quizzes. Faculty can create a quiz, add questions, and review attempts in the Quiz Builder. A course must exist first.";
        }
        if (containsAny(question, "attendance", "present", "absent")) {
            return "Faculty can select a course in Attendance Management, mark each enrolled student present or absent, and save the session. Students can review their records in Attendance.";
        }
        if (containsAny(question, "meeting", "live class", "class link", "video")) {
            return "Faculty can schedule a live class from Live Classes after creating a course. Students who enroll in that course can find and join its scheduled classes.";
        }
        if (containsAny(question, "doubt", "question for faculty", "ask faculty")) {
            return "Students can send a doubt from Doubts & Replies after enrolling in a course. Choose the course, type the question, and select Send Doubt.";
        }
        if (containsAny(question, "hello", "hi", "hey")) {
            return "Hi! I can help you find courses, assignments, quizzes, attendance, live classes, or the doubts section. What would you like to do?";
        }

        return "I can help with navigating courses, assignments, quizzes, attendance, live classes, and doubts. Subject-specific AI answers are unavailable until the administrator configures the chatbot provider.";
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) return true;
        }
        return false;
    }
}

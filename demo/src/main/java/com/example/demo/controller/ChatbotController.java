package com.example.demo.controller;

import com.example.demo.dto.ChatRequest;
import com.example.demo.dto.ChatResponse;
import com.example.demo.entity.ChatMessage;
import com.example.demo.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/message")
    public ResponseEntity<ChatResponse> sendMessage(@Valid @RequestBody ChatRequest req) {
        return ResponseEntity.ok(chatbotService.processMessage(req));
    }

    @GetMapping("/history/{studentId}")
    public ResponseEntity<List<ChatMessage>> getHistory(@PathVariable Long studentId) {
        return ResponseEntity.ok(chatbotService.getHistory(studentId));
    }

    @DeleteMapping("/history/{studentId}")
    public ResponseEntity<Void> clearHistory(@PathVariable Long studentId) {
        chatbotService.clearHistory(studentId);
        return ResponseEntity.noContent().build();
    }
}

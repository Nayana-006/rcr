package com.example.demo.service;

import com.example.demo.entity.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@ConditionalOnProperty(name = "chatbot.provider", havingValue = "gemini")
public class GeminiChatbotClient implements ChatbotProvider {

    private static final String GENERATE_CONTENT_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent";
    private static final String SYSTEM_INSTRUCTIONS = "You are RCR Assistant, a general-purpose educational assistant " +
            "for students. Answer the student's actual question, including topics unrelated to this platform. " +
            "Explain difficult ideas in clear, simple language; use examples and step-by-step explanations when useful. " +
            "Explain code and its reasoning. Separate established facts from assumptions, state uncertainty, and ask " +
            "for clarification only when needed. Never invent facts, sources, or citations. For questions about the " +
            "RCR platform, its available features include courses and enrollment, assignments and resources, student " +
            "submissions and grading, Live Classes, quizzes, attendance, course progress, doubts and replies, and " +
            "notifications. Explain only behavior supported by this context; do not invent exact menus or policies.";

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String model;

    public GeminiChatbotClient(RestTemplate chatbotRestTemplate,
                               @Value("${gemini.api.key:}") String apiKey,
                               @Value("${gemini.model:gemini-3.8-flash}") String model) {
        this.restTemplate = chatbotRestTemplate;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public String generateReply(String message, List<ChatMessage> recentMessages, boolean useWebSearch) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ChatbotProviderException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The AI assistant is not configured yet. Set GEMINI_API_KEY and restart the backend.");
        }

        Map<String, Object> body = new LinkedHashMap<>();
        String instructions = SYSTEM_INSTRUCTIONS;
        if (useWebSearch) {
            instructions += " You do not have live web search for this request. Clearly say you cannot verify " +
                    "current information and do not guess about current facts.";
        }
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", instructions))));
        body.put("contents", toContents(recentMessages));
        body.put("generationConfig", Map.of("maxOutputTokens", 450));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-goog-api-key", apiKey);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                    GENERATE_CONTENT_URL.formatted(model), HttpMethod.POST,
                    new HttpEntity<>(body, headers), Map.class);
            String answer = extractAnswer(response.getBody());
            if (answer == null || answer.isBlank()) {
                throw new ChatbotProviderException(HttpStatus.BAD_GATEWAY,
                        "Gemini did not return a text answer. Please try again.");
            }
            return answer.trim();
        } catch (HttpStatusCodeException ex) {
            log.warn("Gemini generateContent request failed with HTTP status {}", ex.getStatusCode().value());
            throw toSafeProviderException(ex.getStatusCode().value());
        } catch (ResourceAccessException ex) {
            log.warn("Gemini generateContent request timed out or could not connect");
            throw new ChatbotProviderException(HttpStatus.GATEWAY_TIMEOUT,
                    "The AI assistant took too long to respond. Please try again.");
        } catch (ChatbotProviderException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Gemini returned an unusable response ({})", ex.getClass().getSimpleName());
            throw new ChatbotProviderException(HttpStatus.BAD_GATEWAY,
                    "The AI assistant could not process the response. Please try again.");
        }
    }

    private List<Map<String, Object>> toContents(List<ChatMessage> recentMessages) {
        List<Map<String, Object>> contents = new ArrayList<>();
        for (ChatMessage message : recentMessages) {
            String role = "USER".equals(message.getSender()) ? "user" : "model";
            contents.add(Map.of("role", role,
                    "parts", List.of(Map.of("text", message.getContent()))));
        }
        return contents;
    }

    private String extractAnswer(Map<?, ?> response) {
        Object candidatesValue = response == null ? null : response.get("candidates");
        if (!(candidatesValue instanceof List<?> candidates) || candidates.isEmpty()) return null;
        Object firstCandidate = candidates.get(0);
        if (!(firstCandidate instanceof Map<?, ?> candidate)) return null;
        Object contentValue = candidate.get("content");
        if (!(contentValue instanceof Map<?, ?> content)) return null;
        Object partsValue = content.get("parts");
        if (!(partsValue instanceof List<?> parts)) return null;

        StringBuilder answer = new StringBuilder();
        for (Object partValue : parts) {
            if (partValue instanceof Map<?, ?> part && part.get("text") instanceof String text && !text.isBlank()) {
                if (!answer.isEmpty()) answer.append('\n');
                answer.append(text);
            }
        }
        return answer.toString();
    }

    private ChatbotProviderException toSafeProviderException(int status) {
        if (status == 401 || status == 403) {
            return new ChatbotProviderException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Gemini rejected its credentials. Check GEMINI_API_KEY and its project access.");
        }
        if (status == 404) {
            return new ChatbotProviderException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The configured Gemini model is unavailable. Check GEMINI_MODEL.");
        }
        if (status == 429) {
            return new ChatbotProviderException(HttpStatus.TOO_MANY_REQUESTS,
                    "Gemini's rate limit or free-tier quota was reached. Check AI Studio usage and try again later.");
        }
        if (status >= 500) {
            return new ChatbotProviderException(HttpStatus.BAD_GATEWAY,
                    "Gemini is temporarily unavailable. Please try again later.");
        }
        return new ChatbotProviderException(HttpStatus.BAD_GATEWAY,
                "Gemini could not process this request. Check the chatbot configuration and try again.");
    }
}

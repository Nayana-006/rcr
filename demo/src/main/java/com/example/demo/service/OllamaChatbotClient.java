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
@ConditionalOnProperty(name = "chatbot.provider", havingValue = "ollama", matchIfMissing = true)
public class OllamaChatbotClient implements ChatbotProvider {

    private static final String SYSTEM_INSTRUCTIONS = "You are RCR Assistant, a general-purpose educational assistant " +
            "for students. Answer the student's actual question, including topics unrelated to this platform. " +
            "Explain difficult ideas in clear, simple language; use examples and step-by-step explanations when useful. " +
            "Explain code and its reasoning. Separate established facts from assumptions, state uncertainty, and ask " +
            "for clarification only when needed. Never invent facts, sources, or citations. For questions about the " +
            "RCR platform, its available features include courses and enrollment, assignments and resources, student " +
            "submissions and grading, Live Classes, quizzes, attendance, course progress, doubts and replies, and " +
            "notifications. Explain only behavior supported by this context; do not invent exact menus or policies.";

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String model;

    public OllamaChatbotClient(RestTemplate chatbotRestTemplate,
                               @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
                               @Value("${ollama.model:qwen3:4b}") String model) {
        this.restTemplate = chatbotRestTemplate;
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.model = model;
    }

    @Override
    public String generateReply(String message, List<ChatMessage> recentMessages, boolean useWebSearch) {
        Map<String, Object> body = new LinkedHashMap<>();
        List<Map<String, String>> messages = new ArrayList<>();
        String instructions = SYSTEM_INSTRUCTIONS;
        if (useWebSearch) {
            instructions += " You do not have live web search for this request. Clearly say you cannot verify " +
                    "current information and do not guess about current facts.";
        }
        messages.add(Map.of("role", "system", "content", instructions));
        for (ChatMessage messageItem : recentMessages) {
            String role = "USER".equals(messageItem.getSender()) ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", messageItem.getContent()));
        }
        body.put("model", model);
        body.put("messages", messages);
        body.put("stream", false);
        // Qwen3 enables a long internal thinking phase by default. Disable it so
        // local chat requests return promptly on typical student hardware.
        body.put("think", false);
        body.put("options", Map.of("num_predict", 180));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(
                    baseUrl + "/api/chat", HttpMethod.POST,
                    new HttpEntity<>(body, headers), Map.class);
            String answer = extractAnswer(response.getBody());
            if (answer == null || answer.isBlank()) {
                throw new ChatbotProviderException(HttpStatus.BAD_GATEWAY,
                        "The local model returned an empty answer. Please try again.");
            }
            return answer.trim();
        } catch (HttpStatusCodeException ex) {
            log.warn("Ollama chat request failed with HTTP status {}", ex.getStatusCode().value());
            if (ex.getStatusCode().value() == 404) {
                throw new ChatbotProviderException(HttpStatus.SERVICE_UNAVAILABLE,
                        "The local model is not installed. Run 'ollama run " + model + "' and try again.");
            }
            throw new ChatbotProviderException(HttpStatus.BAD_GATEWAY,
                    "The local model could not process the request. Check the Ollama service and model settings.");
        } catch (ResourceAccessException ex) {
            log.warn("Ollama is not reachable at the configured local address");
            throw new ChatbotProviderException(HttpStatus.SERVICE_UNAVAILABLE,
                    "The local AI service is not running. Start Ollama and try again.");
        } catch (ChatbotProviderException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Ollama returned an unusable response ({})", ex.getClass().getSimpleName());
            throw new ChatbotProviderException(HttpStatus.BAD_GATEWAY,
                    "The local AI assistant could not process the response. Please try again.");
        }
    }

    private String extractAnswer(Map<?, ?> response) {
        Object messageValue = response == null ? null : response.get("message");
        if (!(messageValue instanceof Map<?, ?> message)) return null;
        Object content = message.get("content");
        return content instanceof String text ? text : null;
    }
}

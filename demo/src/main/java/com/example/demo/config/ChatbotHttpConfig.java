package com.example.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class ChatbotHttpConfig {
    @Bean
    public RestTemplate chatbotRestTemplate() {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        // Local models can need extra time on their first response while loading into memory.
        requestFactory.setReadTimeout(Duration.ofSeconds(120));
        return new RestTemplate(requestFactory);
    }
}

package com.lingmou.provider;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingmou.entity.ChatHistory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "ai.vision-provider", havingValue = "volcengine")
public class VolcengineVisionProvider implements VisionModelProvider {

    private static final Logger log = LoggerFactory.getLogger(VolcengineVisionProvider.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient httpClient;
    private final String apiKey;
    private final String modelName;
    private final String baseUrl;

    public VolcengineVisionProvider(
            @Value("${volcengine.ark.api-key}") String apiKey,
            @Value("${volcengine.ark.model:doubao-seed-2.0-lite-250828}") String modelName,
            @Value("${volcengine.ark.base-url:https://ark.cn-beijing.volces.com/api/v3}") String baseUrl) {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    @Override
    public String chat(String sessionId, String prompt, List<String> imageUrls, List<ChatHistory> histories) {
        try {
            List<Map<String, Object>> messages = new ArrayList<>();

            // Add history
            for (ChatHistory h : histories) {
                Map<String, Object> msg = Map.of(
                        "role", h.getRole(),
                        "content", h.getContent()
                );
                messages.add(msg);
            }

            // Build user message content (text + images)
            List<Map<String, Object>> contentParts = new ArrayList<>();
            // Add images first
            if (imageUrls != null) {
                for (String url : imageUrls) {
                    contentParts.add(Map.of(
                            "type", "image_url",
                            "image_url", Map.of("url", url)
                    ));
                }
            }
            // Add text prompt
            contentParts.add(Map.of("type", "text", "text", prompt));

            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", contentParts);
            messages.add(userMessage);

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", 1024);

            String json = objectMapper.writeValueAsString(requestBody);
            log.info("Volcengine Vision: sessionId={}, prompt={}, images={}, historyRounds={}",
                    sessionId, prompt, imageUrls != null ? imageUrls.size() : 0, histories.size());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Volcengine API error: status={}, body={}", response.statusCode(), response.body());
                return "抱歉，AI 服务暂时不可用（" + response.statusCode() + "）";
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> result = objectMapper.readValue(response.body(), Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) result.get("choices");
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                String reply = (String) message.get("content");
                log.info("Volcengine Vision reply: {} chars", reply != null ? reply.length() : 0);
                return reply != null ? reply : "抱歉，AI 返回为空";
            }

            return "抱歉，AI 未生成回复";
        } catch (IOException | InterruptedException e) {
            log.error("Volcengine Vision call failed", e);
            return "抱歉，AI 服务调用失败: " + e.getMessage();
        }
    }
}

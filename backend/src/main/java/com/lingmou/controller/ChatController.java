package com.lingmou.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingmou.common.Result;
import com.lingmou.dto.ChatRequest;
import com.lingmou.dto.CorrectRequest;
import com.lingmou.entity.ChatHistory;
import com.lingmou.provider.VisionModelProvider;
import com.lingmou.service.ChatSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Tag(name = "对话服务")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final VisionModelProvider visionProvider;
    private final ChatSessionService sessionService;
    private final com.lingmou.service.ConversationSummaryService summaryService;

    public ChatController(VisionModelProvider visionProvider,
                         ChatSessionService sessionService,
                         com.lingmou.service.ConversationSummaryService summaryService) {
        this.visionProvider = visionProvider;
        this.sessionService = sessionService;
        this.summaryService = summaryService;
    }

    @Operation(summary = "发送对话消息")
    @PostMapping("/send")
    public Result<Map<String, String>> send(@Valid @RequestBody ChatRequest request) {
        String sessionId = request.getSessionId();
        String message = request.getMessage();
        List<String> images = request.getImages();

        // 如果前端传了 base64 帧数据，追加到 images 列表中
        String frameBase64 = request.getFrameBase64();
        if (frameBase64 != null && !frameBase64.isBlank()) {
            if (images == null) {
                images = new java.util.ArrayList<>();
            }
            images.add(frameBase64);
        }

        List<ChatHistory> histories = sessionService.getHistory(sessionId);
        String reply = visionProvider.chat(sessionId, message, images, histories);

        sessionService.appendHistory(sessionId, new ChatHistory("user", message));
        sessionService.appendHistory(sessionId, new ChatHistory("assistant", reply));

        if (sessionService.needsSummary(sessionId)) {
            summaryService.compress(sessionId);
        }

        log.info("Chat: sessionId={}, reply length={}", sessionId, reply.length());
        return Result.success(Map.of("reply", reply));
    }

    @Operation(summary = "流式对话（SSE）")
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@Valid @RequestBody ChatRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L); // 2 min timeout

        CompletableFuture.runAsync(() -> {
            try {
                String sessionId = request.getSessionId();
                String message = request.getMessage();
                List<String> images = request.getImages();
                String frameBase64 = request.getFrameBase64();
                if (frameBase64 != null && !frameBase64.isBlank()) {
                    if (images == null) images = new java.util.ArrayList<>();
                    images.add(frameBase64);
                }

                List<ChatHistory> histories = sessionService.getHistory(sessionId);
                BufferedReader reader = visionProvider.chatStream(sessionId, message, images, histories);

                if (reader == null) {
                    emitter.send(SseEmitter.event().name("error").data("AI 服务不可用"));
                    emitter.complete();
                    return;
                }

                StringBuilder fullReply = new StringBuilder();
                ObjectMapper mapper = new ObjectMapper();
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.isEmpty()) continue;
                    if (line.startsWith("data: ")) {
                        String data = line.substring(6);
                        if ("[DONE]".equals(data)) break;
                        try {
                            @SuppressWarnings("unchecked")
                            Map<String, Object> chunk = mapper.readValue(data, Map.class);
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> choices = (List<Map<String, Object>>) chunk.get("choices");
                            if (choices != null && !choices.isEmpty()) {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> delta = (Map<String, Object>) choices.get(0).get("delta");
                                if (delta != null) {
                                    String content = (String) delta.get("content");
                                    if (content == null || content.isEmpty()) {
                                        content = (String) delta.get("reasoning_content");
                                    }
                                    if (content != null && !content.isEmpty()) {
                                        fullReply.append(content);
                                        emitter.send(SseEmitter.event().name("token").data(content));
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Failed to parse SSE chunk: {}", data);
                        }
                    }
                }
                reader.close();

                sessionService.appendHistory(sessionId, new ChatHistory("user", message));
                sessionService.appendHistory(sessionId, new ChatHistory("assistant", fullReply.toString()));

                if (sessionService.needsSummary(sessionId)) {
                    summaryService.compress(sessionId);
                }

                emitter.send(SseEmitter.event().name("done").data(""));
                emitter.complete();
            } catch (Exception e) {
                log.error("Stream error", e);
                try {
                    emitter.send(SseEmitter.event().name("error").data(e.getMessage()));
                } catch (Exception ignored) {}
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    @Operation(summary = "ASR 语音识别纠错")
    @PostMapping("/correct")
    public Result<Map<String, String>> correct(@Valid @RequestBody CorrectRequest request) {
        String corrected = visionProvider.correctAsr(request.getText());
        return Result.success(Map.of("corrected", corrected));
    }
}

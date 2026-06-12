package com.lingmou.controller;

import com.lingmou.common.Result;
import com.lingmou.dto.ChatRequest;
import com.lingmou.entity.ChatHistory;
import com.lingmou.provider.VisionModelProvider;
import com.lingmou.service.ChatSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "对话服务")
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final VisionModelProvider visionProvider;
    private final ChatSessionService sessionService;

    public ChatController(VisionModelProvider visionProvider, ChatSessionService sessionService) {
        this.visionProvider = visionProvider;
        this.sessionService = sessionService;
    }

    @Operation(summary = "发送对话消息")
    @PostMapping("/send")
    public Result<Map<String, String>> send(@Valid @RequestBody ChatRequest request) {
        String sessionId = request.getSessionId();
        String message = request.getMessage();
        List<String> images = request.getImages();

        List<ChatHistory> histories = sessionService.getHistory(sessionId);
        String reply = visionProvider.chat(sessionId, message, images, histories);

        sessionService.appendHistory(sessionId, new ChatHistory("user", message));
        sessionService.appendHistory(sessionId, new ChatHistory("assistant", reply));

        log.info("Chat: sessionId={}, reply length={}", sessionId, reply.length());
        return Result.success(Map.of("reply", reply));
    }
}

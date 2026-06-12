package com.lingmou.controller;

import com.lingmou.common.Result;
import com.lingmou.dto.ChatRequest;
import com.lingmou.entity.ChatHistory;
import com.lingmou.provider.VisionModelProvider;
import com.lingmou.service.ChatSessionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/send")
    public Result<Map<String, String>> send(@Valid @RequestBody ChatRequest request) {
        String sessionId = request.getSessionId();
        String message = request.getMessage();
        List<String> images = request.getImages();

        List<ChatHistory> histories = sessionService.getHistory(sessionId);

        String reply = visionProvider.chat(sessionId, message, images, histories);

        // Save user message and AI reply to session history
        sessionService.appendHistory(sessionId, new ChatHistory("user", message));
        sessionService.appendHistory(sessionId, new ChatHistory("assistant", reply));

        log.info("Chat: sessionId={}, reply length={}", sessionId, reply.length());

        return Result.success(Map.of("reply", reply));
    }
}

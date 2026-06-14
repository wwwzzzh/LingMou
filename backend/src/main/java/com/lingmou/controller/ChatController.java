package com.lingmou.controller;

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

        log.info("Chat: sessionId={}, reply length={}", sessionId, reply.length());
        return Result.success(Map.of("reply", reply));
    }

    @Operation(summary = "ASR 语音识别纠错")
    @PostMapping("/correct")
    public Result<Map<String, String>> correct(@Valid @RequestBody CorrectRequest request) {
        String corrected = visionProvider.correctAsr(request.getText());
        return Result.success(Map.of("corrected", corrected));
    }
}

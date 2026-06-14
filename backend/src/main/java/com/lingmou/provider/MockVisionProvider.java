package com.lingmou.provider;

import com.lingmou.entity.ChatHistory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
@ConditionalOnProperty(name = "ai.vision-provider", havingValue = "mock", matchIfMissing = true)
public class MockVisionProvider implements VisionModelProvider {

    private static final Logger log = LoggerFactory.getLogger(MockVisionProvider.class);

    @Override
    public String chat(String sessionId, String prompt, List<String> imageUrls, List<ChatHistory> histories) {
        log.info("Mock Vision: sessionId={}, prompt={}, images={}, historyRounds={}",
                sessionId, prompt, imageUrls != null ? imageUrls.size() : 0,
                histories != null ? histories.size() : 0);
        return "[Mock Vision] 模拟多模态回复: 已收到你的问题「" + prompt + "」";
    }

    @Override
    public String analyze(String imageBase64, String prompt) {
        log.info("Mock Vision analyze: prompt={}, imageSize={}", prompt, imageBase64.length());
        return "[Mock] 画面分析: " + prompt;
    }

    @Override
    public String correctAsr(String rawText) {
        log.info("Mock ASR correct: {}", rawText);
        return rawText;
    }

    @Override
    public BufferedReader chatStream(String sessionId, String prompt, List<String> imageUrls,
                                      List<ChatHistory> histories) throws IOException {
        String mockSse = "data: {\"choices\":[{\"delta\":{\"content\":\"[Mock 流式] 收到问题：「" + prompt + "」\"}}]}\n\ndata: [DONE]\n";
        return new BufferedReader(new InputStreamReader(
                new ByteArrayInputStream(mockSse.getBytes(StandardCharsets.UTF_8))));
    }
}

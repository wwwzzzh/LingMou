package com.lingmou.provider;

import com.lingmou.entity.ChatHistory;

import java.util.List;

public interface VisionModelProvider {

    String chat(String sessionId, String prompt, List<String> imageUrls, List<ChatHistory> histories);

    String analyze(String imageBase64, String prompt);

    String correctAsr(String rawText);
}

package com.lingmou.service;

import com.lingmou.entity.ChatHistory;
import com.lingmou.provider.VisionModelProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class ConversationSummaryService {

    private static final Logger log = LoggerFactory.getLogger(ConversationSummaryService.class);

    private final VisionModelProvider visionProvider;
    private final ChatSessionService sessionService;

    @Value("${chat.summary-keep-rounds:10}")
    private int summaryKeepRounds;

    public ConversationSummaryService(VisionModelProvider visionProvider,
                                      ChatSessionService sessionService) {
        this.visionProvider = visionProvider;
        this.sessionService = sessionService;
    }

    /**
     * Compress conversation history: summarize early rounds, keep recent rounds.
     */
    public void compress(String sessionId) {
        List<ChatHistory> histories = sessionService.getHistory(sessionId);

        if (histories.size() <= summaryKeepRounds) {
            return;
        }

        // Build summary prompt from old rounds
        int oldCount = histories.size() - summaryKeepRounds;
        List<ChatHistory> oldRounds = histories.subList(0, oldCount);
        StringBuilder prompt = new StringBuilder("请将以下对话总结为一句话摘要：\n");
        for (ChatHistory h : oldRounds) {
            prompt.append("[").append(h.getRole()).append("]: ").append(h.getContent()).append("\n");
        }

        log.info("Compressing {} rounds for session {}", oldCount, sessionId);

        // Call AI to summarize
        String summary = visionProvider.chat(
                sessionId,
                prompt.toString(),
                Collections.emptyList(),
                Collections.emptyList()
        );

        // Replace history: summary + recent rounds
        List<ChatHistory> recentRounds = histories.subList(oldCount, histories.size());
        List<ChatHistory> compressed = new java.util.ArrayList<>();
        compressed.add(new ChatHistory("system", summary));
        compressed.addAll(recentRounds);

        sessionService.replaceHistory(sessionId, compressed);

        log.info("History compressed: {} rounds -> summary + {} recent rounds", histories.size(), recentRounds.size());
    }
}

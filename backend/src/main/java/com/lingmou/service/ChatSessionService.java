package com.lingmou.service;

import com.lingmou.entity.ChatHistory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class ChatSessionService {

    private static final Logger log = LoggerFactory.getLogger(ChatSessionService.class);
    private static final String KEY_PREFIX = "chat:history:";

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${chat.max-round:20}")
    private int maxRound;

    public ChatSessionService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @SuppressWarnings("unchecked")
    public List<ChatHistory> getHistory(String sessionId) {
        String key = KEY_PREFIX + sessionId;
        Object value = redisTemplate.opsForValue().get(key);
        if (value instanceof List) {
            return (List<ChatHistory>) value;
        }
        return new ArrayList<>();
    }

    public void appendHistory(String sessionId, ChatHistory entry) {
        String key = KEY_PREFIX + sessionId;
        List<ChatHistory> histories = getHistory(sessionId);
        histories.add(entry);

        // Keep only the last N rounds
        if (histories.size() > maxRound) {
            histories = histories.subList(histories.size() - maxRound, histories.size());
        }

        redisTemplate.opsForValue().set(key, histories, 24, TimeUnit.HOURS);
    }

    public void clearHistory(String sessionId) {
        redisTemplate.delete(KEY_PREFIX + sessionId);
    }
}

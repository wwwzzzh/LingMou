package com.lingmou.provider;

import com.lingmou.entity.ChatHistory;

import java.util.List;

public interface VisionModelProvider {

    /**
     * 多模态对话
     * @param sessionId 会话ID
     * @param prompt 用户提问文本
     * @param imageUrls 图片URL列表（可空）
     * @param histories 历史对话记录
     * @return AI回复文本
     */
    String chat(String sessionId, String prompt, List<String> imageUrls, List<ChatHistory> histories);
}

package com.lingmou.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
@ConditionalOnProperty(name = "ai.asr-provider", havingValue = "volcengine")
public class VolcengineAsrProvider implements AsrProvider {

    private static final Logger log = LoggerFactory.getLogger(VolcengineAsrProvider.class);

    private final String accessKey;
    private final String secretKey;

    public VolcengineAsrProvider(
            @Value("${volcengine.asr.access-key}") String accessKey,
            @Value("${volcengine.asr.secret-key}") String secretKey) {
        this.accessKey = accessKey;
        this.secretKey = secretKey;
    }

    @Override
    public String speechToText(File audio) {
        log.info("Volcengine ASR: processing audio file {}", audio.getName());
        // TODO: 火山引擎流式语音识别 SDK 接入
        // 需要使用 AK/SK 调用豆包流式语音识别模型2.0
        return "[Volcengine ASR 待接入] 音频文件: " + audio.getName();
    }
}

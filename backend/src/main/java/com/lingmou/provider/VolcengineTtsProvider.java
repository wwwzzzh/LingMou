package com.lingmou.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@ConditionalOnProperty(name = "ai.tts-provider", havingValue = "volcengine")
public class VolcengineTtsProvider implements TtsProvider {

    private static final Logger log = LoggerFactory.getLogger(VolcengineTtsProvider.class);

    private final String accessKey;
    private final String secretKey;

    public VolcengineTtsProvider(
            @Value("${volcengine.tts.access-key}") String accessKey,
            @Value("${volcengine.tts.secret-key}") String secretKey) {
        this.accessKey = accessKey;
        this.secretKey = secretKey;
    }

    @Override
    public byte[] textToSpeech(String text) {
        log.info("Volcengine TTS: synthesizing text ({} chars)", text.length());
        // TODO: 火山引擎语音合成 SDK 接入
        // 需要使用 AK/SK 调用豆包语音合成模型2.0
        return ("[Volcengine TTS 待接入] " + text).getBytes(StandardCharsets.UTF_8);
    }
}

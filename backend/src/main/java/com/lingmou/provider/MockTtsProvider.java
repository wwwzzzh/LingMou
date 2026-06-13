package com.lingmou.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
@ConditionalOnProperty(name = "ai.tts-provider", havingValue = "mock", matchIfMissing = true)
public class MockTtsProvider implements TtsProvider {

    private static final Logger log = LoggerFactory.getLogger(MockTtsProvider.class);

    @Override
    public byte[] textToSpeech(String text) {
        log.info("Mock TTS: synthesizing text ({} chars)", text.length());
        return ("[Mock TTS audio] " + text).getBytes(StandardCharsets.UTF_8);
    }
}

package com.lingmou.provider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
@ConditionalOnProperty(name = "ai.asr-provider", havingValue = "mock", matchIfMissing = true)
public class MockAsrProvider implements AsrProvider {

    private static final Logger log = LoggerFactory.getLogger(MockAsrProvider.class);

    @Override
    public String speechToText(File audio) {
        log.info("Mock ASR: processing audio file {}", audio.getName());
        return "[Mock ASR] 模拟语音识别结果";
    }
}

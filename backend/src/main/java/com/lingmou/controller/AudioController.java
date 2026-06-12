package com.lingmou.controller;

import com.lingmou.common.Result;
import com.lingmou.dto.TtsRequest;
import com.lingmou.provider.AsrProvider;
import com.lingmou.provider.TtsProvider;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    private static final Logger log = LoggerFactory.getLogger(AudioController.class);

    private final AsrProvider asrProvider;
    private final TtsProvider ttsProvider;

    public AudioController(AsrProvider asrProvider, TtsProvider ttsProvider) {
        this.asrProvider = asrProvider;
        this.ttsProvider = ttsProvider;
    }

    @PostMapping("/asr")
    public Result<Map<String, String>> asr(@RequestParam("audio") MultipartFile audio) throws IOException {
        if (audio.isEmpty()) {
            throw new IllegalArgumentException("音频文件为空");
        }

        Path tempFile = Files.createTempFile("asr_", ".wav");
        audio.transferTo(tempFile.toFile());
        File audioFile = tempFile.toFile();

        try {
            String text = asrProvider.speechToText(audioFile);
            return Result.success(Map.of("text", text));
        } finally {
            audioFile.delete();
        }
    }

    @PostMapping("/tts")
    public Result<Map<String, String>> tts(@Valid TtsRequest request) {
        byte[] audioBytes = ttsProvider.textToSpeech(request.getText());
        return Result.success(Map.of(
                "text", request.getText(),
                "audioSize", String.valueOf(audioBytes.length)
        ));
    }
}

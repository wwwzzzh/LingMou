package com.lingmou.controller;

import com.lingmou.common.Result;
import com.lingmou.dto.TtsRequest;
import com.lingmou.provider.AsrProvider;
import com.lingmou.provider.TtsProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Map;

@Tag(name = "语音服务")
@RestController
@RequestMapping("/api/audio")
public class AudioController {

    private final AsrProvider asrProvider;
    private final TtsProvider ttsProvider;

    public AudioController(AsrProvider asrProvider, TtsProvider ttsProvider) {
        this.asrProvider = asrProvider;
        this.ttsProvider = ttsProvider;
    }

    @Operation(summary = "语音转文字")
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

    @Operation(summary = "文字转语音")
    @PostMapping("/tts")
    public Result<Map<String, String>> tts(@Valid @RequestBody TtsRequest request) {
        byte[] audioBytes = ttsProvider.textToSpeech(request.getText());
        String base64Audio = Base64.getEncoder().encodeToString(audioBytes);
        return Result.success(Map.of(
                "text", request.getText(),
                "audioUrl", "data:audio/wav;base64," + base64Audio
        ));
    }
}

package com.lingmou.dto;

import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

public class AsrRequest {

    @NotNull(message = "音频文件不能为空")
    private MultipartFile audio;

    public MultipartFile getAudio() {
        return audio;
    }

    public void setAudio(MultipartFile audio) {
        this.audio = audio;
    }
}

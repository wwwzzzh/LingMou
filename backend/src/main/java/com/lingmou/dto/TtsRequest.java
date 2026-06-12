package com.lingmou.dto;

import jakarta.validation.constraints.NotBlank;

public class TtsRequest {

    @NotBlank(message = "文本内容不能为空")
    private String text;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }
}

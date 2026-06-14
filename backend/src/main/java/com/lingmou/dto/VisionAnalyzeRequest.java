package com.lingmou.dto;

import jakarta.validation.constraints.NotBlank;

public class VisionAnalyzeRequest {

    @NotBlank(message = "图片数据不能为空")
    private String imageBase64;

    @NotBlank(message = "提示词不能为空")
    private String prompt;

    public String getImageBase64() {
        return imageBase64;
    }

    public void setImageBase64(String imageBase64) {
        this.imageBase64 = imageBase64;
    }

    public String getPrompt() {
        return prompt;
    }

    public void setPrompt(String prompt) {
        this.prompt = prompt;
    }
}

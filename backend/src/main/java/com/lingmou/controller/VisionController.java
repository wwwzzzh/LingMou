package com.lingmou.controller;

import com.lingmou.common.Result;
import com.lingmou.dto.VisionAnalyzeRequest;
import com.lingmou.provider.VisionModelProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Map;
import java.util.UUID;

@Tag(name = "视觉服务")
@RestController
@RequestMapping("/api/vision")
public class VisionController {

    private static final Logger log = LoggerFactory.getLogger(VisionController.class);

    private final VisionModelProvider visionProvider;

    public VisionController(VisionModelProvider visionProvider) {
        this.visionProvider = visionProvider;
    }

    @Operation(summary = "分析 base64 图片（主动视觉/聊天截图）")
    @PostMapping("/analyze")
    public Result<Map<String, String>> analyze(@Valid @RequestBody VisionAnalyzeRequest request) {
        String reply = visionProvider.analyze(request.getImageBase64(), request.getPrompt());
        return Result.success(Map.of("reply", reply));
    }

    @Operation(summary = "上传图片帧进行视觉分析")
    @PostMapping("/upload")
    public Result<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("图片文件为空");
        }

        String originalName = file.getOriginalFilename();
        String ext = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".jpg";
        String storedName = UUID.randomUUID() + ext;

        Path uploadDir = Path.of("uploads");
        Files.createDirectories(uploadDir);
        File destFile = uploadDir.resolve(storedName).toFile();
        file.transferTo(destFile);

        log.info("Image uploaded: {} ({} bytes)", storedName, file.getSize());

        return Result.success(Map.of(
                "url", "/uploads/" + storedName,
                "description", "图片已上传"
        ));
    }
}

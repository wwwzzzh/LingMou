package com.lingmou.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AI视觉对话助手 API")
                        .version("1.0.0")
                        .description("基于多模态大模型的实时视觉语音助手后端接口文档"));
    }
}

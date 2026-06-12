package com.lingmou.config;

import com.lingmou.interceptor.RateLimitInterceptor;
import com.lingmou.interceptor.RequestTimingInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;
    private final RequestTimingInterceptor requestTimingInterceptor;

    public WebConfig(RateLimitInterceptor rateLimitInterceptor,
                     RequestTimingInterceptor requestTimingInterceptor) {
        this.rateLimitInterceptor = rateLimitInterceptor;
        this.requestTimingInterceptor = requestTimingInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(requestTimingInterceptor)
                .addPathPatterns("/api/**", "/health");
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/health");
    }
}

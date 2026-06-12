package com.lingmou.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingmou.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitInterceptor.class);
    private static final String RATE_KEY_PREFIX = "rate:";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${rate-limit.max-requests:20}")
    private int maxRequests;

    @Value("${rate-limit.window-seconds:60}")
    private int windowSeconds;

    public RateLimitInterceptor(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        String sessionId = request.getParameter("sessionId");
        if (sessionId == null) {
            sessionId = request.getHeader("X-Session-Id");
        }
        if (sessionId == null) {
            return true;
        }

        String key = RATE_KEY_PREFIX + sessionId;
        Object current = redisTemplate.opsForValue().get(key);

        if (current == null) {
            redisTemplate.opsForValue().set(key, 1, windowSeconds, TimeUnit.SECONDS);
            return true;
        }

        int count = Integer.parseInt(current.toString());
        if (count >= maxRequests) {
            log.warn("Rate limit exceeded: sessionId={}, count={}", sessionId, count);
            writeErrorResponse(response);
            return false;
        }

        redisTemplate.opsForValue().increment(key);
        return true;
    }

    private void writeErrorResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        Result<?> result = Result.error(429, "Too Many Requests");
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}

package com.lingmou.interceptor;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lingmou.common.Result;
import com.lingmou.config.BodyCacheFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
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
        String sessionId = request.getHeader("X-Session-Id");
        if (sessionId == null) {
            sessionId = request.getParameter("sessionId");
        }
        if (sessionId == null && request instanceof BodyCacheFilter.EagerBodyRequestWrapper wrapper) {
            sessionId = extractSessionIdFromBody(wrapper.getCachedBody());
        }
        if (sessionId == null) {
            return true;
        }

        String key = RATE_KEY_PREFIX + sessionId;

        // 原子操作：INCR 首次调用自动创建 key，无需 check-then-set
        Long count = redisTemplate.opsForValue().increment(key);
        if (count == null) {
            return true;
        }

        // 首次创建时设置过期时间
        if (count == 1) {
            redisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);
        }

        if (count > maxRequests) {
            log.warn("Rate limit exceeded: sessionId={}, count={}", sessionId, count);
            writeErrorResponse(response);
            return false;
        }

        return true;
    }

    private String extractSessionIdFromBody(byte[] body) {
        try {
            if (body == null || body.length == 0) return null;
            String json = new String(body, StandardCharsets.UTF_8);
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(json, Map.class);
            Object sid = map.get("sessionId");
            return sid != null ? sid.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void writeErrorResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        Result<?> result = Result.error(429, "Too Many Requests");
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}

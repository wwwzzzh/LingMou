package com.lingmou.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RequestTimingInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RequestTimingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) {
        request.setAttribute("startTime", System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        Long startTime = (Long) request.getAttribute("startTime");
        if (startTime != null) {
            long elapsed = System.currentTimeMillis() - startTime;
            String sessionId = request.getParameter("sessionId");
            if (sessionId == null) {
                sessionId = request.getHeader("X-Session-Id");
            }
            log.info("Request: method={}, uri={}, sessionId={}, status={}, elapsed={}ms",
                    request.getMethod(),
                    request.getRequestURI(),
                    sessionId != null ? sessionId : "N/A",
                    response.getStatus(),
                    elapsed);
        }
    }
}

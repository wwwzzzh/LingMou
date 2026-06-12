package com.lingmou.common;

import java.time.Instant;

public class Result<T> {

    private int code;
    private String message;
    private T data;
    private long timestamp;

    private Result() {
    }

    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<>();
        r.code = 200;
        r.message = "success";
        r.data = data;
        r.timestamp = Instant.now().toEpochMilli();
        return r;
    }

    public static <T> Result<T> success() {
        return success(null);
    }

    public static <T> Result<T> error(int code, String message) {
        Result<T> r = new Result<>();
        r.code = code;
        r.message = message;
        r.data = null;
        r.timestamp = Instant.now().toEpochMilli();
        return r;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public T getData() {
        return data;
    }

    public long getTimestamp() {
        return timestamp;
    }
}

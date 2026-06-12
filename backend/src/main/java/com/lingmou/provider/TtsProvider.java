package com.lingmou.provider;

public interface TtsProvider {

    /**
     * 文字转语音
     * @param text 文本内容
     * @return 音频字节数组
     */
    byte[] textToSpeech(String text);
}

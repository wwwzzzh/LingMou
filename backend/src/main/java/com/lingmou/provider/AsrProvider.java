package com.lingmou.provider;

import java.io.File;

public interface AsrProvider {

    /**
     * 语音转文字
     * @param audio 音频文件
     * @return 识别文本
     */
    String speechToText(File audio);
}

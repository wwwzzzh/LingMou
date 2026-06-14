package com.lingmou.provider;

import java.io.File;

public interface AsrProvider {

    String speechToText(File audio);
}

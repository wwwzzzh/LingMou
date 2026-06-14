import request from '@/api/request'
import type { ApiResult } from '@/types'

/**
 * 语音识别：语音转文字
 */
export interface AsrResult {
  /** 识别出的文本 */
  text: string
}

/**
 * 语音合成：文字转语音
 */
export interface TtsResult {
  /** 音频文件 URL 或 Base64 */
  audioUrl: string
}

/**
 * 语音 API
 */
const audioApi = {
  /**
   * POST /api/audio/asr
   * 上传音频文件，返回识别文本
   */
  speechToText(data: FormData): Promise<ApiResult<AsrResult>> {
    return request.post('/api/audio/asr', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * POST /api/audio/tts
   * 发送文字，返回合成语音
   */
  textToSpeech(text: string): Promise<ApiResult<TtsResult>> {
    return request.post('/api/audio/tts', { text })
  },
}

export default audioApi

import request from '@/api/request'
import type { ApiResult } from '@/types'

/**
 * 发送聊天消息请求参数
 */
export interface SendMessageParams {
  /** 会话 ID */
  sessionId: string
  /** 消息文本内容 */
  message: string
  /** 附带图片 URL 列表 */
  images: string[]
  /** 摄像头帧 base64（可选） */
  frameBase64?: string
}

/**
 * 发送聊天消息响应
 */
export interface SendMessageResult {
  /** AI 回复内容 */
  reply: string
}

/**
 * 聊天消息 API
 */
const chatApi = {
  /**
   * POST /api/chat/send
   * 发送消息并获取 AI 回复
   */
  sendMessage(params: SendMessageParams): Promise<ApiResult<SendMessageResult>> {
    return request.post('/api/chat/send', params)
  },

  /**
   * POST /api/chat/correct
   * ASR 语音识别纠错
   */
  correctAsr(text: string): Promise<ApiResult<{ corrected: string }>> {
    return request.post('/api/chat/correct', { text })
  },
}

export default chatApi

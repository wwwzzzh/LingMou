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
   * POST /api/chat/stream
   * 流式对话，通过回调接收 token
   */
  async sendMessageStream(
    params: SendMessageParams,
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ): Promise<void> {
    const baseURL = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${baseURL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      onError(`HTTP ${response.status}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      onError('Stream not supported')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('event:token\ndata:')) {
          const data = line.split('data:')[1]
          if (data) onToken(data)
        } else if (line.startsWith('data:')) {
          // SSE format from Spring
          const match = line.match(/^data:(.*)/)
          if (match) {
            const content = match[1].trim()
            if (content) onToken(content)
          }
        }
        if (line.startsWith('event:done')) {
          onDone()
          return
        }
        if (line.startsWith('event:error')) {
          onError('Stream error')
          return
        }
      }
    }
    onDone()
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

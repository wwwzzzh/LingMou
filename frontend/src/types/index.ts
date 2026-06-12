/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant'

/**
 * 消息内容类型
 */
export type MessageType = 'text' | 'image' | 'audio'

/**
 * 聊天消息数据结构
 */
export interface ChatMessage {
  /** 消息唯一标识 */
  id: string

  /** 消息角色：用户 或 AI 助手 */
  role: MessageRole

  /** 消息文本内容 */
  content: string

  /** 消息类型：文本 / 图片 / 语音 */
  type: MessageType

  /** 消息时间戳（毫秒） */
  timestamp: number
}

/**
 * API 统一返回格式
 */
export interface ApiResult<T = unknown> {
  /** 状态码 */
  code: number

  /** 提示信息 */
  message: string

  /** 返回数据 */
  data: T

  /** 服务端时间戳 */
  timestamp: number
}

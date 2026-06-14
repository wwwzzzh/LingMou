import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatMessage } from '@/types'

/**
 * 聊天状态管理
 * 管理消息列表与对话交互状态
 */
export const useChatStore = defineStore('chat', () => {
  /** 消息列表 */
  const messages = ref<ChatMessage[]>([])

  /** 是否正在加载 AI 回复 */
  const isLoading = ref<boolean>(false)

  /**
   * 添加一条消息
   * @param message - 符合 ChatMessage 接口的消息对象
   */
  function addMessage(message: ChatMessage): void {
    messages.value.push(message)
  }

  /**
   * 设置加载状态
   * @param loading - 是否正在等待 AI 回复
   */
  function setLoading(loading: boolean): void {
    isLoading.value = loading
  }

  /**
   * 清空消息列表
   */
  function clearMessages(): void {
    messages.value = []
  }

  return {
    messages,
    isLoading,
    addMessage,
    setLoading,
    clearMessages,
  }
})

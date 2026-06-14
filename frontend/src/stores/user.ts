import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 用户状态管理
 * 管理游客身份与会话信息
 */
export const useUserStore = defineStore('user', () => {
  /** 会话 ID — 后端分配的游客身份标识 */
  const sessionId = ref<string>('')

  /** 设备连接状态 */
  const isConnected = ref<boolean>(false)

  /**
   * 设置会话 ID
   * @param id - 后端返回的 sessionId
   */
  function setSessionId(id: string): void {
    sessionId.value = id
  }

  /**
   * 更新设备连接状态
   * @param status - 是否已连接
   */
  function setConnectionStatus(status: boolean): void {
    isConnected.value = status
  }

  /**
   * 重置用户状态（用于会话结束）
   */
  function reset(): void {
    sessionId.value = ''
    isConnected.value = false
  }

  return {
    sessionId,
    isConnected,
    setSessionId,
    setConnectionStatus,
    reset,
  }
})

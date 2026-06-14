import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 全局应用状态管理
 *
 * 管理全局 Loading、错误提示、网络状态等跨页面共享状态。
 */
export const useAppStore = defineStore('app', () => {
  /** 全局加载状态计数（支持并发请求，>0 即显示 loading） */
  const loadingCount = ref(0)

  /** 全局错误信息 */
  const globalError = ref<string | null>(null)

  /** 网络在线状态 */
  const isOnline = ref(navigator.onLine)

  /**
   * 开始一个加载任务
   * 返回一个结束函数，方便在 try/finally 中使用
   */
  function startLoading(): () => void {
    loadingCount.value++
    let closed = false
    return () => {
      if (!closed) {
        loadingCount.value = Math.max(0, loadingCount.value - 1)
        closed = true
      }
    }
  }

  /** 设置全局错误 */
  function setError(message: string): void {
    globalError.value = message
  }

  /** 清除全局错误 */
  function clearError(): void {
    globalError.value = null
  }

  /** 更新网络状态 */
  function setOnline(status: boolean): void {
    isOnline.value = status
  }

  return {
    loadingCount,
    globalError,
    isOnline,
    startLoading,
    setError,
    clearError,
    setOnline,
  }
})

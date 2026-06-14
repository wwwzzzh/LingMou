import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 创建 Axios 实例
 *
 * - 请求拦截器：自动注入 Token（预留）
 * - 响应拦截器：统一异常处理
 */
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ==================== 请求拦截器 ====================
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Token 预留位置 — 后续从 userStore 或 localStorage 获取
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// ==================== 响应拦截器 ====================
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response

    // 如果后端返回了业务层面的错误
    if (data.code && data.code !== 200) {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }

    return data
  },
  (error) => {
    // 统一 HTTP 异常处理
    if (error.response) {
      const { status } = error.response

      switch (status) {
        case 401:
          ElMessage.error('认证已过期，请刷新页面重试')
          // TODO: Token 刷新或登出逻辑
          break
        case 403:
          ElMessage.error('拒绝访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 429:
          ElMessage.warning('请求过于频繁，请稍后再试')
          break
        case 500:
          ElMessage.error('服务器内部错误，请稍后再试')
          break
        default:
          ElMessage.error(`连接异常 (${status})`)
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  },
)

export default request

/**
 * 生成唯一 ID
 * 格式：时间戳 + 随机数
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 格式化时间戳为可读时间
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hh = date.getHours().toString().padStart(2, '0')
  const mm = date.getMinutes().toString().padStart(2, '0')
  return `${hh}:${mm}`
}

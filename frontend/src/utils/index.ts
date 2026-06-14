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

/**
 * 清洗 TTS 朗读文本：去除 emoji、Markdown 标记、特殊符号
 */
export function cleanTtsText(text: string): string {
  return text
    // 去除 emoji
    .replace(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '')
    // 去除 Markdown 标记
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **粗体**
    .replace(/\*(.+?)\*/g, '$1')       // *斜体*
    .replace(/~~(.+?)~~/g, '$1')       // ~~删除线~~
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // `代码`
    .replace(/^#{1,6}\s/gm, '')        // # 标题
    .replace(/^[-*+]\s/gm, '')         // - 列表
    .replace(/^>\s/gm, '')             // > 引用
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [链接](url)
    .replace(/[*_~`#>|]/g, '')         // 残留标记符号
    .replace(/\s+/g, ' ')              // 多余空白
    .trim()
}

import type { ChatMessage } from '@/types'
import { generateId } from '@/utils'

/**
 * 模拟 AI 回复内容（开发阶段使用，后续替换为真实 API）
 */
const MOCK_REPLIES = [
  '我看到了你分享的画面，这是一个很有趣的场景！',
  '根据当前的视觉信息，我建议你可以注意一下画面的构图和光线。',
  '感谢你的提问！从图像中我可以识别出几个关键元素，让我为你详细分析...',
  '这是一个很好的问题。结合实时画面来看，当前场景包含丰富的视觉信息。',
  '我理解你的需求了。基于多模态分析，我给出的建议是优化当前视角以获得更好的识别效果。',
]

let mockIndex = 0

/**
 * 模拟 AI 对话 API
 * 后续替换为 POST /api/chat/send
 */
export async function mockChatReply(
  _sessionId: string,
  _userMessage: string,
  _images: string[],
): Promise<ChatMessage> {
  // 模拟网络延迟 800-2000ms
  const delay = 800 + Math.random() * 1200
  await new Promise((resolve) => setTimeout(resolve, delay))

  const reply = MOCK_REPLIES[mockIndex % MOCK_REPLIES.length]
  mockIndex++

  return {
    id: generateId(),
    role: 'assistant',
    content: reply,
    type: 'text',
    timestamp: Date.now(),
  }
}

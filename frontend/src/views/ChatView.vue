<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { generateId } from '@/utils'
import { mockChatReply } from '@/api/modules/chat.mock'
import type { ChatMessage } from '@/types'
import MessageBubble from '@/components/MessageBubble.vue'
import ChatInput from '@/components/ChatInput.vue'

const chatStore = useChatStore()
const userStore = useUserStore()
const appStore = useAppStore()

/** 聊天容器引用（用于自动滚动） */
const chatContainerRef = ref<HTMLElement | null>(null)

/** 欢迎消息 */
const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是 AI 视觉对话助手 👋\n我可以实时查看你的摄像头画面，并回答你的任何问题。点击"开始使用"即可开启视觉对话体验。',
  type: 'text',
  timestamp: Date.now(),
}

onMounted(() => {
  // 若无消息则显示欢迎语
  if (chatStore.messages.length === 0) {
    chatStore.addMessage(WELCOME_MESSAGE)
  }
})

/**
 * 滚动到底部
 */
async function scrollToBottom(): Promise<void> {
  await nextTick()
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

/**
 * 发送消息
 */
async function handleSend(content: string): Promise<void> {
  const doneLoading = appStore.startLoading()

  // 构造用户消息
  const userMessage: ChatMessage = {
    id: generateId(),
    role: 'user',
    content,
    type: 'text',
    timestamp: Date.now(),
  }

  chatStore.addMessage(userMessage)
  await scrollToBottom()

  chatStore.setLoading(true)

  try {
    const reply = await mockChatReply(
      userStore.sessionId || 'anonymous',
      content,
      [],
    )
    chatStore.addMessage(reply)
  } catch {
    chatStore.addMessage({
      id: generateId(),
      role: 'assistant',
      content: '抱歉，回复生成失败，请稍后重试。',
      type: 'text',
      timestamp: Date.now(),
    })
    appStore.setError('消息发送失败，请检查网络连接')
  } finally {
    chatStore.setLoading(false)
    doneLoading()
    await scrollToBottom()
  }
}

/**
 * 清空对话
 */
function handleClear(): void {
  chatStore.clearMessages()
  chatStore.addMessage(WELCOME_MESSAGE)
  scrollToBottom()
}

// 监听消息列表变化自动滚动
watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom()
  },
)
</script>

<template>
  <div class="chat-view">
    <!-- 顶部工具栏 -->
    <div class="chat-view__toolbar">
      <h2 class="chat-view__title">💬 智能对话</h2>
      <el-button text size="small" @click="handleClear">
        清空对话
      </el-button>
    </div>

    <!-- 消息列表区域 -->
    <div ref="chatContainerRef" class="chat-view__messages">
      <TransitionGroup name="msg">
        <MessageBubble
          v-for="message in chatStore.messages"
          :key="message.id"
          :message="message"
        />
      </TransitionGroup>

      <!-- AI 加载状态 -->
      <div v-if="chatStore.isLoading" class="chat-view__loading">
        <div class="loading-indicator">
          <span class="loading-indicator__dot" />
          <span class="loading-indicator__dot" />
          <span class="loading-indicator__dot" />
        </div>
        <span class="loading-indicator__text">AI 正在思考...</span>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-view__input">
      <ChatInput @send="handleSend" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - $header-height - 48px - 32px);
  max-width: 900px;
  margin: 0 auto;

  // 工具栏
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid $border-color-light;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
  }

  // 消息区
  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 24px 0;
    display: flex;
    flex-direction: column;
  }

  // 加载状态
  &__loading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
    margin-left: 48px; // 对齐头像
  }

  // 输入区域
  &__input {
    border-top: 1px solid $border-color-light;
    background: $bg-color-white;
  }
}

// 加载动画
.loading-indicator {
  display: flex;
  gap: 4px;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: $color-primary;
    animation: dotPulse 1.4s ease-in-out infinite both;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.16s; }
    &:nth-child(3) { animation-delay: 0.32s; }
  }

  &__text {
    font-size: 14px;
    color: $text-secondary;
  }
}

@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

// 消息入场动画
.msg-enter-active {
  transition: all 0.3s ease-out;
}

.msg-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

// 响应式
@media (max-width: $breakpoint-sm) {
  .chat-view {
    height: calc(100vh - $header-height - 32px);
    max-width: 100%;

    &__messages {
      padding: 16px 0;
    }
  }
}
</style>

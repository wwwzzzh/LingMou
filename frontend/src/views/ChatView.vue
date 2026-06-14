<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { VideoPause, VideoPlay, Microphone, Promotion } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { useMediaDevice } from '@/composables/useMediaDevice'
import { generateId, formatTime } from '@/utils'
import { mockChatReply } from '@/api/modules/chat.mock'
import type { ChatMessage } from '@/types'

// ==================== Stores ====================
const chatStore = useChatStore()
const userStore = useUserStore()
const appStore = useAppStore()

// ==================== 媒体设备 ====================
const {
  stream,
  cameraEnabled,
  micEnabled,
  error: _deviceError,
  startDevice,
  toggleCamera,
  toggleMic,
  stopDevice,
} = useMediaDevice()

const videoRef = ref<HTMLVideoElement | null>(null)
const isCameraReady = ref(false)

watch(stream, (newStream) => {
  if (videoRef.value) {
    videoRef.value.srcObject = newStream
    isCameraReady.value = !!newStream
  }
})

// ==================== SpotlightCard + BorderGlow ====================
const videoWrapperRef = ref<HTMLElement | null>(null)
const spotlightX = ref(0)
const spotlightY = ref(0)
const edgeProximity = ref(0)
const cursorAngle = ref(0)

function handleVideoPointerMove(e: PointerEvent): void {
  const el = videoWrapperRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  spotlightX.value = x
  spotlightY.value = y

  // BorderGlow: 计算边缘距离和角度
  const cx = rect.width / 2
  const cy = rect.height / 2
  const dx = x - cx
  const dy = y - cy
  let kx = Infinity, ky = Infinity
  if (dx !== 0) kx = cx / Math.abs(dx)
  if (dy !== 0) ky = cy / Math.abs(dy)
  edgeProximity.value = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1)

  const radians = Math.atan2(dy, dx)
  let degrees = radians * (180 / Math.PI) + 90
  if (degrees < 0) degrees += 360
  cursorAngle.value = degrees
}

function handleVideoPointerLeave(): void {
  edgeProximity.value = 0
}

// ==================== 聊天 ====================
const chatContainerRef = ref<HTMLElement | null>(null)
const inputText = ref('')
const systemStatus = ref<'idle' | 'listening' | 'recognizing' | 'thinking' | 'replying'>('idle')

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '你好！我是灵眸AI 👋\n开启摄像头和麦克风后，我可以实时看到你的画面并回答你的问题。',
  type: 'text',
  timestamp: Date.now(),
}

onMounted(() => {
  if (chatStore.messages.length === 0) {
    chatStore.addMessage(WELCOME_MESSAGE)
  }
})

async function scrollToBottom(): Promise<void> {
  await nextTick()
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
  }
}

async function handleSend(): Promise<void> {
  const text = inputText.value.trim()
  if (!text) return

  const userMessage: ChatMessage = {
    id: generateId(),
    role: 'user',
    content: text,
    type: 'text',
    timestamp: Date.now(),
  }

  chatStore.addMessage(userMessage)
  inputText.value = ''
  await scrollToBottom()

  // 模拟 ASR → AI 流程
  systemStatus.value = 'thinking'
  chatStore.setLoading(true)
  const doneLoading = appStore.startLoading()

  try {
    const reply = await mockChatReply(userStore.sessionId || 'anonymous', text, [])
    systemStatus.value = 'replying'
    await new Promise(r => setTimeout(r, 400)) // 短暂显示"回复中"
    chatStore.addMessage(reply)
  } catch {
    chatStore.addMessage({
      id: generateId(),
      role: 'assistant',
      content: '抱歉，回复生成失败，请稍后重试。',
      type: 'text',
      timestamp: Date.now(),
    })
  } finally {
    chatStore.setLoading(false)
    doneLoading()
    systemStatus.value = 'idle'
    await scrollToBottom()
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 摄像头控制
async function handleToggleCamera(): Promise<void> {
  if (!cameraEnabled.value) await startDevice()
  else toggleCamera()
}

function handleToggleMic(): void {
  if (!stream.value) { startDevice(); return }
  toggleMic()
}

// 状态文字
const statusText: Record<string, string> = {
  idle: '',
  listening: '正在聆听...',
  recognizing: '正在识别语音...',
  thinking: 'AI 正在思考...',
  replying: 'AI 正在回复...',
}

const statusDots = ref([false, false, false])
let statusInterval: ReturnType<typeof setInterval> | null = null

watch(systemStatus, (val) => {
  if (val === 'thinking' || val === 'replying') {
    let i = 0
    statusInterval = setInterval(() => {
      statusDots.value = [false, false, false]
      statusDots.value[i % 3] = true
      i++
    }, 300)
  } else {
    if (statusInterval) { clearInterval(statusInterval); statusInterval = null }
    statusDots.value = [false, false, false]
  }
})

// 当前时间
const currentTime = ref('')
let timeInterval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  currentTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }, 1000)
})
onBeforeUnmount(() => {
  stopDevice()
  if (timeInterval) clearInterval(timeInterval)
  if (statusInterval) clearInterval(statusInterval)
})
</script>

<template>
  <div class="chat-layout">
    <!-- ========== 左侧：视觉区域 (75%) ========== -->
    <div class="visual-panel">
      <!-- 顶部状态栏 -->
      <div class="visual-panel__top-bar">
        <div class="status-dot" :class="{ 'is-active': cameraEnabled }" />
        <span class="status-label">{{ cameraEnabled ? '摄像头已开启' : '摄像头未开启' }}</span>
        <span class="status-time">{{ currentTime }}</span>
      </div>

      <!-- 摄像头画面 (SpotlightCard + BorderGlow) -->
      <div
        ref="videoWrapperRef"
        class="visual-panel__video-wrapper"
        :style="{
          '--spotlight-x': spotlightX + 'px',
          '--spotlight-y': spotlightY + 'px',
          '--edge-proximity': edgeProximity,
          '--cursor-angle': cursorAngle + 'deg',
        }"
        @pointermove="handleVideoPointerMove"
        @pointerleave="handleVideoPointerLeave"
      >
        <video
          v-show="cameraEnabled && stream"
          ref="videoRef"
          class="visual-panel__video"
          autoplay
          playsinline
          muted
        />
        <!-- 摄像头关闭占位 -->
        <div v-if="!cameraEnabled || !stream" class="visual-panel__placeholder">
          <el-icon :size="72" color="rgba(148,163,184,0.3)"><VideoPause /></el-icon>
          <p class="visual-panel__placeholder-text">摄像头未开启</p>
          <el-button type="primary" size="large" round @click="handleToggleCamera">
            开启摄像头
          </el-button>
        </div>
      </div>

      <!-- 底部控制栏：仅 2 个开关按钮 -->
      <div class="visual-panel__controls">
        <button
          class="ctrl-btn"
          :class="{ 'is-active': cameraEnabled }"
          @click="handleToggleCamera"
        >
          <el-icon :size="20"><VideoPlay v-if="!cameraEnabled" /><VideoPause v-else /></el-icon>
          <span class="ctrl-btn__label">{{ cameraEnabled ? '关闭' : '开启' }}</span>
        </button>
        <button
          class="ctrl-btn"
          :class="{ 'is-active': micEnabled }"
          @click="handleToggleMic"
        >
          <el-icon :size="20"><Microphone /></el-icon>
          <span class="ctrl-btn__label">{{ micEnabled ? '关闭' : '开启' }}</span>
        </button>
      </div>
    </div>

    <!-- ========== 右侧：聊天区域 (25%) ========== -->
    <div class="chat-panel">
      <!-- 顶部品牌 -->
      <div class="chat-panel__header">
        <div class="chat-panel__brand">
          <span class="brand-icon">👁️</span>
          <span class="brand-name">灵眸AI</span>
        </div>
        <div class="chat-panel__status-row">
          <span class="online-dot" />
          <span class="online-text">在线</span>
        </div>
        <p class="chat-panel__subtitle">视觉对话助手</p>
      </div>

      <!-- 消息区域 -->
      <div ref="chatContainerRef" class="chat-panel__messages">
        <TransitionGroup name="msg">
          <div
            v-for="msg in chatStore.messages"
            :key="msg.id"
            class="chat-msg"
            :class="{ 'chat-msg--user': msg.role === 'user', 'chat-msg--ai': msg.role === 'assistant' }"
          >
            <div class="chat-msg__bubble">
              <p class="chat-msg__text">{{ msg.content }}</p>
              <span class="chat-msg__time">{{ formatTime(msg.timestamp) }}</span>
            </div>
          </div>
        </TransitionGroup>

        <!-- Loading -->
        <div v-if="chatStore.isLoading" class="chat-msg chat-msg--ai">
          <div class="chat-msg__bubble chat-msg__bubble--loading">
            <span class="loading-dot" v-for="i in 3" :key="i" :class="{ 'is-lit': statusDots[i-1] }" />
          </div>
        </div>
      </div>

      <!-- 状态提示 -->
      <div v-if="systemStatus !== 'idle'" class="chat-panel__status">
        <span class="chat-panel__status-dot" :class="{ 'is-active': statusDots[0] }" />
        <span>{{ statusText[systemStatus] }}</span>
      </div>

      <!-- 输入区域 -->
      <div class="chat-panel__input-area">
        <div class="chat-input-row">
          <input
            v-model="inputText"
            class="chat-input-field"
            placeholder="输入消息..."
            @keydown="handleKeydown"
          />
          <button class="chat-send-btn" :class="{ 'is-ready': inputText.trim() }" @click="handleSend">
            <el-icon :size="18"><Promotion /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// ==========================================
// 灵眸AI 对话页面 — 企业级 75/25 分栏
// ==========================================

$panel-bg: #0f1119;
$card-bg: #181b26;
$border-subtle: rgba(255, 255, 255, 0.06);
$text-dim: rgba(148, 163, 184, 0.6);
$text-bright: #e2e8f0;
$accent: #6366f1;

.chat-layout {
  display: flex;
  height: 100vh;
  background: $panel-bg;
  overflow: hidden;
}

// ========== 左侧视觉面板 ==========
.visual-panel {
  flex: 0 0 75%;
  position: relative;
  background: #0a0c16;
  display: flex;
  align-items: center;
  justify-content: center;

  // 顶部状态栏
  &__top-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
    z-index: 10;
  }

  // 摄像头画面
  &__video-wrapper {
    width: calc(100% - 48px);
    height: calc(100% - 48px);
    margin: 24px;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.04),
                0 25px 80px rgba(0,0,0,0.5),
                inset 0 1px 0 rgba(255,255,255,0.03);
    position: relative;
    background: #0d0f17;

    // SpotlightCard: 鼠标跟随聚光灯
    &::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(
        600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
        rgba(99, 102, 241, 0.08),
        transparent 50%
      );
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none; z-index: 5;
    }

    &:hover::before { opacity: 1; }

    // BorderGlow: 边缘发光跟随
    &::after {
      content: '';
      position: absolute; inset: -2px;
      border-radius: 22px;
      background: conic-gradient(
        from var(--cursor-angle, 0deg) at 50% 50%,
        transparent,
        rgba(99, 102, 241, 0) 60%,
        rgba(99, 102, 241, calc(0.5 * var(--edge-proximity, 0))) 80%,
        rgba(139, 92, 246, calc(0.6 * var(--edge-proximity, 0))) 90%,
        transparent
      );
      opacity: var(--edge-proximity, 0);
      transition: opacity 0.15s;
      pointer-events: none; z-index: 4;
      mask: radial-gradient(
        farthest-side,
        transparent calc(100% - 3px),
        #000 calc(100% - 3px)
      );
    }
  }

  &__video {
    width: 100%; height: 100%;
    object-fit: cover;
    transform: scaleX(-1); // 镜像翻转，还原真实照镜子体验
  }

  &__placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  &__placeholder-text {
    font-size: 15px;
    color: $text-dim;
  }

  // 底部控制栏
  &__controls {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    padding: 10px 20px;
    background: rgba(24, 27, 38, 0.85);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 100px;
    z-index: 10;
  }
}

// 状态指示
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(248, 113, 113, 0.6);
  &.is-active {
    background: #22c55e;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  }
}
.status-label { font-size: 12px; color: $text-dim; }
.status-time { margin-left: auto; font-size: 13px; color: $text-bright; font-variant-numeric: tabular-nums; }

// 控制按钮
.ctrl-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(148, 163, 184, 0.6);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  white-space: nowrap;

  &__label { font-size: 12px; }

  &:hover { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.8); }

  // 灰色（关闭） / 红色（开启）
  &.is-active {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
    color: #ef4444;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.15);
    &:hover { background: rgba(239, 68, 68, 0.25); }
  }
}

// ========== 右侧聊天面板 ==========
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $card-bg;
  border-left: 1px solid $border-subtle;

  &__header {
    padding: 20px 20px 12px;
    border-bottom: 1px solid $border-subtle;
    flex-shrink: 0;
  }

  &__brand {
    display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
  }

  &__status-row {
    display: flex; align-items: center; gap: 6px; margin-bottom: 4px;
  }

  &__subtitle { font-size: 12px; color: $text-dim; margin: 0; }

  // 消息区
  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex; flex-direction: column;
  }

  // 状态提示
  &__status {
    padding: 8px 20px;
    font-size: 12px;
    color: $accent;
    display: flex; align-items: center; gap: 8px;
  }

  &__status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: $text-dim;
    &.is-active { background: $accent; }
  }

  // 输入区
  &__input-area {
    padding: 12px 16px 16px;
    border-top: 1px solid $border-subtle;
    flex-shrink: 0;
  }
}

.brand-icon { font-size: 22px; }
.brand-name { font-size: 17px; font-weight: 700; color: $text-bright; letter-spacing: 0.5px; }
.online-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; }
.online-text { font-size: 12px; color: #22c55e; }

// ========== 聊天消息 ==========
.chat-msg {
  display: flex;
  margin-bottom: 20px;

  &--user { justify-content: flex-end; }
  &--ai { justify-content: flex-start; }

  &__bubble {
    max-width: 75%;
    padding: 12px 16px;
    border-radius: 16px;
    position: relative;

    .chat-msg--user & {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .chat-msg--ai & {
      background: rgba(255,255,255,0.05);
      color: $text-bright;
      border: 1px solid rgba(255,255,255,0.06);
      border-bottom-left-radius: 4px;
    }

    &--loading {
      display: flex; gap: 5px; padding: 14px 18px;
    }
  }

  &__text {
    font-size: 13.5px; line-height: 1.65; margin: 0;
    white-space: pre-wrap; word-break: break-word;
  }

  &__time {
    display: block;
    font-size: 10px;
    margin-top: 6px;
    opacity: 0.5;
    text-align: right;
  }
}

// 输入框
.chat-input-row {
  display: flex; gap: 8px; align-items: center;
}
.chat-input-field {
  flex: 1;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 10px 14px;
  color: $text-bright;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  &:focus { border-color: $accent; }
  &::placeholder { color: $text-dim; }
}
.chat-send-btn {
  width: 38px; height: 38px;
  border-radius: 10px;
  border: none;
  background: rgba(255,255,255,0.06);
  color: $text-dim;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  &.is-ready { background: $accent; color: #fff; }
  &:hover { opacity: 0.9; }
}

// ========== Loading 点 ==========
.loading-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.15);
  transition: background 0.2s;
  &.is-lit { background: $accent; }
}

// ========== 消息动画 ==========
.msg-enter-active { transition: all 0.35s ease-out; }
.msg-enter-from { opacity: 0; transform: translateY(8px); }

// ========== 响应式 ==========
@media (max-width: 1024px) {
  .chat-layout { flex-direction: column; }
  .visual-panel { flex: 0 0 50vh; }
}
</style>

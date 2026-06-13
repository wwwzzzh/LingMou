<script setup lang="ts">
import { ref } from 'vue'
import { VideoPause, VideoPlay } from '@element-plus/icons-vue'
import type { ChatMessage } from '@/types'
import { formatTime } from '@/utils'

defineProps<{
  message: ChatMessage
}>()

/** 音频播放状态 */
const audioPlaying = ref(false)
const audioRef = ref<HTMLAudioElement | null>(null)
const audioProgress = ref(0)
const audioDuration = ref(0)

function toggleAudio(): void {
  if (!audioRef.value) return
  if (audioPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  audioPlaying.value = !audioPlaying.value
}

function onAudioTimeUpdate(): void {
  if (audioRef.value) {
    audioProgress.value = audioRef.value.currentTime
  }
}

function onAudioLoaded(): void {
  if (audioRef.value) {
    audioDuration.value = audioRef.value.duration
  }
}

function onAudioEnded(): void {
  audioPlaying.value = false
  audioProgress.value = 0
}

function formatAudioTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
</script>

<template>
  <div
    class="message-bubble"
    :class="{
      'message-bubble--user': message.role === 'user',
      'message-bubble--assistant': message.role === 'assistant',
    }"
  >
    <!-- 头像 -->
    <div class="message-bubble__avatar">
      <span v-if="message.role === 'user'">👤</span>
      <span v-else>🤖</span>
    </div>

    <!-- 内容区 -->
    <div class="message-bubble__body">
      <div class="message-bubble__header">
        <span class="message-bubble__role">
          {{ message.role === 'user' ? '你' : 'AI 助手' }}
        </span>
        <span class="message-bubble__time">{{ formatTime(message.timestamp) }}</span>
      </div>

      <!-- 文本消息 -->
      <div v-if="message.type === 'text'" class="message-bubble__content message-bubble__content--text">
        {{ message.content }}
      </div>

      <!-- 图片消息 -->
      <div v-else-if="message.type === 'image'" class="message-bubble__content message-bubble__content--image">
        <el-image
          :src="message.content"
          :preview-src-list="[message.content]"
          fit="cover"
          style="max-width: 320px; border-radius: 8px;"
          :preview-teleported="true"
        />
      </div>

      <!-- 语音消息 -->
      <div v-else-if="message.type === 'audio'" class="message-bubble__content message-bubble__content--audio">
        <div class="audio-player" @click="toggleAudio">
          <el-button :icon="audioPlaying ? VideoPause : VideoPlay" circle size="small" />
          <div class="audio-player__wave">
            <span v-for="i in 8" :key="i" class="audio-player__bar" :class="{ 'is-playing': audioPlaying }" />
          </div>
          <span class="audio-player__time">
            {{ audioPlaying ? formatAudioTime(audioProgress) : formatAudioTime(audioDuration) || '0:00' }}
          </span>
        </div>
        <audio
          ref="audioRef"
          :src="message.content"
          preload="metadata"
          @timeupdate="onAudioTimeUpdate"
          @loadedmetadata="onAudioLoaded"
          @ended="onAudioEnded"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.message-bubble {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  max-width: 80%;

  &--user {
    flex-direction: row-reverse;
    align-self: flex-end;
    margin-left: auto;

    .message-bubble__body {
      align-items: flex-end;
    }

    .message-bubble__header {
      flex-direction: row-reverse;
    }

    .message-bubble__content--text {
      background: $color-primary;
      color: #fff;
      border-radius: 16px 4px 16px 16px;
    }
  }

  &--assistant {
    .message-bubble__content--text {
      background: $bg-color-white;
      color: $text-primary;
      border-radius: 4px 16px 16px 16px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: $bg-color;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__role {
    font-size: 12px;
    font-weight: 600;
    color: $text-secondary;
  }

  &__time {
    font-size: 11px;
    color: $text-placeholder;
  }

  &__content {
    &--text {
      padding: 12px 16px;
      font-size: 14px;
      line-height: 1.7;
      word-break: break-word;
      white-space: pre-wrap;
    }

    &--image {
      padding: 0;
    }

    &--audio {
      padding: 0;
    }
  }
}

// 音频播放器
.audio-player {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: $bg-color;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;

  &:hover {
    background: $border-color-light;
  }

  &__wave {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 24px;
  }

  &__bar {
    width: 3px;
    height: 12px;
    background: $text-placeholder;
    border-radius: 2px;
    transition: height 0.1s;

    &.is-playing {
      animation: wave 0.6s ease-in-out infinite alternate;

      @for $i from 1 through 8 {
        &:nth-child(#{$i}) {
          animation-delay: #{$i * 0.08}s;
        }
      }
    }
  }

  &__time {
    font-size: 12px;
    color: $text-secondary;
    min-width: 32px;
  }
}

@keyframes wave {
  from { height: 6px; }
  to { height: 20px; }
}

// 响应式
@media (max-width: $breakpoint-sm) {
  .message-bubble {
    max-width: 92%;
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import type { VadState } from '@/utils/vad'

const props = defineProps<{
  volume: number
  vadState: VadState
  silenceDuration: number
  silenceTimeout: number
  isListening: boolean
  isSilenceTimedOut: boolean
}>()

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'stop'): void
}>()

/** 音量百分比 */
const volumePercent = computed(() => Math.round(props.volume * 100))

/** 音量条分段 (24段) */
const volumeBars = computed(() => {
  const count = 24
  const activeCount = Math.round(props.volume * count)
  return Array.from({ length: count }, (_, i) => i < activeCount)
})

/** 状态文本 */
const stateText = computed(() => {
  if (!props.isListening) return '未监听'
  switch (props.vadState) {
    case 'speaking': return '🔊 说话中'
    case 'silent': return '🔇 静音中'
    case 'listening': return '👂 监听中'
    case 'inactive': return '⏸️ 未启动'
    default: return '--'
  }
})

/** 状态颜色 */
const stateColor = computed(() => {
  switch (props.vadState) {
    case 'speaking': return '#67c23a'
    case 'silent': return '#e6a23c'
    default: return '#909399'
  }
})

/** 静音剩余时间 (秒) */
const silenceRemaining = computed(() => {
  if (props.vadState !== 'silent') return props.silenceTimeout / 1000
  const remaining = props.silenceTimeout - props.silenceDuration
  return Math.max(0, Math.ceil(remaining / 1000))
})

/** 静音进度百分比 */
const silenceProgress = computed(() => {
  return Math.min(100, (props.silenceDuration / props.silenceTimeout) * 100)
})
</script>

<template>
  <div class="voice-indicator">
    <!-- 状态行 -->
    <div class="voice-indicator__status">
      <span class="voice-indicator__state" :style="{ color: stateColor }">
        {{ stateText }}
      </span>
      <el-tag
        v-if="isListening"
        :type="vadState === 'speaking' ? 'success' : 'warning'"
        size="small"
      >
        {{ silenceRemaining }}s 后自动停止
      </el-tag>
    </div>

    <!-- 音量波形 -->
    <div class="voice-indicator__wave">
      <span
        v-for="(active, i) in volumeBars"
        :key="i"
        class="voice-indicator__bar"
        :class="{
          'is-active': active,
          'is-speaking': vadState === 'speaking' && active,
          'is-silent': vadState === 'silent',
        }"
      />
    </div>

    <!-- 音量数值 -->
    <div class="voice-indicator__info">
      <span class="voice-indicator__vol">音量: {{ volumePercent }}%</span>
      <div class="voice-indicator__threshold-line">
        <span class="voice-indicator__dot" />
        阈值线
      </div>
    </div>

    <!-- 静音倒计时条 -->
    <div v-if="vadState === 'silent' || isSilenceTimedOut" class="voice-indicator__countdown">
      <div class="voice-indicator__countdown-track">
        <div
          class="voice-indicator__countdown-fill"
          :class="{ 'is-timeout': isSilenceTimedOut }"
          :style="{ width: `${silenceProgress}%` }"
        />
      </div>
      <span v-if="isSilenceTimedOut" class="voice-indicator__timeout-text">
        ⚠️ 检测到持续静音，录音已自动停止
      </span>
      <span v-else class="voice-indicator__countdown-text">
        静音 {{ (silenceDuration / 1000).toFixed(1) }}s / {{ silenceTimeout / 1000 }}s
      </span>
    </div>

    <!-- 控制按钮 -->
    <div class="voice-indicator__actions">
      <el-button
        v-if="!isListening"
        type="primary"
        size="small"
        @click="emit('start')"
      >
        开始语音检测
      </el-button>
      <el-button
        v-else
        type="danger"
        size="small"
        @click="emit('stop')"
      >
        停止语音检测
      </el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.voice-indicator {
  background: $bg-color-white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-top: 16px;

  &__status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__state {
    font-size: 15px;
    font-weight: 600;
    transition: color 0.3s;
  }

  // 波形
  &__wave {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 48px;
    margin-bottom: 12px;
  }

  &__bar {
    flex: 1;
    background: $border-color-light;
    border-radius: 2px;
    height: 6px;
    transition: all 0.15s ease;

    &.is-active {
      height: 24px;
      background: $color-primary;
    }

    &.is-speaking {
      height: 42px;
      background: $color-success;
    }

    &.is-silent {
      background: $color-warning;
      opacity: 0.6;
    }
  }

  &__info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 12px;
    color: $text-secondary;
  }

  &__threshold-line {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $color-warning;
  }

  // 静音倒计时
  &__countdown {
    margin-bottom: 16px;
  }

  &__countdown-track {
    height: 4px;
    background: $border-color-light;
    border-radius: 2px;
    margin-bottom: 6px;
    overflow: hidden;
  }

  &__countdown-fill {
    height: 100%;
    background: $color-warning;
    border-radius: 2px;
    transition: width 0.1s linear;

    &.is-timeout {
      background: $color-danger;
    }
  }

  &__countdown-text {
    font-size: 11px;
    color: $text-secondary;
  }

  &__timeout-text {
    font-size: 12px;
    color: $color-danger;
    font-weight: 500;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}
</style>

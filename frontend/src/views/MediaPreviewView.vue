<script setup lang="ts">
import { ref, computed } from 'vue'
import CameraPreview from '@/components/CameraPreview.vue'
import FrameCapturePanel from '@/components/FrameCapturePanel.vue'
import VoiceIndicator from '@/components/VoiceIndicator.vue'
import { useFrameCapture } from '@/composables/useFrameCapture'
import { useVoiceDetector } from '@/composables/useVoiceDetector'

/** CameraPreview 组件实例 */
const cameraRef = ref<InstanceType<typeof CameraPreview> | null>(null)

/**
 * 从 CameraPreview 暴露的 videoRef 派生帧捕获所需的视频引用
 */
const activeVideoRef = computed(() => {
  return cameraRef.value?.videoRef ?? null
})

/**
 * 从 CameraPreview 暴露的 stream 派生语音检测所需的媒体流
 */
const activeStream = computed(() => {
  return cameraRef.value?.stream ?? null
})

// 帧捕获
const {
  isCapturing,
  isUploading,
  stats,
  logs,
  startCapture,
  stopCapture,
} = useFrameCapture(activeVideoRef)

// 语音活动检测
const {
  volume,
  vadState,
  silenceDuration,
  silenceTimeout,
  isSilenceTimedOut,
  isListening,
  start: startVad,
  stop: stopVad,
} = useVoiceDetector(activeStream)
</script>

<template>
  <div class="media-preview-view">
    <CameraPreview ref="cameraRef" />
    <div class="media-preview-view__panels">
      <VoiceIndicator
        :volume="volume"
        :vad-state="vadState"
        :silence-duration="silenceDuration"
        :silence-timeout="silenceTimeout"
        :is-listening="isListening"
        :is-silence-timed-out="isSilenceTimedOut"
        @start="startVad"
        @stop="stopVad"
      />
      <FrameCapturePanel
        :is-capturing="isCapturing"
        :is-uploading="isUploading"
        :stats="stats"
        :logs="logs"
        @start="startCapture"
        @stop="stopCapture"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.media-preview-view {
  height: 100%;

  &__panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 24px;

    @media (max-width: $breakpoint-sm) {
      grid-template-columns: 1fr;
    }
  }
}
</style>

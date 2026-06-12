<script setup lang="ts">
import { ref, computed } from 'vue'
import CameraPreview from '@/components/CameraPreview.vue'
import FrameCapturePanel from '@/components/FrameCapturePanel.vue'
import { useFrameCapture } from '@/composables/useFrameCapture'

/** CameraPreview 组件实例 */
const cameraRef = ref<InstanceType<typeof CameraPreview> | null>(null)

/**
 * 从 CameraPreview 暴露的 videoRef 派生帧捕获所需的视频引用
 * 组件挂载前返回 null，挂载后绑定实际 video 元素
 */
const activeVideoRef = computed(() => {
  return cameraRef.value?.videoRef ?? null
})

const {
  isCapturing,
  isUploading,
  stats,
  logs,
  startCapture,
  stopCapture,
} = useFrameCapture(activeVideoRef)
</script>

<template>
  <div class="media-preview-view">
    <CameraPreview ref="cameraRef" />
    <FrameCapturePanel
      :is-capturing="isCapturing"
      :is-uploading="isUploading"
      :stats="stats"
      :logs="logs"
      @start="startCapture"
      @stop="stopCapture"
    />
  </div>
</template>

<style lang="scss" scoped>
.media-preview-view {
  height: 100%;
}
</style>

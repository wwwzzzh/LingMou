<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { VideoPause, VideoPlay, Microphone, Promotion } from '@element-plus/icons-vue'
import { useMediaDevice } from '@/composables/useMediaDevice'

const {
  stream,
  cameraEnabled,
  micEnabled,
  error,
  startDevice,
  toggleCamera,
  toggleMic,
  stopDevice,
  clearError,
} = useMediaDevice()

/** 视频元素引用 */
const videoRef = ref<HTMLVideoElement | null>(null)

/** 设备是否已初始化 */
const isInitialized = ref(false)

// 当 stream 变化时绑定到 video 元素
watch(stream, (newStream) => {
  if (videoRef.value) {
    videoRef.value.srcObject = newStream
  }
})

/**
 * 初始化设备（首次点击）
 */
async function handleInit(): Promise<void> {
  await startDevice()
  if (!error.value) {
    isInitialized.value = true
  }
}

/**
 * 处理摄像头切换
 */
async function handleToggleCamera(): Promise<void> {
  if (!isInitialized.value) {
    await handleInit()
    return
  }
  toggleCamera()
}

/**
 * 处理麦克风切换
 */
async function handleToggleMic(): Promise<void> {
  if (!isInitialized.value) {
    await handleInit()
    return
  }
  toggleMic()
}

/**
 * 处理重新尝试（错误后）
 */
function handleRetry(): void {
  clearError()
  isInitialized.value = false
  startDevice().then(() => {
    if (!error.value) {
      isInitialized.value = true
    }
  })
}

// 组件卸载时释放设备
onBeforeUnmount(() => {
  stopDevice()
})
</script>

<template>
  <div class="camera-preview">
    <!-- 视频区域 -->
    <div class="camera-preview__video-section">
      <div class="video-container">
        <!-- 未初始化状态的占位 -->
        <div v-if="!stream || !cameraEnabled" class="video-placeholder">
          <el-icon :size="64" color="#c0c4cc">
            <VideoPlay />
          </el-icon>
          <p class="video-placeholder__text">
            {{ error ? '设备访问异常' : '点击"开启摄像头"开始预览' }}
          </p>
        </div>

        <!-- 视频流 -->
        <video
          ref="videoRef"
          class="camera-preview__video"
          :class="{ 'is-hidden': !stream || !cameraEnabled }"
          autoplay
          playsinline
          muted
        />

        <!-- 设备状态指示 -->
        <div class="video-status-bar">
          <el-tag :type="cameraEnabled ? 'success' : 'info'" size="small" effect="dark">
            📷 {{ cameraEnabled ? '摄像头已开启' : '摄像头已关闭' }}
          </el-tag>
          <el-tag :type="micEnabled ? 'success' : 'info'" size="small" effect="dark">
            🎙️ {{ micEnabled ? '麦克风已开启' : '麦克风已关闭' }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 控制面板 -->
    <div class="camera-preview__control-section">
      <div class="control-panel">
        <h3 class="control-panel__title">设备控制</h3>
        <p class="control-panel__desc">
          管理摄像头和麦克风的实时采集
        </p>

        <!-- 错误提示 -->
        <el-alert
          v-if="error"
          :title="error.message"
          :type="error.type === 'PERMISSION_DENIED' ? 'warning' : 'error'"
          :closable="false"
          show-icon
          class="control-panel__error"
        >
          <template #default>
            <el-button
              v-if="error.type === 'PERMISSION_DENIED'"
              type="warning"
              size="small"
              text
              @click="handleRetry"
            >
              重新尝试
            </el-button>
            <el-button
              v-else
              type="primary"
              size="small"
              text
              @click="handleRetry"
            >
              重试
            </el-button>
          </template>
        </el-alert>

        <!-- 摄像头控制 -->
        <div class="control-group">
          <div class="control-group__info">
            <span class="control-group__label">摄像头</span>
            <span class="control-group__desc">
              {{ cameraEnabled ? '视频采集进行中' : '点击下方按钮开启' }}
            </span>
          </div>
          <el-button
            :type="cameraEnabled ? 'danger' : 'primary'"
            :icon="cameraEnabled ? VideoPause : VideoPlay"
            size="large"
            class="control-group__btn"
            @click="handleToggleCamera"
          >
            {{ cameraEnabled ? '关闭摄像头' : '开启摄像头' }}
          </el-button>
        </div>

        <!-- 麦克风控制 -->
        <div class="control-group">
          <div class="control-group__info">
            <span class="control-group__label">麦克风</span>
            <span class="control-group__desc">
              {{ micEnabled ? '音频采集进行中' : '点击下方按钮开启' }}
            </span>
          </div>
          <el-button
            :type="micEnabled ? 'danger' : 'primary'"
            :icon="micEnabled ? Promotion : Microphone"
            size="large"
            class="control-group__btn"
            @click="handleToggleMic"
          >
            {{ micEnabled ? '关闭麦克风' : '开启麦克风' }}
          </el-button>
        </div>

        <!-- 设备提示 -->
        <el-divider />
        <div class="permission-tips">
          <h4 class="permission-tips__title">权限说明</h4>
          <ul class="permission-tips__list">
            <li>首次使用需授权摄像头与麦克风权限</li>
            <li>如被拒绝，请在浏览器地址栏左侧重新开启</li>
            <li>关闭页面或组件时自动释放设备</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.camera-preview {
  display: flex;
  gap: 24px;
  height: calc(100vh - $header-height - 48px - 32px); // 减去 header + padding + footer
  min-height: 520px;
}

// ============= 视频区域 =============
.camera-preview__video-section {
  flex: 1;
  min-width: 0;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-placeholder {
  text-align: center;
  z-index: 1;

  &__text {
    margin-top: 16px;
    font-size: 15px;
    color: $text-placeholder;
  }
}

.camera-preview__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;

  &.is-hidden {
    opacity: 0;
  }
}

.video-status-bar {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 8px;
  z-index: 2;
}

// ============= 控制面板 =============
.camera-preview__control-section {
  width: 360px;
  flex-shrink: 0;
}

.control-panel {
  background: $bg-color-white;
  border-radius: 12px;
  padding: 28px 24px;
  height: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 4px;
  }

  &__desc {
    font-size: 13px;
    color: $text-secondary;
    margin-bottom: 24px;
  }

  &__error {
    margin-bottom: 20px;
  }
}

// 控制组
.control-group {
  background: $bg-color;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  &__info {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }

  &__label {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 2px;
  }

  &__desc {
    font-size: 12px;
    color: $text-secondary;
  }

  &__btn {
    width: 100%;
  }
}

// 权限说明
.permission-tips {
  margin-top: auto;

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 8px;
  }

  &__list {
    padding-left: 18px;
    font-size: 12px;
    color: $text-secondary;
    line-height: 2;

    li {
      list-style: disc;
    }
  }
}

// ============= 响应式 =============
@media (max-width: $breakpoint-sm) {
  .camera-preview {
    flex-direction: column;
    height: auto;
  }

  .camera-preview__video-section {
    height: 320px;
  }

  .camera-preview__control-section {
    width: 100%;
  }

  .control-panel {
    height: auto;
  }
}
</style>

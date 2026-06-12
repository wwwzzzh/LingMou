<script setup lang="ts">
import { computed } from 'vue'
import { VideoCamera, Upload, DataAnalysis } from '@element-plus/icons-vue'
import type { FrameStats } from '@/composables/useFrameCapture'

const props = defineProps<{
  isCapturing: boolean
  isUploading: boolean
  stats: FrameStats
  logs: string[]
}>()

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'stop'): void
}>()

/** 节省率数值 */
const savingsPercent = computed(() => {
  return parseInt(props.stats.savingsRate) || 0
})

/** 节省率颜色 */
const savingsColor = computed(() => {
  if (savingsPercent.value >= 50) return '#67c23a'
  if (savingsPercent.value >= 20) return '#e6a23c'
  return '#909399'
})
</script>

<template>
  <div class="frame-capture-panel">
    <h3 class="frame-capture-panel__title">帧捕获控制</h3>
    <p class="frame-capture-panel__desc">
      每秒 1 帧 · 画面变化 &gt;15% 上传 · JPEG 最长边 1024px · 质量 0.7
    </p>

    <!-- 控制按钮 -->
    <div class="capture-controls">
      <el-button
        v-if="!isCapturing"
        type="success"
        size="large"
        :icon="VideoCamera"
        class="capture-controls__btn"
        @click="emit('start')"
      >
        开始帧捕获
      </el-button>
      <el-button
        v-else
        type="danger"
        size="large"
        class="capture-controls__btn"
        @click="emit('stop')"
      >
        停止帧捕获
      </el-button>

      <el-tag v-if="isCapturing" type="success" effect="dark" size="small">
        ● 采集中
      </el-tag>
      <el-tag v-if="isUploading" type="warning" effect="dark" size="small">
        ↑ 上传中
      </el-tag>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <el-icon :size="20" color="#409eff"><VideoCamera /></el-icon>
        <div class="stat-card__value">{{ stats.totalCaptured }}</div>
        <div class="stat-card__label">捕获帧数</div>
      </div>
      <div class="stat-card">
        <el-icon :size="20" color="#67c23a"><Upload /></el-icon>
        <div class="stat-card__value">{{ stats.totalUploaded }}</div>
        <div class="stat-card__label">上传次数</div>
      </div>
      <div class="stat-card">
        <el-icon :size="20" color="#e6a23c"><DataAnalysis /></el-icon>
        <div class="stat-card__value">{{ stats.totalSkipped }}</div>
        <div class="stat-card__label">跳过帧数</div>
      </div>
    </div>

    <!-- 节省率 -->
    <div class="savings-bar">
      <span class="savings-bar__label">上传节省率</span>
      <div class="savings-bar__track">
        <div
          class="savings-bar__fill"
          :style="{ width: stats.savingsRate, backgroundColor: savingsColor }"
        />
      </div>
      <span class="savings-bar__value" :style="{ color: savingsColor }">
        {{ stats.savingsRate }}
      </span>
    </div>

    <!-- 日志区域（仅开发环境） -->
    <div v-if="logs.length > 0" class="capture-logs">
      <h4 class="capture-logs__title">运行日志</h4>
      <div class="capture-logs__list">
        <p v-for="(log, i) in logs.slice(0, 15)" :key="i" class="capture-logs__entry">
          {{ log }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.frame-capture-panel {
  background: $bg-color-white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  margin-top: 24px;

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 4px;
  }

  &__desc {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 20px;
  }
}

.capture-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  &__btn {
    flex: 1;
  }
}

// 统计卡片
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: $bg-color;
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;

  &__value {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    margin: 4px 0;
  }

  &__label {
    font-size: 11px;
    color: $text-secondary;
  }
}

// 节省率进度条
.savings-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

  &__label {
    font-size: 12px;
    color: $text-secondary;
    white-space: nowrap;
  }

  &__track {
    flex: 1;
    height: 8px;
    background: $border-color-light;
    border-radius: 4px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.4s ease, background-color 0.4s;
    min-width: 0;
  }

  &__value {
    font-size: 14px;
    font-weight: 700;
    min-width: 36px;
    text-align: right;
  }
}

// 日志
.capture-logs {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 12px;
  max-height: 280px;
  overflow-y: auto;

  &__title {
    font-size: 12px;
    color: #8b949e;
    margin-bottom: 8px;
  }

  &__entry {
    font-size: 11px;
    color: #c9d1d9;
    font-family: 'Courier New', monospace;
    line-height: 1.8;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    padding: 2px 0;
  }
}
</style>

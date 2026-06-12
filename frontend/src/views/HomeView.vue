<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToChat(): void {
  router.push('/chat')
}

function goToMediaPreview(): void {
  router.push('/media-preview')
}
</script>

<template>
  <div class="home-view">
    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero__content">
        <h2 class="hero__title">开启智能视觉对话体验</h2>
        <p class="hero__description">
          基于多模态大模型的实时视觉语音助手。
          支持摄像头采集、语音交互、智能图片分析，让 AI 真正"看懂"你的世界。
        </p>
        <div class="hero__actions">
          <el-button type="primary" size="large" round @click="goToChat">
            💬 开始对话
          </el-button>
          <el-button size="large" round @click="goToMediaPreview">
            📷 设备预览
          </el-button>
        </div>
      </div>
    </section>

    <!-- 功能概览 -->
    <section class="features">
      <h3 class="features__title">核心能力</h3>
      <el-row :gutter="24">
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="feature-card">
            <div class="feature-card__icon">📷</div>
            <h4 class="feature-card__title">实时视觉采集</h4>
            <p class="feature-card__desc">摄像头实时画面采集，Canvas 智能抽帧</p>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="feature-card">
            <div class="feature-card__icon">🎙️</div>
            <h4 class="feature-card__title">语音交互</h4>
            <p class="feature-card__desc">VAD 语音活动检测，端侧成本控制</p>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="feature-card">
            <div class="feature-card__icon">🧠</div>
            <h4 class="feature-card__title">多模态理解</h4>
            <p class="feature-card__desc">视觉+文本多模态大模型驱动</p>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <div class="feature-card">
            <div class="feature-card__icon">🗣️</div>
            <h4 class="feature-card__title">语音合成</h4>
            <p class="feature-card__desc">TTS 语音回复，自然对话体验</p>
          </div>
        </el-col>
      </el-row>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
}

// Hero
.hero {
  text-align: center;
  padding: 80px 20px 60px;

  &__title {
    font-size: 36px;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 16px;
    letter-spacing: 1px;
  }

  &__description {
    font-size: 16px;
    color: $text-secondary;
    max-width: 640px;
    margin: 0 auto 32px;
    line-height: 1.8;
  }

  &__actions {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
}

// Features
.features {
  padding: 40px 0 80px;

  &__title {
    text-align: center;
    font-size: 24px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 40px;
  }
}

.feature-card {
  background: $bg-color-white;
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 16px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  &__icon {
    font-size: 40px;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 8px;
  }

  &__desc {
    font-size: 13px;
    color: $text-secondary;
    line-height: 1.6;
  }
}

// 响应式
@media (max-width: $breakpoint-sm) {
  .hero {
    padding: 40px 16px 32px;

    &__title {
      font-size: 24px;
    }

    &__actions {
      flex-direction: column;
      align-items: center;
    }
  }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => route.meta.title || 'AI 视觉对话助手')
</script>

<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="app-header__inner">
        <h1 class="app-header__title">👁️ AI 视觉对话助手</h1>
        <span class="app-header__subtitle">{{ pageTitle }}</span>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- 底部状态栏 -->
    <footer class="app-footer">
      <span>&copy; 2025 AI Vision Assistant</span>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $bg-color;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: $header-height;
  background-color: $bg-color-white;
  border-bottom: 1px solid $border-color-light;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;

  &__inner {
    width: 100%;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    align-items: center;
    gap: 16px;

    // 1920: 宽屏大桌面
    @media (min-width: $breakpoint-xl) {
      max-width: 1600px;
      padding: 0 40px;
    }

    // 1440: 标准桌面
    @media (max-width: $breakpoint-lg) {
      max-width: 1280px;
      padding: 0 28px;
    }

    // 1280: 小桌面
    @media (max-width: $breakpoint-md) {
      padding: 0 20px;
    }

    // 768: 平板
    @media (max-width: $breakpoint-sm) {
      padding: 0 16px;
      gap: 10px;
    }

    // 375: 手机
    @media (max-width: $breakpoint-xs) {
      padding: 0 12px;
      gap: 8px;
    }
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    letter-spacing: 0.5px;

    @media (max-width: $breakpoint-sm) {
      font-size: 16px;
    }

    @media (max-width: $breakpoint-xs) {
      font-size: 14px;
    }
  }

  &__subtitle {
    font-size: 13px;
    color: $text-secondary;
    padding-left: 16px;
    border-left: 1px solid $border-color-light;

    @media (max-width: $breakpoint-xs) {
      display: none;
    }
  }
}

.app-main {
  flex: 1;
  width: 100%;
  margin: 0 auto;
  padding: 32px;

  // 1920
  @media (min-width: $breakpoint-xl) {
    max-width: 1600px;
    padding: 40px;
  }

  // 1440
  @media (max-width: $breakpoint-lg) {
    max-width: 1280px;
    padding: 28px;
  }

  // 1280
  @media (max-width: $breakpoint-md) {
    padding: 20px;
  }

  // 768
  @media (max-width: $breakpoint-sm) {
    padding: 16px;
  }

  // 375
  @media (max-width: $breakpoint-xs) {
    padding: 12px;
  }
}

.app-footer {
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: $text-placeholder;
  border-top: 1px solid $border-color-light;

  @media (max-width: $breakpoint-xs) {
    padding: 12px 8px;
    font-size: 11px;
  }
}
</style>

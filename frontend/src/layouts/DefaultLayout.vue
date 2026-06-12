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
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    color: $text-primary;
    letter-spacing: 0.5px;
  }

  &__subtitle {
    font-size: 13px;
    color: $text-secondary;
    padding-left: 16px;
    border-left: 1px solid $border-color-light;
  }
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.app-footer {
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: $text-placeholder;
  border-top: 1px solid $border-color-light;
}
</style>

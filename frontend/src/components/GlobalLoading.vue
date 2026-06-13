<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const visible = computed(() => appStore.loadingCount > 0)
</script>

<template>
  <Transition name="loading-fade">
    <div v-if="visible" class="global-loading">
      <div class="global-loading__overlay" />
      <div class="global-loading__spinner">
        <div class="spinner-ring" />
        <p class="spinner-text">加载中...</p>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.global-loading {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(2px);
  }

  &__spinner {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
}

// 旋转环
.spinner-ring {
  width: 40px;
  height: 40px;
  border: 3px solid $border-color-light;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-text {
  font-size: 13px;
  color: $text-secondary;
  letter-spacing: 0.5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 过渡
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.25s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>

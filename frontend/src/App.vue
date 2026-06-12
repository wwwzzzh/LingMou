<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import GlobalLoading from '@/components/GlobalLoading.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

/** 网络状态监听 */
function handleOnline(): void {
  appStore.setOnline(true)
}

function handleOffline(): void {
  appStore.setOnline(false)
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onBeforeUnmount(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <!-- 离线提示 -->
  <div v-if="!appStore.isOnline" class="offline-banner">
    ⚠️ 网络连接已断开，部分功能不可用
  </div>

  <DefaultLayout />

  <!-- 全局加载遮罩 -->
  <GlobalLoading />
</template>

<style lang="scss">
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  background: $color-warning;
  color: #fff;
  text-align: center;
  padding: 8px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
</style>

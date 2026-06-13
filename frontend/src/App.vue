<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import GlobalLoading from '@/components/GlobalLoading.vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const appStore = useAppStore()

/** 首页全屏模式，不使用 DefaultLayout */
const isBlankLayout = computed(() => route.meta.layout === 'blank')

function handleOnline(): void { appStore.setOnline(true) }
function handleOffline(): void { appStore.setOnline(false) }

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
  <div v-if="!appStore.isOnline" class="offline-banner">
    ⚠️ 网络连接已断开，部分功能不可用
  </div>

  <template v-if="isBlankLayout">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" :key="$route.fullPath" />
      </transition>
    </router-view>
  </template>

  <DefaultLayout v-else />

  <GlobalLoading />
</template>

<style lang="scss">
.offline-banner {
  position: fixed;
  top: 0; left: 0; right: 0; z-index: 10000;
  background: $color-warning;
  color: #fff; text-align: center;
  padding: 8px; font-size: 13px; font-weight: 500;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>

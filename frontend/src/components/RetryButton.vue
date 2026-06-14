<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  loading?: boolean
  retryCount?: number
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()

/** 最大重试次数 */
const MAX_RETRIES = 3

const internalRetryCount = ref(0)

function handleRetry(): void {
  if (internalRetryCount.value >= MAX_RETRIES) return
  internalRetryCount.value++
  emit('retry')
}

const canRetry = () => internalRetryCount.value < MAX_RETRIES
</script>

<template>
  <div class="retry-button">
    <p v-if="internalRetryCount > 0" class="retry-button__hint">
      已重试 {{ internalRetryCount }}/{{ MAX_RETRIES }} 次
    </p>
    <el-button
      type="primary"
      :loading="loading"
      :disabled="!canRetry()"
      @click="handleRetry"
    >
      {{ canRetry() ? '重试' : '已达最大重试次数' }}
    </el-button>
    <el-button
      v-if="internalRetryCount >= MAX_RETRIES"
      text
      type="info"
      @click="internalRetryCount = 0"
    >
      重置
    </el-button>
  </div>
</template>

<style lang="scss" scoped>
.retry-button {
  display: flex;
  align-items: center;
  gap: 12px;

  &__hint {
    font-size: 12px;
    color: $text-secondary;
  }
}
</style>

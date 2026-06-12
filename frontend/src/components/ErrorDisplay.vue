<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'

defineProps<{
  message: string
  showRetry?: boolean
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div class="error-display">
    <el-result
      icon="error"
      :title="message"
      sub-title="请检查网络连接或稍后重试"
    >
      <template #icon>
        <el-icon :size="56" color="#f56c6c">
          <WarningFilled />
        </el-icon>
      </template>
      <template #extra v-if="showRetry">
        <el-button type="primary" @click="emit('retry')">
          重新尝试
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<style lang="scss" scoped>
.error-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}
</style>

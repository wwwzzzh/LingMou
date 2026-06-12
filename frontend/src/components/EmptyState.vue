<script setup lang="ts">
import { FolderOpened } from '@element-plus/icons-vue'

defineProps<{
  description?: string
  actionText?: string
}>()

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="empty-state">
    <el-result
      icon="info"
      :title="description || '暂无数据'"
      sub-title="当前区域暂无内容"
    >
      <template #icon>
        <el-icon :size="56" color="#c0c4cc">
          <FolderOpened />
        </el-icon>
      </template>
      <template #extra v-if="actionText">
        <el-button type="primary" @click="emit('action')">
          {{ actionText }}
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}
</style>

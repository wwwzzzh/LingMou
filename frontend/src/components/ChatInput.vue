<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Promotion } from '@element-plus/icons-vue'

const emit = defineEmits<{
  (e: 'send', content: string): void
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

/**
 * 发送消息
 */
function handleSend(): void {
  const text = inputText.value.trim()
  if (!text) return

  emit('send', text)
  inputText.value = ''

  // 发送后重新聚焦输入框
  nextTick(() => {
    textareaRef.value?.focus()
  })
}

/**
 * 处理键盘事件
 * Enter → 发送
 * Shift+Enter → 换行
 */
function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="chat-input">
    <div class="chat-input__wrapper">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="chat-input__textarea"
        placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
        rows="1"
        @keydown="handleKeydown"
      />
      <el-button
        class="chat-input__send-btn"
        type="primary"
        :icon="Promotion"
        :disabled="!inputText.trim()"
        @click="handleSend"
      >
        发送
      </el-button>
    </div>
    <p class="chat-input__hint">
      Enter 发送 · Shift + Enter 换行
    </p>
  </div>
</template>

<style lang="scss" scoped>
.chat-input {
  padding: 16px 0 0;

  &__wrapper {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    background: $bg-color-white;
    border: 1px solid $border-color-base;
    border-radius: 16px;
    padding: 12px 16px;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus-within {
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
    }
  }

  &__textarea {
    flex: 1;
    border: none;
    outline: none;
    resize: none;
    font-size: 14px;
    font-family: inherit;
    line-height: 1.6;
    color: $text-primary;
    background: transparent;
    max-height: 120px;
    min-height: 24px;

    &::placeholder {
      color: $text-placeholder;
    }
  }

  &__send-btn {
    flex-shrink: 0;
    border-radius: 10px;
  }

  &__hint {
    text-align: center;
    font-size: 11px;
    color: $text-placeholder;
    margin-top: 8px;
  }
}
</style>

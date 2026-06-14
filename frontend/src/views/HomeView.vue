<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isVisible = ref(false)

// ========== GradientText 动画驱动 ==========
const gradientPos = ref(0)
let gradientRafId: number | null = null

function animateGradient(): void {
  gradientPos.value = (gradientPos.value + 0.15) % 100
  gradientRafId = requestAnimationFrame(animateGradient)
}

// ========== ShinyText 动画驱动 ==========
const shinePos = ref(0)
let shineRafId: number | null = null

function animateShine(): void {
  shinePos.value = (shinePos.value + 0.12) % 100
  shineRafId = requestAnimationFrame(animateShine)
}

onMounted(() => {
  requestAnimationFrame(() => { isVisible.value = true })
  gradientRafId = requestAnimationFrame(animateGradient)
  shineRafId = requestAnimationFrame(animateShine)
})

onBeforeUnmount(() => {
  if (gradientRafId) cancelAnimationFrame(gradientRafId)
  if (shineRafId) cancelAnimationFrame(shineRafId)
})

function handleStart(): void {
  router.push('/chat')
}
</script>

<template>
  <div class="landing">
    <!-- 动态光斑背景 -->
    <div class="landing__bg">
      <div class="landing__orb landing__orb--1" />
      <div class="landing__orb landing__orb--2" />
      <div class="landing__orb landing__orb--3" />
    </div>

    <!-- 主内容 -->
    <div class="landing__content" :class="{ 'is-visible': isVisible }">
      <div class="landing__brand">
        <p class="landing__eyebrow">AI VISION ASSISTANT</p>
        <!-- GradientText: 动态流动渐变 -->
        <h1
          class="landing__title"
          :style="{
            backgroundPosition: `${gradientPos}% 50%`,
          }"
        >
          灵眸AI
        </h1>
        <!-- ShinyText: 光泽扫过 -->
        <p
          class="landing__subtitle"
          :style="{
            backgroundPosition: `${200 - shinePos * 2}% center`,
          }"
        >
          看见世界，理解世界，与世界对话
        </p>
      </div>

      <button class="landing__cta" @click="handleStart">
        <span class="landing__cta-text">开始AI对话</span>
        <span class="landing__cta-arrow">→</span>
      </button>

      <p class="landing__hint">基于多模态大模型的实时视觉语音助手</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.landing {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0a0e27 0%, #0f1435 25%, #12103a 50%, #0a0c24 75%, #060810 100%);
  overflow: hidden;
}

.landing__bg { position: absolute; inset: 0; pointer-events: none; }

.landing__orb {
  position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.15;
  animation: orbFloat 20s ease-in-out infinite;
  &--1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(59,130,246,0.3), transparent 70%); top: -15%; left: -10%; animation-duration: 22s; }
  &--2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%); bottom: -10%; right: -8%; animation-delay: -7s; animation-duration: 18s; }
  &--3 { width: 350px; height: 350px; background: radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%); top: 40%; left: 50%; animation-delay: -14s; animation-duration: 16s; transform: translate(-50%, -50%); }
}

@keyframes orbFloat {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(30px, -20px); }
  50% { transform: translate(-15px, 25px); }
  75% { transform: translate(20px, 10px); }
}

.landing__content {
  position: relative; z-index: 1; text-align: center;
  opacity: 0; transform: translateY(20px);
  transition: opacity 0.9s ease, transform 0.9s ease;
  &.is-visible { opacity: 1; transform: translateY(0); }
}

.landing__brand { margin-bottom: 48px; }

.landing__eyebrow {
  font-size: 12px; font-weight: 500; letter-spacing: 6px;
  color: rgba(148, 163, 184, 0.6); text-transform: uppercase; margin-bottom: 20px;
}

// GradientText: 动态流动渐变标题
.landing__title {
  font-size: 96px; font-weight: 800; letter-spacing: -2px; line-height: 1; margin-bottom: 24px;
  background-image: linear-gradient(to right, #38bdf8, #818cf8, #a78bfa, #c084fc, #38bdf8);
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 40px rgba(99, 102, 241, 0.3))
          drop-shadow(0 0 80px rgba(56, 189, 248, 0.15));
}

// ShinyText: 光泽扫过副标题
.landing__subtitle {
  font-size: 18px; font-weight: 300; letter-spacing: 4px;
  background-image: linear-gradient(120deg,
    rgba(203, 213, 225, 0.4) 0%,
    rgba(203, 213, 225, 0.4) 35%,
    rgba(255, 255, 255, 0.85) 50%,
    rgba(203, 213, 225, 0.4) 65%,
    rgba(203, 213, 225, 0.4) 100%);
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.landing__cta {
  display: inline-flex; align-items: center; gap: 12px;
  padding: 18px 48px; font-size: 17px; font-weight: 500; color: #fff;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
  border: none; border-radius: 100px; cursor: pointer; letter-spacing: 1px;
  box-shadow: 0 4px 24px rgba(59,130,246,0.25), 0 8px 48px rgba(99,102,241,0.15);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(59,130,246,0.35), 0 12px 56px rgba(99,102,241,0.25); }
  &:active { transform: translateY(0); transition: transform 0.1s ease; }
}

.landing__cta-arrow {
  font-size: 20px; transition: transform 0.3s ease;
  .landing__cta:hover & { transform: translateX(4px); }
}

.landing__hint {
  margin-top: 32px; font-size: 13px;
  color: rgba(148, 163, 184, 0.35); letter-spacing: 1px;
}

@media (max-width: 768px) {
  .landing__title { font-size: 56px; }
  .landing__subtitle { font-size: 15px; letter-spacing: 2px; }
  .landing__cta { padding: 16px 36px; font-size: 15px; }
  .landing__eyebrow { letter-spacing: 4px; }
}
@media (max-width: 375px) {
  .landing__title { font-size: 42px; }
  .landing__subtitle { font-size: 13px; letter-spacing: 1px; }
}
</style>

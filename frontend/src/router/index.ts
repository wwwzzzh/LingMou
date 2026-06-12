import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: {
      title: '首页',
    },
  },
  {
    path: '/media-preview',
    name: 'MediaPreview',
    component: () => import('@/views/MediaPreviewView.vue'),
    meta: {
      title: '音视频采集预览',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局前置守卫 — Token 校验预留
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || 'AI 视觉对话助手'}`
  // TODO: Token 有效性校验逻辑
  next()
})

export default router

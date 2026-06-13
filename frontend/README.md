# AI 视觉对话助手 — 前端工程

基于 Vue3 + TypeScript + Vite 构建的 AI 视觉对话助手前端应用。

---

## 🛠 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.x | Composition API |
| TypeScript | 5.x | 严格模式 |
| Vite | 6.x | 构建工具 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由 |
| Axios | 1.x | HTTP 请求 |
| Element Plus | 2.x | UI 组件库 |
| SCSS | — | 样式预处理 |

---

## 📁 目录结构

```
src/
├── api/                          # API 接口层
│   ├── request.ts                # Axios 实例封装
│   │   ├── 请求拦截器（Token 注入）
│   │   ├── 响应拦截器（统一异常处理）
│   │   └── 超时 30s
│   └── modules/
│       ├── chat.ts               # 聊天接口 (POST /api/chat/send)
│       ├── chat.mock.ts          # Mock API（开发阶段）
│       ├── vision.ts             # 视觉上传 (POST /api/vision/upload)
│       └── audio.ts              # 语音接口 (POST /api/audio/asr & tts)
│
├── assets/                       # 静态资源
│
├── components/                   # 公共组件
│   ├── CameraPreview.vue         # 摄像头预览 + 设备控制
│   ├── ChatInput.vue             # 聊天输入框（Enter 发送）
│   ├── EmptyState.vue            # 空状态占位
│   ├── ErrorDisplay.vue          # 统一错误展示 + 重试
│   ├── FrameCapturePanel.vue     # 帧捕获统计面板
│   ├── GlobalLoading.vue         # 全局加载遮罩
│   ├── MessageBubble.vue         # 消息气泡（文本/图片/音频）
│   ├── RetryButton.vue           # 失败重试按钮
│   └── VoiceIndicator.vue        # 语音状态可视化
│
├── composables/                  # 组合式函数
│   ├── useFrameCapture.ts        # 帧捕获（定时器 + 检测 + 上传）
│   ├── useMediaDevice.ts         # 媒体设备管理（getUserMedia）
│   └── useVoiceDetector.ts       # VAD 语音活动检测
│
├── layouts/
│   └── DefaultLayout.vue         # 默认布局（Header + Main + Footer）
│
├── router/
│   └── index.ts                  # 路由配置（懒加载 + 导航守卫）
│
├── stores/                       # Pinia 状态管理
│   ├── app.ts                    # 全局状态（加载/错误/网络）
│   ├── chat.ts                   # 聊天消息状态
│   └── user.ts                   # 用户/会话状态
│
├── styles/
│   ├── variables.scss            # 设计令牌（颜色/尺寸/断点）
│   └── global.scss               # 全局样式 Reset
│
├── types/
│   ├── index.ts                  # 通用类型（ChatMessage / ApiResult）
│   └── media.ts                  # 媒体设备类型
│
├── utils/
│   ├── frameProcessor.ts         # Canvas 抽帧 + 图片压缩
│   ├── motionDetector.ts         # 画面变化检测（RGB 差值）
│   ├── vad.ts                    # VAD 核心算法（RMS 音量）
│   └── index.ts                  # 通用工具（ID/时间格式化）
│
├── views/
│   ├── ChatView.vue              # 聊天页面
│   ├── HomeView.vue              # 首页
│   └── MediaPreviewView.vue      # 媒体预览页面
│
├── App.vue                       # 根组件
├── main.ts                       # 入口文件
└── env.d.ts                      # 环境变量类型声明
```

---

## 🚀 安装与启动

### 环境要求

- Node.js ≥ 18
- npm ≥ 9

### 安装

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
# → http://localhost:5173
```

### 生产构建

```bash
npm run build      # 输出到 dist/
npm run preview    # 预览生产构建
```

---

## 🔧 环境变量

| 变量 | 说明 | 开发值 | 生产值 |
|------|------|--------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `http://localhost:8080` | `/api` |
| `VITE_APP_TITLE` | 应用标题 | `AI 视觉对话助手` | 同 |
| `VITE_APP_ENV` | 运行环境 | `development` | `production` |

> 复制 `.env.example` 为 `.env.development` 或 `.env.production`

---

## 📱 浏览器兼容性

| 浏览器 | 最低版本 | 备注 |
|--------|----------|------|
| Chrome | 90+ | 推荐 |
| Edge | 90+ | — |
| Firefox | 90+ | — |
| Safari | 15+ | 需 HTTPS |

> 依赖 `getUserMedia` API，需在 HTTPS 或 localhost 下运行。

---

## 🏗️ 架构设计

### 数据流

```
用户操作 → View → Composable → API Module → Axios → 后端
                 ↕
              Pinia Store（响应式状态）
```

### 路由表

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomeView | 首页（Hero + 功能卡片） |
| `/chat` | ChatView | 智能对话界面 |
| `/media-preview` | MediaPreviewView | 摄像头预览 + 帧捕获 + VAD |

### Store 设计

| Store | 职责 |
|-------|------|
| `appStore` | 全局 Loading / Error / 网络状态 |
| `userStore` | 游客会话 ID / 设备连接状态 |
| `chatStore` | 消息列表 / AI 加载状态 |

---

## ❓ 常见问题

### 摄像头无法开启

1. 确认使用 HTTPS 或 localhost
2. 检查浏览器地址栏左侧 → 网站设置 → 允许摄像头和麦克风
3. 检查是否有其他应用占用摄像头

### 安装依赖失败

```bash
# 清除缓存后重试
rm -rf node_modules package-lock.json
npm install
```

### 构建报 TypeScript 错误

```bash
# 检查类型
npx vue-tsc --noEmit
```

### 开发时 API 请求跨域

配置 Vite 代理（`vite.config.ts`）：

```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  }
})
```

### 端口被占用

```bash
npx vite --port 3000
```

---

## 📦 依赖清单

### 生产依赖

- `vue` — 核心框架
- `vue-router` — 路由
- `pinia` — 状态管理
- `axios` — HTTP 请求
- `element-plus` — UI 组件库
- `@element-plus/icons-vue` — 图标库

### 开发依赖

- `typescript` — 类型系统
- `vite` — 构建工具
- `@vitejs/plugin-vue` — Vite Vue 插件
- `sass` — SCSS 编译器
- `@types/node` — Node 类型
- `vue-tsc` — Vue TypeScript 检查

---

## 📄 License

MIT

# 🫁 灵眸 AI（LingMou）— 智能视觉对话助手

基于火山引擎豆包大模型的实时多模态视觉语音助手。摄像头画面实时理解 + 语音对话 + AI 主动监控，让 AI "看懂"你的世界。

---

## 功能总览

| 模块 | 功能 | 状态 |
|------|------|------|
| 多模态对话 | 摄像头画面 + 文字 → AI 回复（流式输出） | ✅ |
| 主动视觉监控 | 每 10s 定时拍照 → AI 分析画面变化 → TTS 播报 | ✅ |
| 语音识别（ASR） | 浏览器端 Web Speech API，支持连续识别 + AI 纠错 | ✅ |
| 语音合成（TTS） | 浏览器端 Web Speech API，AI 回复自动朗读 | ✅ |
| 图片上传分析 | 上传图片 → 多模态分析 | ✅ |
| 会话管理 | Redis 缓存对话历史，24h TTL，长会话自动摘要压缩 | ✅ |
| 限流保护 | 基于 sessionId 的 Redis 原子计数器 | ✅ |
| Provider 切换 | `application.yml` 一行配置切换 mock / volcengine | ✅ |

---

## 技术架构

```
┌─ Browser ───────────────────────────────────────────────────┐
│  Vue 3 + TypeScript + Pinia + Element Plus                  │
│                                                             │
│  Camera ──→ Canvas 抽帧 ──→ useActiveVision (10s定时)      │
│  Mic    ──→ Web Speech API (ASR) ──→ ASR 纠错               │
│  Speaker ←── Web Speech API (TTS)                            │
│                                                             │
│  axios ──→ POST /api/chat/stream  (SSE 流式)                │
│        ──→ POST /api/chat/send    (普通对话)                │
│        ──→ POST /api/chat/correct (ASR 纠错)                │
│        ──→ POST /api/vision/upload (图片上传)               │
│        ──→ POST /api/vision/analyze (base64 图片分析)      │
│        ──→ POST /api/audio/tts   (后端 TTS)                 │
│        ──→ POST /api/audio/asr   (后端 ASR)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP
┌─ Spring Boot 3.4 ────┴──────────────────────────────────────┐
│  Controller → Provider (接口) → VolcengineProvider (实现)    │
│                                                             │
│  ChatController    ──→ VisionModelProvider.chat()           │
│  ChatController    ──→ VisionModelProvider.chatStream()     │
│  ChatController    ──→ VisionModelProvider.correctAsr()     │
│  VisionController  ──→ VisionModelProvider.analyze()        │
│  AudioController   ──→ AsrProvider / TtsProvider            │
│                                                             │
│  ChatSessionService   ──→ Redis (会话历史)                  │
│  RateLimitInterceptor ──→ Redis (限流计数)                  │
│  ConversationSummaryService ──→ 长会话自动摘要               │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
┌─ 火山引擎 Ark ────────┴──────────────────────────────────────┐
│  POST /api/v3/chat/completions                               │
│  Model: doubao-seed-2-0-lite-260215（多模态）                │
└──────────────────────────────────────────────────────────────┘
```

---

## 项目结构

```
LingMou/
├── frontend/                          # Vue 3 前端
│   ├── src/
│   │   ├── api/
│   │   │   ├── request.ts             # Axios 实例（拦截器、错误处理）
│   │   │   └── modules/
│   │   │       ├── chat.ts            # 对话 API（send / stream / correct）
│   │   │       ├── chat.mock.ts       # Mock 对话（已弃用）
│   │   │       ├── audio.ts           # 语音 API（ASR / TTS）
│   │   │       └── vision.ts          # 视觉 API（upload / analyze）
│   │   ├── assets/                    # 静态资源
│   │   ├── components/                # 公共组件
│   │   │   ├── CameraPreview.vue      # 摄像头预览
│   │   │   ├── FrameCapturePanel.vue  # 抽帧面板
│   │   │   └── VoiceIndicator.vue     # 语音状态指示器
│   │   ├── composables/               # 组合式函数（核心逻辑）
│   │   │   ├── useActiveVision.ts     # 主动视觉监控（10s 定时）
│   │   │   ├── useMediaDevice.ts      # 媒体设备管理
│   │   │   ├── useSpeechRecognition.ts # 浏览器 ASR
│   │   │   └── useSpeechSynthesis.ts  # 浏览器 TTS
│   │   ├── layouts/                   # 布局
│   │   ├── router/                    # 路由
│   │   ├── stores/                    # Pinia 状态
│   │   │   ├── chat.ts                # 聊天状态（消息列表、流式更新）
│   │   │   ├── user.ts                # 用户/会话状态
│   │   │   └── app.ts                 # 应用全局状态
│   │   ├── styles/                    # SCSS
│   │   ├── types/                     # TypeScript 类型定义
│   │   ├── utils/                     # 工具函数
│   │   │   ├── index.ts               # ID 生成、时间格式化
│   │   │   └── motionDetector.ts      # 像素变化率计算
│   │   └── views/
│   │       ├── HomeView.vue           # 首页（品牌展示）
│   │       ├── ChatView.vue           # 主对话页（75% 视频 + 25% 聊天）
│   │       └── MediaPreviewView.vue   # 媒体预览页
│   ├── .env.example                   # 环境变量模板
│   ├── .env.development               # 开发环境变量（gitignored）
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                           # Spring Boot 后端
│   ├── src/main/java/com/lingmou/
│   │   ├── LingMouApplication.java    # 启动类
│   │   ├── common/
│   │   │   └── Result.java            # 统一响应格式 {code, message, data, timestamp}
│   │   ├── config/
│   │   │   ├── BodyCacheFilter.java   # 请求体缓存 Filter
│   │   │   ├── CorsConfig.java        # CORS 全局配置
│   │   │   └── WebConfig.java         # 拦截器 + 静态资源配置
│   │   ├── controller/
│   │   │   ├── HealthController.java  # 健康检查 GET /health
│   │   │   ├── ChatController.java    # 对话 /api/chat/*
│   │   │   ├── VisionController.java  # 视觉 /api/vision/*
│   │   │   └── AudioController.java   # 语音 /api/audio/*
│   │   ├── dto/
│   │   │   ├── ChatRequest.java       # 对话请求（含 frameBase64）
│   │   │   ├── CorrectRequest.java    # ASR 纠错请求
│   │   │   ├── TtsRequest.java        # TTS 请求
│   │   │   └── VisionAnalyzeRequest.java # 视觉分析请求
│   │   ├── entity/
│   │   │   └── ChatHistory.java       # 对话历史实体
│   │   ├── exception/
│   │   │   └── GlobalExceptionHandler.java # 全局异常处理（400/429/500）
│   │   ├── interceptor/
│   │   │   ├── RateLimitInterceptor.java   # Redis 限流
│   │   │   └── RequestTimingInterceptor.java # 请求日志
│   │   ├── provider/                  # AI Provider 接口 + 实现
│   │   │   ├── VisionModelProvider.java    # 视觉模型接口
│   │   │   ├── VolcengineVisionProvider.java # 火山引擎实现（Ark API）
│   │   │   ├── MockVisionProvider.java    # Mock 实现
│   │   │   ├── AsrProvider.java           # ASR 接口
│   │   │   ├── VolcengineAsrProvider.java # 火山引擎 ASR（骨架）
│   │   │   ├── MockAsrProvider.java       # Mock ASR
│   │   │   ├── TtsProvider.java           # TTS 接口
│   │   │   ├── VolcengineTtsProvider.java # 火山引擎 TTS（骨架）
│   │   │   └── MockTtsProvider.java       # Mock TTS
│   │   ├── service/
│   │   │   ├── ChatSessionService.java         # Redis 会话管理
│   │   │   └── ConversationSummaryService.java # 长会话摘要压缩
│   │   └── util/
│   ├── src/main/resources/
│   │   └── application.yml            # 应用配置（gitignored）
│   ├── application-example.yml        # 配置模板
│   └── pom.xml
│
├── .gitignore
└── README.md
```

---

## 快速开始

### 环境要求

| 依赖 | 版本 |
|------|------|
| JDK | 17+ |
| Maven | 3.9+ |
| Node.js | 18+ |
| MySQL | 8.0+ |
| Redis | 5.0+ |

### 1. 配置数据库

```sql
CREATE DATABASE IF NOT EXISTS ai_vision_assistant
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 配置后端

```bash
cd backend
# 复制配置模板并填入真实值
cp application-example.yml src/main/resources/application.yml
# 编辑 application.yml：
#   - MySQL 用户名/密码
#   - Redis 密码（如无密码留空）
#   - 火山引擎 Ark API Key
#   - ai.vision-provider=volcengine  # 启用真实 AI
```

### 3. 启动后端

```bash
cd backend
mvn compile spring-boot:run
# 服务运行在 http://localhost:8080
# Swagger 文档: http://localhost:8080/swagger-ui.html
# 健康检查: http://localhost:8080/health
```

### 4. 启动前端

```bash
cd frontend
cp .env.example .env.development
npm install
npm run dev
# 开发服务器运行在 http://localhost:5173
```

---

## API 文档

所有接口统一返回格式：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": 1712345678000
}
```

### 对话服务 `/api/chat`

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| POST | `/send` | 普通对话 | `{sessionId, message, images?, frameBase64?}` |
| POST | `/stream` | 流式对话（SSE） | 同上 |
| POST | `/correct` | ASR 纠错 | `{text}` |

**流式响应格式（SSE）：**

```
event:token
data:你

event:token
data:好

event:done
data:
```

### 视觉服务 `/api/vision`

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| POST | `/upload` | 上传图片（MultipartFile） | FormData `file` |
| POST | `/analyze` | 分析 base64 图片 | `{imageBase64, prompt}` |

### 语音服务 `/api/audio`

| 方法 | 路径 | 说明 | 请求体 |
|------|------|------|--------|
| POST | `/asr` | 语音转文字 | FormData `audio` |
| POST | `/tts` | 文字转语音 | `{text}` |

### 健康检查

| 方法 | 路径 | 返回 |
|------|------|------|
| GET | `/health` | `{"data":{"status":"UP"}}` |

---

## 配置说明

### 后端 `application.yml`

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ai_vision_assistant
    username: root
    password: your_password
  redis:
    host: localhost
    port: 6379

# AI Provider 选择（mock / volcengine）
ai:
  vision-provider: volcengine   # 视觉模型
  asr-provider: mock            # 语音识别（前端用浏览器 API）
  tts-provider: mock            # 语音合成（前端用浏览器 API）

# 火山引擎 Ark 配置
volcengine:
  ark:
    base-url: https://ark.cn-beijing.volces.com/api/v3
    model: doubao-seed-2-0-lite-260215
    api-key: your_api_key

# 对话配置
chat:
  max-round: 20           # 最大保留轮数
  summary-trigger: 16     # 触发摘要压缩的轮数
  summary-keep-rounds: 10 # 压缩后保留最近轮数

# 限流配置
rate-limit:
  max-requests: 20        # 窗口内最大请求数
  window-seconds: 60      # 时间窗口（秒）
```

### 前端环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端地址 | `http://localhost:8080` |
| `VITE_APP_TITLE` | 页面标题 | `AI 视觉对话助手` |
| `VITE_APP_ENV` | 环境标识 | `development` |

> 前端无需配置任何 API Key，所有 AI 调用统一走后端。

---

## Provider 模式

项目采用 **Provider 接口模式**，通过 `@ConditionalOnProperty` 实现厂商中立切换：

```
                   ┌─ VisionModelProvider
                   │   ├── MockVisionProvider       (mock)
                   │   └── VolcengineVisionProvider (volcengine)
                   │
Provider Interface ─┼─ AsrProvider
                   │   ├── MockAsrProvider          (mock)
                   │   └── VolcengineAsrProvider    (volcengine, 待接入)
                   │
                   └─ TtsProvider
                       ├── MockTtsProvider          (mock)
                       └── VolcengineTtsProvider    (volcengine, 待接入)
```

切换方式：修改 `application.yml` 中 `ai.*-provider` 的值即可，无需改代码。

---

## 核心流程

### 对话流程（流式）

```
用户输入文字 + 可选中途帧
  → POST /api/chat/stream (SSE)
  → Volcengine Ark API (stream: true, thinking: disabled)
  → 逐 token 解析 SSE → SseEmitter 推送到前端
  → 前端逐字渲染到消息气泡
  → 完成后 TTS 朗读 + 检测触发词启动主动监控
```

### 主动视觉监控

```
用户说含关键词的话（看/盯/监控/消失/注意...）
  → useActiveVision.startWatching()
  → 立刻拍照 → POST /api/vision/analyze → AI 分析
  → 每 10s 重复：拍照 → 分析 → 有变化就播报
```

### ASR 纠错流程

```
用户语音输入 → 浏览器 Web Speech API 识别
  → POST /api/chat/correct
  → AI 纠正错别字 → 返回纠正后文本
  → 自动填入输入框并发送
```

---

## 安全

- **API Key 保护**：所有火山引擎 Key 仅存在于后端 `application.yml`（gitignored），前端零 Key
- **限流**：Redis 原子计数器，60s 窗口最多 20 请求
- **Prompt 注入防护**：ASR 纠错输入截断 500 字符、过滤换行
- **文件上传校验**：限制 10MB + 仅允许 `image/*` 类型
- **CORS**：开发环境允许所有来源（生产需收紧）

---

## 团队

| 成员 | 角色 | 分工 |
|------|------|------|
| 王子恒 | Frontend Lead | 前端架构、UI 组件、动画、composables |
| 徐嘉祥 | Backend Lead | 后端架构、Provider、AI 集成、安全 |

---

## License

MIT

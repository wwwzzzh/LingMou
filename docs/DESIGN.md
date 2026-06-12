# AI视觉对话助手 — 设计文档

## 1. 项目背景

基于多模态大模型的实时视觉语音助手，支持用户通过语音提问、摄像头捕捉画面，AI 结合视觉与语义信息给出回复，实现自然的多轮交互体验。

## 2. 项目目标

- 构建实时视觉对话全链路：音视频采集 → 语音识别 → 多模态理解 → 语音合成
- 后端采用 Provider 可插拔架构，不绑定具体 AI 厂商
- 实现游客模式会话隔离，降低使用门槛
- 落地成本控制策略（限流、对话摘要压缩）

## 3. 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 语言 | Java 17 | LTS 版本 |
| 框架 | Spring Boot 3.4 | 企业级后端框架 |
| 构建 | Maven | 依赖管理 |
| ORM | MyBatis Plus 3.5 | 轻量级 ORM |
| 数据库 | MySQL 8.0 | 持久化存储 |
| 缓存 | Redis | 会话缓存、限流计数器 |
| 接口文档 | springdoc-openapi 2.7 | Swagger UI |
| AI 能力 | ASR / TTS / VL Model | Provider 可插拔 |

## 4. 系统架构

```
┌─────────────────────────────────────────┐
│                前端 (Vue 3)               │
│   音视频采集 | 对话界面 | VAD | 抽帧压缩  │
└──────────────────┬──────────────────────┘
                   │ REST API
┌──────────────────▼──────────────────────┐
│           后端 (Spring Boot)             │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │         Interceptor 层          │    │
│  │  RateLimitInterceptor           │    │
│  │  RequestTimingInterceptor       │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │          Controller 层          │    │
│  │  HealthController               │    │
│  │  AudioController (ASR / TTS)    │    │
│  │  ChatController (Vision)        │    │
│  └────────────────┬────────────────┘    │
│  ┌────────────────▼────────────────┐    │
│  │          Service 层             │    │
│  │  ChatSessionService             │    │
│  │  ConversationSummaryService     │    │
│  └────────────────┬────────────────┘    │
│  ┌────────────────▼────────────────┐    │
│  │          Provider 层            │    │
│  │  AsrProvider / TtsProvider      │    │
│  │  VisionModelProvider            │    │
│  └─────────────────────────────────┘    │
│                                          │
│  ┌──────────┐  ┌──────────────────┐     │
│  │  MySQL   │  │     Redis         │     │
│  └──────────┘  └──────────────────┘     │
└─────────────────────────────────────────┘
```

## 5. 后端设计

### 5.1 分层架构

```
controller/    → REST 接口，参数校验，Swagger 注解
dto/           → 请求/响应数据传输对象
service/       → 业务逻辑层
provider/      → AI 能力抽象接口与实现（可插拔）
entity/        → 数据实体
mapper/        → MyBatis 数据访问层
config/        → Spring 配置类
interceptor/   → 请求拦截器（限流、日志）
exception/     → 全局异常处理
common/        → 通用工具类（统一返回格式）
util/          → 工具类
vo/            → 视图对象
```

### 5.2 统一返回格式

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1700000000000
}
```

### 5.3 异常码体系

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 6. 数据库设计

### visitor_session
```sql
CREATE TABLE visitor_session (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64) UNIQUE,
    created_at DATETIME,
    updated_at DATETIME
);
```
游客身份表，无需注册即可使用。

### chat_message
```sql
CREATE TABLE chat_message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64),
    role VARCHAR(20),
    content TEXT,
    message_type VARCHAR(20),
    created_at DATETIME
);
```
聊天记录表，持久化会话消息。

### ai_provider_log
```sql
CREATE TABLE ai_provider_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64),
    provider_name VARCHAR(50),
    token_usage INT,
    response_time INT,
    created_at DATETIME
);
```
AI 调用日志，统计成本与性能。

## 7. Redis 设计

| Key | 类型 | TTL | 说明 |
|-----|------|-----|------|
| chat:history:{sessionId} | List\<ChatHistory\> | 24h | 会话上下文 |
| rate:{sessionId} | INT | 60s | 限流计数器 |
| visitor:{sessionId} | Hash | 24h | 游客信息缓存 |

## 8. AI Provider 扩展设计

所有 AI 能力通过接口抽象，业务代码不依赖具体厂商：

```java
// 业务层只依赖接口
private final VisionModelProvider visionProvider;
private final AsrProvider asrProvider;
private final TtsProvider ttsProvider;

// 切换厂商只需两步：
// 1. 新增实现类（如 QwenVisionProvider）
// 2. 修改配置文件 ai.vision-provider=qwen
```

```yaml
ai:
  asr-provider: mock      # mock | aliyun | tencent
  tts-provider: mock      # mock | aliyun | tencent
  vision-provider: mock   # mock | qwen | glm
```

Provider 实现通过 `@ConditionalOnProperty` 根据配置值自动装配，一套接口可接入任意数量的厂商实现。

## 9. 成本控制策略

### 9.1 请求限流
- 基于 Redis 滑动窗口
- 默认 60 秒内最多 20 次请求
- 超限返回 HTTP 429

### 9.2 对话摘要压缩
- 对话超过 20 轮触发压缩
- 调用 AI 将早期对话总结为一句话摘要
- 保留摘要 + 最近 10 轮完整对话
- 大幅降低后续请求的 Token 消耗

### 9.3 前端辅助
- VAD 语音端点检测：仅在用户说完后发送请求
- 画面变化检测：仅在画面变化时发送图片
- 图片压缩：Canvas 压缩后上传

## 10. 安全设计

- 所有 API 密钥通过配置文件读取，代码零硬编码
- application.yml 全局 .gitignore 排除，仅保留 application-example.yml 模板
- 前端不持有任何 API 密钥，AI 请求统一走后端转发
- 游客模式使用 sessionId 隔离，无需注册

## 11. 测试方案

| 测试项 | 方法 |
|--------|------|
| 健康检查 | GET /health → 200 |
| ASR 接口 | POST /api/audio/asr 上传音频 |
| TTS 接口 | POST /api/audio/tts 传入文本 |
| 对话接口 | POST /api/chat/send 传入 sessionId + message |
| 多轮对话 | 同一 sessionId 连续发送，验证上下文保留 |
| 限流 | 连续调用超 20 次，验证 429 |
| 摘要压缩 | 对话超 20 轮，验证历史被压缩 |
| Swagger | /swagger-ui.html 可正常访问 |

## 12. 团队分工

| 成员 | 职责 |
|------|------|
| 成员A（前端） | Vue3 前端、音视频采集、VAD、画面变化检测、交互 UI、录制 Demo |
| 徐嘉祥（后端） | Spring Boot 后端、AI Provider 封装、会话管理、限流降本、数据库设计、接口文档 |

## 13. PR 协作过程

| PR | 标题 | 负责人 |
|----|------|--------|
| #1 | 项目初始化（前端预留） | 成员A |
| #2 | chore: 初始化仓库与项目目录 | 徐嘉祥 |
| #3 | feat(backend): 初始化 Spring Boot 项目脚手架 | 徐嘉祥 |
| #4 | feat(backend): 封装 ASR 与 TTS 语音服务 | 徐嘉祥 |
| #5 | feat(frontend): 初始化前端项目（预留） | 成员A |
| #6 | feat(backend): 接入多模态模型与会话上下文管理 | 徐嘉祥 |
| #7 | feat(backend): 实现请求限流与对话摘要降本 | 徐嘉祥 |
| #8 | feat: 全链路联调与后端稳定性优化 | 徐嘉祥 |
| #9 | docs: 完善后端设计文档 | 徐嘉祥 |

## 14. 创新点

- **Provider 可插拔架构**：通过接口抽象 + 条件装配，切换 AI 厂商零代码改动
- **双维度成本控制**：服务端限流 + 对话摘要压缩 + 前端辅助检测，多层降低 Token 消耗
- **游客模式**：零门槛使用，自动会话隔离
- **标准化接口文档**：Swagger 自动生成，前后端协作无缝

## 15. 后续优化方向

- 接入真实 ASR/TTS/Vision 厂商 SDK
- 引入消息队列处理长音频离线识别
- 实现 WebSocket 流式语音交互
- 增加用户反馈机制优化回复质量
- 引入向量数据库实现长期记忆

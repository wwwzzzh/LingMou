# AI视觉对话助手

基于多模态大模型的实时视觉语音助手，支持语音输入、摄像头画面识别、多轮对话交互。

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite |
| 后端 | Spring Boot 3.4 + Java 17 + Maven |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis |
| ORM | MyBatis Plus 3.5 |
| 接口文档 | springdoc-openapi (Swagger) |
| AI 能力 | 多模态大模型 / ASR / TTS（Provider 可插拔） |

## 目录结构

```
LingMou/
├── frontend/          # 前端模块（Vue 3 + Vite）
│   ├── src/
│   ├── package.json
│   └── .env.example
├── backend/           # 后端模块（Spring Boot）
│   ├── src/
│   ├── pom.xml
│   └── application-example.yml
├── docs/              # 设计文档
│   └── DESIGN.md
├── README.md
└── .gitignore
```

## 后端模块说明

### 分层结构

```
backend/src/main/java/com/lingmou/
├── common/         # 统一返回格式 Result<T>
├── config/         # Redis、Web、OpenAPI 配置
├── controller/     # REST 控制器
│   ├── HealthController    → GET /health
│   ├── AudioController     → POST /api/audio/asr, /api/audio/tts
│   └── ChatController      → POST /api/chat/send
├── dto/            # 请求/响应 DTO
├── entity/         # 数据实体
├── exception/      # 全局异常处理（400/429/500）
├── interceptor/    # 限流拦截器、请求耗时拦截器
├── provider/       # AI Provider 接口与 Mock 实现
├── service/        # 业务逻辑层
│   ├── ChatSessionService         → Redis 会话管理
│   └── ConversationSummaryService → 对话摘要压缩
└── util/           # 工具类
```

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |
| POST | /api/audio/asr | 语音转文字 |
| POST | /api/audio/tts | 文字转语音 |
| POST | /api/chat/send | 多模态对话 |

### AI Provider 扩展

所有 AI 能力通过接口抽象，切换厂商只需修改配置：

```yaml
ai:
  asr-provider: mock      # mock | aliyun | tencent
  tts-provider: mock      # mock | aliyun | tencent
  vision-provider: mock   # mock | qwen | glm
```

新增厂商实现对应的 Provider 接口，加上 `@ConditionalOnProperty` 注解即可。

## 运行方式

### 前端
```bash
cd frontend
npm install
npm run dev
```

### 后端

1. 复制配置模板：
```bash
cd backend
cp application-example.yml src/main/resources/application.yml
```

2. 修改 `application.yml` 中数据库/Redis/Provider 配置

3. 启动：
```bash
mvn spring-boot:run
```

4. 访问：
- 健康检查: http://localhost:8080/health
- Swagger: http://localhost:8080/swagger-ui.html

## 环境变量

| 参数 | 默认值 | 说明 |
|------|--------|------|
| server.port | 8080 | 服务端口 |
| spring.datasource.url | - | MySQL 连接地址 |
| spring.redis.host | localhost | Redis 地址 |
| ai.asr-provider | mock | ASR 实现 |
| ai.tts-provider | mock | TTS 实现 |
| ai.vision-provider | mock | 视觉模型实现 |
| chat.max-round | 20 | 最大保留对话轮数 |
| chat.summary-trigger | 20 | 触发摘要压缩的轮数 |
| rate-limit.max-requests | 20 | 窗口内最大请求数 |
| rate-limit.window-seconds | 60 | 限流窗口时长 |

## License

MIT

# LingMou（灵眸）— AI 视觉对话助手

基于多模态大模型的实时视觉语音助手。支持摄像头实时采集、语音交互、智能图片分析，让 AI "看懂"你的世界。

---

## 📋 项目简介

AI Vision Assistant 是一个**端云协同**的实时视觉语音助手。前端基于 Vue3 构建，通过浏览器 API 采集音视频流，经 Canvas 抽帧 + 画面变化检测 + VAD 语音活动检测实现端侧成本控制，再将有效数据上传至后端多模态大模型进行视觉理解与对话生成。

### 核心特性

- 📷 **实时视觉采集**：摄像头画面采集 + Canvas 智能抽帧
- 🎙️ **语音交互**：麦克风录制 + VAD 端侧检测 + ASR/TTS
- 🧠 **多模态理解**：视觉+文本多模态大模型驱动
- 💰 **成本控制**：端侧画面变化检测 + 图片压缩 + 静音检测
- 📱 **响应式设计**：适配 1920~375 全断点

---

## 🛠 技术栈

### 前端

| 技术 | 说明 |
|------|------|
| Vue 3 | 渐进式 JavaScript 框架 (Composition API) |
| TypeScript | 类型安全 |
| Vite | 极速构建工具 |
| Pinia | 状态管理 |
| Vue Router 4 | 路由管理 |
| Axios | HTTP 客户端 |
| Element Plus | UI 组件库 |
| SCSS | CSS 预处理器 |

### 后端

| 技术 | 说明 |
|------|------|
| Spring Boot 3.x | Java 企业级框架 |
| MyBatis Plus | ORM 框架 |
| MySQL 8 | 关系型数据库 |
| Redis | 缓存与限流 |
| Maven | 项目构建 |

### AI 能力（Provider 模式，厂商中立）

| 模块 | 说明 |
|------|------|
| VisionModelProvider | 多模态视觉理解 |
| AsrProvider | 语音识别 |
| TtsProvider | 语音合成 |

---

## 📁 目录结构

```
LingMou/
├── frontend/                # 前端 Vue3 项目
│   ├── src/
│   │   ├── api/             # API 接口层
│   │   │   ├── request.ts         # Axios 封装
│   │   │   └── modules/           # 业务模块
│   │   ├── assets/          # 静态资源
│   │   ├── components/      # 公共组件
│   │   ├── composables/     # 组合式函数
│   │   ├── layouts/         # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── styles/          # SCSS 样式
│   │   ├── types/           # TypeScript 类型
│   │   ├── utils/           # 工具函数
│   │   └── views/           # 页面视图
│   ├── .env.example         # 环境变量模板
│   └── package.json
├── backend/                 # 后端 Spring Boot 项目
├── docs/                    # 设计文档
└── README.md
```

---

## 🚀 快速启动

### 前端

```bash
cd frontend
npm install
npm run dev        # 开发模式 → http://localhost:5173
npm run build      # 生产构建 → dist/
npm run preview    # 预览生产构建
```

### 后端

```bash
cd backend
mvn spring-boot:run
```

---

## 🔧 环境变量

| 变量 | 说明 | 开发环境 | 生产环境 |
|------|------|----------|----------|
| `VITE_API_BASE_URL` | API 基础地址 | `http://localhost:8080` | `/api` |
| `VITE_APP_TITLE` | 应用名称 | `AI 视觉对话助手` | 同 |
| `VITE_APP_ENV` | 运行环境 | `development` | `production` |

> 复制 `.env.example` → `.env.development` / `.env.production` 进行配置

---

## 🌐 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Edge | 90+ |
| Firefox | 90+ |
| Safari | 15+ |

> 需要浏览器支持 `navigator.mediaDevices.getUserMedia` (HTTPS 或 localhost)

---

## 📖 常见问题

### Q: 摄像头无法开启？
A: 检查浏览器地址栏左侧权限设置，确保已允许摄像头和麦克风访问。需使用 HTTPS 或 localhost。

### Q: 构建报错 "baseUrl is deprecated"？
A: 已通过 `tsconfig.app.json` 的 `ignoreDeprecations: "6.0"` 处理。

### Q: 如何切换后端 API 地址？
A: 修改 `.env.development` 中的 `VITE_API_BASE_URL` 后重启 dev server。

---

## 👥 团队分工

| 成员 | 角色 | 负责 |
|------|------|------|
| 王子恒 | Frontend Lead | PR2/PR4/PR7/PR8/PR9/PR11(前端)/PR12(前端文档) |
| 成员B | Backend Lead | PR1/PR3/PR5/PR6/PR10/PR11(后端)/PR12(后端文档) |

---

## 📄 License

MIT

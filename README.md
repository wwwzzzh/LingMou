# AI视觉对话助手

基于多模态大模型的实时视觉语音助手，支持语音输入、摄像头画面识别、多轮对话交互。

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite |
| 后端 | Spring Boot 3.x + Java 17 + Maven |
| 数据库 | MySQL |
| 缓存 | Redis |
| AI 能力 | 多模态大模型 / ASR / TTS（Provider 可插拔） |

## 目录结构

```
ai-vision-assistant/
├── frontend/          # 前端模块（Vue 3 + Vite）
│   ├── src/
│   ├── package.json
│   └── .env.example
├── backend/           # 后端模块（Spring Boot）
│   ├── src/
│   ├── pom.xml
│   └── application-example.yml
├── docs/              # 文档目录
│   └── DESIGN.md
├── README.md
└── .gitignore
```

## 运行方式

### 前端
```bash
cd frontend
npm install
npm run dev
```

### 后端
```bash
cd backend
mvn spring-boot:run
```

> 具体配置请参考各模块目录下的 example 文件。

## License

MIT

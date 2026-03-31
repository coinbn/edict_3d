# Edict - 三省六部 AI Agent 协作平台

<p align="center">
  <img src="https://img.shields.io/badge/Edict-3.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Spring%20Boot-2.7.18-6DB33F?style=for-the-badge&logo=spring" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=three.js" alt="Three.js">
</p>

<p align="center">
  <a href="https://github.com/coinbn/edict_3d/blob/main/assets/videos/demo1.mp4"><img src="https://img.shields.io/badge/📹%20演示视频%201-red?style=for-the-badge"></a>
  <a href="https://github.com/coinbn/edict_3d/blob/main/assets/videos/demo2.mp4"><img src="https://img.shields.io/badge/📹%20演示视频%202-orange?style=for-the-badge"></a>
</p>

<p align="center">
  <strong>基于 OpenClaw 的 3D 可视化 AI Agent 管理系统</strong>
</p>

---

## 📖 项目简介

**Edict** 是一个灵感源自中国古代"三省六部"官制设计的 AI Agent 协作管理平台。通过现代化的 3D 可视化界面，用户可以直观地管理多个 AI Agent，实现任务的自动分发、协同处理和状态监控。

### 核心设计理念

```
皇上（用户）→ 太子（分拣）→ 中书省（规划）→ 门下省（审议）→ 尚书省（派发）→ 六部（执行）
```

### 组织架构

| 部门 | Agent ID | 职责 | 擅长领域 |
|------|----------|------|---------|
| 👑 **太子** | `taizi` | 消息分拣、需求整理 | 闲聊识别、旨意提炼 |
| 📜 **中书省** | `zhongshu` | 接旨、规划、拆解 | 需求理解、任务分解 |
| 🔍 **门下省** | `menxia` | 审议、把关、封驳 | 质量评审、风险识别 |
| 📮 **尚书省** | `shangshu` | 派发、协调、汇总 | 任务调度、进度跟踪 |
| ⚔️ **兵部** | `bingbu` | 代码、算法、巡检 | 功能开发、Bug修复 |
| 💰 **户部** | `hubu` | 数据、资源、核算 | 数据处理、报表生成 |
| 📝 **礼部** | `libu` | 文档、规范、报告 | 技术文档、API文档 |
| 🔧 **工部** | `gongbu` | CI/CD、部署、工具 | Docker配置、流水线 |
| ⚖️ **刑部** | `xingbu` | 安全、合规、审计 | 安全扫描、合规检查 |
| 📋 **吏部** | `libu_hr` | 人事、Agent管理 | Agent注册、权限维护 |
| 🌅 **早朝官** | `zaochao` | 每日早朝、新闻聚合 | 定时播报、数据汇总 |

---

## ✨ 功能特性

### 🎮 3D 可视化界面
- **Neural Network 3D 场景** - 使用 Three.js 构建的 Agent 网络关系图
- **动态代码雨背景** - 科幻风格的数字雨动画效果
- **实时状态光效** - Agent 状态通过发光边框和脉冲动画实时展示
- **粒子连线系统** - Agent 间通信的动态粒子效果

---

## 📱 功能页面详解

### 🏠 首页 (Home)

系统入口页面，提供系统概览和快速操作。

**主要功能：**
- **系统状态卡片** - 展示 Gateway 状态、Agent 数量、模型池信息、系统运行状态
- **快速任务提交** - Gemini 风格的输入框，支持文字+图片上传（点击 + 号）
- **快捷操作按钮** - 重启 Gateway、查看详情、检查更新、同步 Agent
- **执行结果展示** - 实时显示任务执行结果

**使用方式：**
1. 在输入框输入任务描述
2. 点击 + 号可上传图片（支持多模态分析）
3. 点击"执行"按钮提交任务
4. 系统自动流转到中书省处理

---

### 🎛️ 3D 仪表板 (EdictDashboard)

核心可视化页面，展示 Agent 网络的 3D 场景和任务看板。

**主要功能：**
- **3D Agent 网络图** - 太子位于中心，六部环绕分布，动态连线表示通信
- **代码雨背景** - 绿色字符下落动画，营造科幻氛围
- **实时活动日志** - 底部显示 Agent 的实时活动记录
- **右侧 Agent 列表** - 显示所有 Agent 状态（运行中/空闲/离线）
- **任务看板** - Workflow Status 区域，支持拖拽任务卡片

---

### 🤖 Agent 协作 (AgentCollabView)

与单个 Agent 进行一对一对话的界面。

**主要功能：**
- **左侧 Agent 列表** - 显示所有 Agent，带状态标识和角色信息
- **状态标识** - 🟢 running（运行中）、🟡 idle（空闲）、⚫ offline（离线）
- **右侧对话区域** - 与选中 Agent 的聊天界面
- **实时思考动画** - Agent 回复前显示"正在思考..."动画
- **消息输入** - 支持发送消息和清空对话

---

### 📊 统计页面 (UsageStatsView)

展示 Agent 运行状态和会话统计的页面。

**主要功能：**
- **数据概览卡片** - 总会话数、在线 Agent 数量
- **活跃会话列表** - 展示每个 Agent 的会话详情、状态、消息数、最后活跃时间
- **数据同步** - 支持手动刷新从 OpenClaw 同步最新数据

---

### 💬 会话管理 (SessionsView)

管理 Agent 会话的详细页面。

**主要功能：**
- **顶部统计** - 显示总会话数和总消息数
- **会话列表** - 每个 Agent 的独立卡片，包含会话数量、消息数量、最后活跃时间

---

### 📋 任务看板 (KanbanView)

类似 Jira 的任务管理看板。

**主要功能：**
- **多列看板** - Inbox / 中书起草 / 门下审议 / 执行中 / 待审查 / Done
- **任务卡片** - 显示任务标题、优先级、负责人
- **拖拽流转** - 支持拖拽任务卡片在不同状态间移动

---

### 📰 早报 (MorningView)

每日早报和新闻聚合页面。

---

### ⚙️ 技能管理 (SkillsView)

管理 Agent 技能的页面。

**主要功能：**
- **技能列表** - 查看所有已安装的技能
- **技能详情** - 查看技能的描述、路径、参数
- **技能分配** - 为不同 Agent 分配技能

---

### 📡 渠道管理 (ChannelsView)

配置消息渠道的页面。

**主要功能：**
- **渠道列表** - Web、Discord、Telegram、Slack 等
- **渠道配置** - 配置各渠道的 API 密钥和参数
- **消息路由** - 配置消息如何路由到不同渠道

---

### 🧠 内存管理 (MemoryView)

查看和管理 Agent 记忆文件的页面。

**主要功能：**
- **记忆文件列表** - 按日期展示 MEMORY.md 文件
- **记忆内容查看** - 查看 Agent 的长期记忆
- **记忆搜索** - 搜索特定内容

---

### 📝 日志查看 (LogViewerView)

实时查看系统日志的页面。

**主要功能：**
- **实时日志流** - WebSocket 实时推送日志
- **日志过滤** - 按级别、Agent、时间过滤
- **日志搜索** - 搜索特定关键词

---

### 🔧 服务管理 (ServiceManagerView)

管理系统服务的页面。

**主要功能：**
- **服务列表** - Gateway、Agent 等服务
- **启动/停止** - 控制服务的启动和停止
- **状态监控** - 实时显示服务运行状态
- **终端面板** - 内置终端执行命令

---

### 📦 扩展管理 (ExtensionsView)

管理插件和扩展的页面。

---

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端** | React + TypeScript | 18.2.0 |
| **3D引擎** | Three.js + React Three Fiber | 0.160.0 |
| **状态管理** | Zustand | 4.4.7 |
| **动画** | Framer Motion + GSAP | 10.16.16 |
| **UI样式** | Tailwind CSS | 3.4.0 |
| **构建工具** | Vite | 5.0.8 |
| **后端** | Spring Boot | 2.7.18 |
| **数据库** | MySQL | 8.0+ |
| **ORM** | Spring Data JPA | 2.7.x |
| **AI框架** | OpenClaw | latest |

### 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                            前端层 (Frontend)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │   React     │  │  Three.js   │  │  Zustand    │  │  Framer   │  │
│  │  TypeScript │  │    (3D)     │  │  (State)    │  │  Motion   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
└─────────┼────────────────┼────────────────┼───────────────┼────────┘
          └────────────────┴────────────────┴───────────────┘
                                  │
                          HTTP / WebSocket
                                  │
┌─────────────────────────────────────────────────────────────────────┐
│                            后端层 (Backend)                          │
│                     Spring Boot 2.7.18 + Java 8                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  Controller │  │   Service   │  │  Repository │  │   Entity  │  │
│  │  (REST API) │  │  (Business) │  │    (JPA)    │  │   (Model) │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         └────────────────┴────────────────┴────────────────┘        │
│                           │                                         │
│  ┌────────────────────────┴────────────────────────┐               │
│  │              OpenClaw CLI 集成层                 │               │
│  │     (openclaw agent / openclaw sessions)       │               │
│  └────────────────────────┬────────────────────────┘               │
└───────────────────────────┼────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌──────────────────┐      ┌──────────────────┐
    │      MySQL       │      │   OpenClaw       │
    │   (数据存储)      │      │   Gateway        │
    │                  │      │   (端口:3000)     │
    └──────────────────┘      └────────┬─────────┘
                                       │
                              ┌────────┴────────┐
                              │  AI Providers   │
                              │ (MiniMax/Kimi)  │
                              └─────────────────┘
```

---

## 🚀 快速开始

### 环境要求

- **Java**: JDK 1.8+
- **Node.js**: 18+
- **MySQL**: 8.0+
- **Maven**: 3.6+
- **OpenClaw**: 已安装并配置

### 1. 数据库初始化

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE edict CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出
exit
```

### 2. 配置后端

编辑 `edict-server/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/edict?characterEncoding=UTF-8
    username: root
    password: your_mysql_password
```

### 3. 启动后端服务

```bash
cd edict-server

# 编译打包
mvn clean package -DskipTests

# 运行
mvn spring-boot:run

# 后端地址: http://localhost:8080/api
```

### 4. 启动前端

```bash
cd edict-web-3d

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 前端地址: http://localhost:5173
```

### 5. 确保 OpenClaw 运行

```bash
# 检查 OpenClaw Gateway 状态
openclaw gateway status
openclaw gateway start  # 如果未启动
```

---

## 📁 项目结构

```
edictNew/
├── 📄 README.md                    # 项目说明文档
├── 📂 edict-server/                # Java 后端服务
│   ├── 📄 pom.xml                  # Maven 配置
│   └── 📂 src/main/java/com/edict/
│       ├── 📂 controller/          # REST API 控制器
│       ├── 📂 service/             # 业务逻辑层
│       ├── 📂 entity/              # 数据库实体
│       ├── 📂 repository/          # 数据访问层
│       ├── 📂 dto/                 # 数据传输对象
│       ├── 📂 config/              # 配置类
│       └── 📂 util/                # 工具类
│
├── 📂 edict-web-3d/                # React 前端
│   ├── 📄 package.json             # npm 配置
│   ├── 📄 vite.config.ts           # Vite 配置
│   └── 📂 src/
│       ├── 📂 components/
│       │   ├── 📂 3d/              # 3D 场景组件
│       │   │   ├── NeuralScene.tsx
│       │   │   └── Scene.tsx
│       │   └── 📂 ui/              # UI 组件
│       │       ├── Overlay.tsx     # 主界面框架
│       │       ├── EdictDashboard.tsx
│       │       ├── AgentCollabView.tsx
│       │       ├── UsageStatsView.tsx
│       │       ├── SessionsView.tsx
│       │       ├── KanbanView.tsx
│       │       ├── GeminiInput.tsx
│       │       └── ...
│       ├── 📂 stores/
│       │   └── useStore.ts         # Zustand 状态管理
│       └── 📂 hooks/               # 自定义 Hooks
│
├── 📂 agents/                      # Agent 配置
│   ├── taizi/
│   ├── zhongshu/
│   ├── bingbu/
│   └── ...
├── 📂 docs/                        # 文档
└── 📂 uploads/                     # 上传文件存储
```

---

## 🔌 API 接口

### 任务执行
```http
POST /api/task/execute
Content-Type: application/json

{
  "task": "开发用户登录功能",
  "creator": "太子",
  "imageData": "data:image/png;base64,..."  // 可选
}
```

### Agent 状态
```http
GET /api/agents-status
```

### 发送消息给 Agent
```http
POST /api/agent-message
Content-Type: application/json

{
  "agentId": "zhongshu",
  "message": "请规划登录功能",
  "imageData": "base64...",  // 可选
  "useVision": true          // 可选
}
```

### 同步会话数据
```http
POST /api/sync-sessions
```

---

## 🛠️ 开发指南

### 添加新页面

1. 在 `edict-web-3d/src/components/ui/` 创建组件
2. 在 `Overlay.tsx` 的 `tabs` 数组中添加导航项
3. 在 `AnimatePresence` 中添加路由渲染

### 后端添加新接口

1. 在 `controller` 包创建 Controller
2. 在 `service` 包实现业务逻辑
3. 在 `dto` 包定义数据传输对象

### 模型配置

编辑 OpenClaw 配置：

```json
// ~/.openclaw/openclaw.json
{
  "agents": {
    "list": [
      {
        "id": "taizi",
        "model": "kimi-coding/k2p5"
      },
      {
        "id": "bingbu",
        "model": "minimax-portal/MiniMax-M2.5"
      }
    ]
  }
}
```

---

## 📜 许可证

MIT License © 2024 Edict Team

---

## 🙏 致谢

- [OpenClaw](https://github.com/1186258278/OpenClawChineseTranslation) - AI Agent 框架
- [MiniMax](https://platform.minimaxi.com) - 多模态 AI 能力
- [Three.js](https://threejs.org/) - 3D 图形库
- [React](https://react.dev/) - 前端框架
- [Spring Boot](https://spring.io/projects/spring-boot) - 后端框架

---

<p align="center">
  <strong>让 AI 像古代官僚体系一样高效协作 🏛️</strong>
</p>

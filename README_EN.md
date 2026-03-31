# Edict - AI Agent Collaboration Platform

<p align="center">
  <img src="https://img.shields.io/badge/Edict-3.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Spring%20Boot-2.7.18-6DB33F?style=for-the-badge&logo=spring" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=three.js" alt="Three.js">
</p>

<p align="center">
  <strong>3D Visualized AI Agent Management System Based on OpenClaw</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-docs">API Docs</a> •
  <a href="#development">Development</a>
</p>

---

## 📖 Introduction

**Edict** is an AI Agent collaboration management platform inspired by the ancient Chinese "Three Departments and Six Ministries" governmental system. Through a modern 3D visualization interface, users can intuitively manage multiple AI Agents, enabling automatic task distribution, collaborative processing, and status monitoring.

### Core Design Concept

```
Emperor (User) → Crown Prince (Sorting) → Secretariat (Planning) → Chancellery (Review) → Department of State Affairs (Dispatch) → Six Ministries (Execution)
```

### Organizational Structure

| Department | Agent ID | Responsibility | Expertise |
|------------|----------|----------------|-----------|
| 👑 **Crown Prince** | `taizi` | Message sorting, requirement organization | Chat recognition, decree refinement |
| 📜 **Secretariat** | `zhongshu` | Receive decrees, planning, task breakdown | Requirement understanding, task decomposition |
| 🔍 **Chancellery** | `menxia` | Review, gatekeeping, veto | Quality review, risk identification |
| 📮 **Department of State Affairs** | `shangshu` | Dispatch, coordination, summary | Task scheduling, progress tracking |
| ⚔️ **Ministry of War** | `bingbu` | Code, algorithms, inspection | Feature development, bug fixing |
| 💰 **Ministry of Revenue** | `hubu` | Data, resources, accounting | Data processing, report generation |
| 📝 **Ministry of Rites** | `libu` | Documentation, standards, reports | Technical docs, API documentation |
| 🔧 **Ministry of Works** | `gongbu` | CI/CD, deployment, tools | Docker config, pipelines |
| ⚖️ **Ministry of Justice** | `xingbu` | Security, compliance, audit | Security scanning, compliance checks |
| 📋 **Ministry of Personnel** | `libu_hr` | HR, Agent management | Agent registration, permission maintenance |
| 🌅 **Morning Court** | `zaochao` | Daily briefing, news aggregation | Scheduled reports, data summary |

---

## ✨ Features

### 🎮 3D Visualization Interface
- **Neural Network 3D Scene** - Agent network relationship graph built with Three.js
- **Dynamic Code Rain Background** - Sci-fi style digital rain animation
- **Real-time Status Glow** - Agent status displayed through glowing borders and pulse animations
- **Particle Connection System** - Dynamic particle effects for inter-Agent communication

---

## 📱 Feature Pages

### 🏠 Home

The system entry page providing system overview and quick operations.

**Key Features:**
- **System Status Cards** - Display Gateway status, Agent count, model pool info, system runtime status
- **Quick Task Submission** - Gemini-style input box supporting text + image upload (click + button)
- **Quick Action Buttons** - Restart Gateway, View Details, Check Updates, Sync Agents
- **Execution Results** - Real-time display of task execution results

**Usage:**
1. Enter task description in the input box
2. Click + button to upload image (supports multimodal analysis)
3. Click "Execute" button to submit task
4. System automatically routes to Secretariat for processing

---

### 🎛️ 3D Dashboard (EdictDashboard)

Core visualization page displaying Agent network 3D scene and task kanban.

**Key Features:**
- **3D Agent Network Graph** - Crown Prince at center, Six Ministries surrounding, dynamic connections show communication
- **Code Rain Background** - Green character fall animation creates sci-fi atmosphere
- **Real-time Activity Log** - Bottom panel shows real-time Agent activity records
- **Right-side Agent List** - Display all Agent statuses (Running/Idle/Offline)
- **Task Kanban** - Workflow Status area supporting drag-and-drop task cards

---

### 🤖 Agent Collaboration (AgentCollabView)

One-on-one conversation interface with individual Agents.

**Key Features:**
- **Left Agent List** - Display all Agents with status indicators and role info
- **Status Indicators** - 🟢 running (active), 🟡 idle (available), ⚫ offline
- **Right Chat Area** - Chat interface with selected Agent
- **Real-time Thinking Animation** - "Thinking..." animation before Agent responds
- **Message Input** - Support sending messages and clearing conversation

---

### 📊 Statistics (UsageStatsView)

Page displaying Agent runtime status and session statistics.

**Key Features:**
- **Overview Cards** - Total session count, online Agent count
- **Active Session List** - Display each Agent's session details, status, message count, last active time
- **Data Sync** - Support manual refresh to sync latest data from OpenClaw

---

### 💬 Session Management (SessionsView)

Detailed page for managing Agent sessions.

**Key Features:**
- **Top Statistics** - Display total sessions and total message count
- **Session List** - Individual cards for each Agent containing session count, message count, last active time

---

### 📋 Task Kanban (KanbanView)

Jira-like task management kanban board.

**Key Features:**
- **Multi-column Kanban** - Inbox / Secretariat Draft / Chancellery Review / In Progress / Pending Review / Done
- **Task Cards** - Display task title, priority, assignee
- **Drag-and-drop Flow** - Support dragging task cards between different status columns

---

### 📰 Morning Briefing (MorningView)

Daily briefing and news aggregation page.

---

### ⚙️ Skills Management (SkillsView)

Page for managing Agent skills.

**Key Features:**
- **Skills List** - View all installed skills
- **Skill Details** - View skill description, path, parameters
- **Skill Assignment** - Assign skills to different Agents

---

### 📡 Channel Management (ChannelsView)

Page for configuring message channels.

**Key Features:**
- **Channel List** - Web, Discord, Telegram, Slack, etc.
- **Channel Configuration** - Configure API keys and parameters for each channel
- **Message Routing** - Configure how messages route to different channels

---

### 🧠 Memory Management (MemoryView)

Page for viewing and managing Agent memory files.

**Key Features:**
- **Memory File List** - Display MEMORY.md files by date
- **Memory Content View** - View Agent's long-term memory
- **Memory Search** - Search for specific content

---

### 📝 Log Viewer (LogViewerView)

Page for real-time system log viewing.

**Key Features:**
- **Real-time Log Stream** - WebSocket real-time log push
- **Log Filtering** - Filter by level, Agent, time
- **Log Search** - Search for specific keywords

---

### 🔧 Service Management (ServiceManagerView)

Page for managing system services.

**Key Features:**
- **Service List** - Gateway, Agent and other services
- **Start/Stop** - Control service startup and shutdown
- **Status Monitoring** - Real-time display of service runtime status
- **Terminal Panel** - Built-in terminal for command execution

---

### 📦 Extensions (ExtensionsView)

Page for managing plugins and extensions.

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + TypeScript | 18.2.0 |
| **3D Engine** | Three.js + React Three Fiber | 0.160.0 |
| **State Management** | Zustand | 4.4.7 |
| **Animation** | Framer Motion + GSAP | 10.16.16 |
| **UI Styling** | Tailwind CSS | 3.4.0 |
| **Build Tool** | Vite | 5.0.8 |
| **Backend** | Spring Boot | 2.7.18 |
| **Database** | MySQL | 8.0+ |
| **ORM** | Spring Data JPA | 2.7.x |
| **AI Framework** | OpenClaw | latest |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                               │
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
│                          Backend Layer                               │
│                     Spring Boot 2.7.18 + Java 8                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  Controller │  │   Service   │  │  Repository │  │   Entity  │  │
│  │  (REST API) │  │  (Business) │  │    (JPA)    │  │   (Model) │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘  │
│         └────────────────┴────────────────┴────────────────┘        │
│                           │                                         │
│  ┌────────────────────────┴────────────────────────┐               │
│  │              OpenClaw CLI Integration           │               │
│  │     (openclaw agent / openclaw sessions)       │               │
│  └────────────────────────┬────────────────────────┘               │
└───────────────────────────┼────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌──────────────────┐      ┌──────────────────┐
    │      MySQL       │      │   OpenClaw       │
    │   (Data Storage) │      │   Gateway        │
    │                  │      │   (Port:3000)    │
    └──────────────────┘      └────────┬─────────┘
                                       │
                              ┌────────┴────────┐
                              │  AI Providers   │
                              │ (MiniMax/Kimi)  │
                              └─────────────────┘
```

---

## 🚀 Quick Start

### Requirements

- **OS**: Windows 10+ / macOS / Linux
- **Java**: JDK 1.8+
- **Node.js**: 18+
- **MySQL**: 8.0+
- **Maven**: 3.6+
- **OpenClaw**: Installed and configured

### 1. Database Initialization

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE edict CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Exit
exit
```

### 2. Configure Backend

Edit `edict-server/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/edict?characterEncoding=UTF-8
    username: root
    password: YOUR_MYSQL_PASSWORD
```

### 3. Start Backend Service

```bash
cd edict-server

# Compile and package
mvn clean package -DskipTests

# Run
mvn spring-boot:run

# Backend address: http://localhost:8080/api
```

### 4. Start Frontend

```bash
cd edict-web-3d

# Install dependencies
npm install

# Start dev server
npm run dev

# Frontend address: http://localhost:5173
```

### 5. Ensure OpenClaw is Running

```bash
# Check OpenClaw Gateway status
openclaw gateway status
openclaw gateway start  # If not running
```

---

## 📁 Project Structure

```
edictNew/
├── 📄 README.md                    # Project documentation
├── 📂 edict-server/                # Java backend service
│   ├── 📄 pom.xml                  # Maven configuration
│   └── 📂 src/main/java/com/edict/
│       ├── 📂 controller/          # REST API controllers
│       ├── 📂 service/             # Business logic layer
│       ├── 📂 entity/              # Database entities
│       ├── 📂 repository/          # Data access layer
│       ├── 📂 dto/                 # Data transfer objects
│       ├── 📂 config/              # Configuration classes
│       └── 📂 util/                # Utility classes
│
├── 📂 edict-web-3d/                # React frontend
│   ├── 📄 package.json             # npm configuration
│   ├── 📄 vite.config.ts           # Vite configuration
│   └── 📂 src/
│       ├── 📂 components/
│       │   ├── 📂 3d/              # 3D scene components
│       │   │   ├── NeuralScene.tsx
│       │   │   └── Scene.tsx
│       │   └── 📂 ui/              # UI components
│       │       ├── Overlay.tsx     # Main interface framework
│       │       ├── EdictDashboard.tsx
│       │       ├── AgentCollabView.tsx
│       │       ├── UsageStatsView.tsx
│       │       ├── SessionsView.tsx
│       │       ├── KanbanView.tsx
│       │       ├── GeminiInput.tsx
│       │       └── ...
│       ├── 📂 stores/
│       │   └── useStore.ts         # Zustand state management
│       └── 📂 hooks/               # Custom hooks
│
├── 📂 agents/                      # Agent configurations
│   ├── taizi/
│   ├── zhongshu/
│   ├── bingbu/
│   └── ...
├── 📂 docs/                        # Documentation
└── 📂 uploads/                     # Uploaded file storage
```

---

## 🔌 API Documentation

### Task Execution
```http
POST /api/task/execute
Content-Type: application/json

{
  "task": "Develop user login feature",
  "creator": "Crown Prince",
  "imageData": "data:image/png;base64,..."  // Optional
}
```

### Agent Status
```http
GET /api/agents-status
```

### Send Message to Agent
```http
POST /api/agent-message
Content-Type: application/json

{
  "agentId": "zhongshu",
  "message": "Please plan login feature",
  "imageData": "base64...",  // Optional
  "useVision": true          // Optional
}
```

### Sync Session Data
```http
POST /api/sync-sessions
```

---

## 🛠️ Development Guide

### Adding a New Page

1. Create component in `edict-web-3d/src/components/ui/`
2. Add navigation item to `tabs` array in `Overlay.tsx`
3. Add conditional rendering in `AnimatePresence`

### Adding a New API Endpoint

1. Create Controller in `controller` package
2. Implement business logic in `service` package
3. Define DTO in `dto` package

### Model Configuration

Edit OpenClaw configuration:

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

## 📜 License

MIT License © 2024 Edict Team

---

## 🙏 Acknowledgments

- [OpenClaw](https://github.com/1186258278/OpenClawChineseTranslation) - AI Agent Framework
- [MiniMax](https://platform.minimaxi.com) - Multimodal AI capabilities
- [Three.js](https://threejs.org/) - 3D Graphics Library
- [React](https://react.dev/) - Frontend Framework
- [Spring Boot](https://spring.io/projects/spring-boot) - Backend Framework

---

<p align="center">
  <strong>Let AI collaborate as efficiently as the ancient bureaucratic system 🏛️</strong>
</p>

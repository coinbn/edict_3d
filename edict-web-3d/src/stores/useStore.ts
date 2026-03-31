import { create } from 'zustand'

// Agent 类型定义
export interface Agent {
  id: string
  label: string
  emoji: string
  role: string
  model: string
  skills: { name: string; description: string; path: string }[]
  status?: 'idle' | 'running' | 'offline'
  tokens_in?: number
  tokens_out?: number
  sessions?: number
  messages?: number
}

// 任务类型定义
export interface Task {
  id: string
  title: string
  description: string
  state: string
  priority?: string
  org?: string
  official?: string
  now?: string
  created_at?: string
  updated_at?: string
  flow?: FlowEntry[]
}

export interface FlowEntry {
  at: string
  from: string
  to: string
  remark: string
}

// 显示设置类型
export interface DisplaySettings {
  autoRotate: boolean
  rotateSpeed: number
  showParticles: boolean
  particleDensity: 'low' | 'medium' | 'high'
  showGrid: boolean
  gridOpacity: number
  backgroundColor: string
  nodeGlowIntensity: number
  animationSpeed: number
  glassEffect: boolean
  cameraFov: number
  cameraDistance: number
}

// UI 状态
type ViewType = 'home' | 'edict' | 'stats' | 'morning' | 'messages' | 'agents' | 'skills' | 'logviewer' | 'settings'

interface UIState {
  activeView: ViewType
  selectedAgent: Agent | null
  selectedTask: Task | null
  displaySettings: DisplaySettings
  setActiveView: (view: ViewType) => void
  setSelectedAgent: (agent: Agent | null) => void
  setSelectedTask: (task: Task | null) => void
  updateDisplaySettings: (settings: Partial<DisplaySettings>) => void
  resetDisplaySettings: () => void
}

// 默认显示设置
const defaultDisplaySettings: DisplaySettings = {
  autoRotate: true,
  rotateSpeed: 1,
  showParticles: true,
  particleDensity: 'medium',
  showGrid: true,
  gridOpacity: 0.3,
  backgroundColor: '#050508',
  nodeGlowIntensity: 1.0,
  animationSpeed: 1,
  glassEffect: true,
  cameraFov: 60,
  cameraDistance: 22,
}

// 从 localStorage 加载显示设置
const loadDisplaySettings = (): DisplaySettings => {
  try {
    const saved = localStorage.getItem('displaySettings')
    if (saved) {
      return { ...defaultDisplaySettings, ...JSON.parse(saved) }
    }
  } catch {}
  return defaultDisplaySettings
}

// Pipeline 定义
export const PIPE = [
  { key: 'Inbox', label: '收件', icon: '📥', color: '#6a9eff' },
  { key: 'Zhongshu', label: '中书起草', icon: '📜', color: '#a07aff' },
  { key: 'Menxia', label: '门下审议', icon: '🔍', color: '#6a9eff' },
  { key: 'Doing', label: '执行中', icon: '⚙️', color: '#ff5270' },
  { key: 'Done', label: '已完成', icon: '✅', color: '#2ecc8a' },
] as const

// API 基础 URL
const getApiBase = () => {
  return localStorage.getItem('apiBase') || 'http://localhost:8080/api'
}

// Store
interface AppState {
  // Data
  agents: Agent[]
  tasks: Task[]
  collabMessages: ChatMessage[]
  collabLoading: boolean
  collabError: string | null
  loading: boolean
  error: string | null
  
  // UI
  ui: UIState
  
  // Actions
  fetchAgents: () => Promise<void>
  fetchTasks: () => Promise<void>
  fetchActivities: () => Promise<Activity[]>
  wakeAgent: (agentId: string) => Promise<boolean>
  executeTask: (task: string) => Promise<any>
  syncAgents: () => Promise<boolean>
  setApiBase: (base: string) => void
  createTask: (title: string, description: string, priority?: string) => Promise<boolean>
  updateTaskState: (taskId: string, newState: string) => Promise<boolean>
  fetchChatMessages: (channelId?: string, page?: number, size?: number) => Promise<void>
  sendChatMessage: (agentId: string, content: string, channelId?: string) => Promise<boolean>
  clearChatMessages: (channelId?: string) => Promise<boolean>
}

// Activity 类型
export interface Activity {
  time: string
  agent: string
  type: string
  text: string
  taskId?: string
}

export interface ChatMessage {
  id: string
  agentId: string
  content: string
  channelId?: string
  timestamp: string
  role?: 'user' | 'assistant'
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  agents: [],
  tasks: [],
  collabMessages: [],
  collabLoading: false,
  collabError: null,
  loading: false,
  error: null,
  
  ui: {
    activeView: 'home',
    selectedAgent: null,
    selectedTask: null,
    displaySettings: loadDisplaySettings(),
    setActiveView: (view) => set((state) => ({ 
      ui: { ...state.ui, activeView: view } 
    })),
    setSelectedAgent: (agent) => set((state) => ({ 
      ui: { ...state.ui, selectedAgent: agent } 
    })),
    setSelectedTask: (task) => set((state) => ({ 
      ui: { ...state.ui, selectedTask: task } 
    })),
    updateDisplaySettings: (settings) => set((state) => {
      const newSettings = { ...state.ui.displaySettings, ...settings }
      localStorage.setItem('displaySettings', JSON.stringify(newSettings))
      return { ui: { ...state.ui, displaySettings: newSettings } }
    }),
    resetDisplaySettings: () => set((state) => {
      localStorage.setItem('displaySettings', JSON.stringify(defaultDisplaySettings))
      return { ui: { ...state.ui, displaySettings: defaultDisplaySettings } }
    }),
  },
  
  // 设置 API 基础地址
  setApiBase: (base) => {
    localStorage.setItem('apiBase', base)
  },
  
  // Fetch agents from API
  fetchAgents: async () => {
    set({ loading: true, error: null })
    try {
      // 调用后端 API 获取真实 Agent 状态
      const apiBase = getApiBase()
      
      // 获取 Agent 配置和状态
      const [configRes, statusRes] = await Promise.all([
        fetch(`${apiBase}/agent-config`),
        fetch(`${apiBase}/agents-status`)
      ])
      
      if (!configRes.ok || !statusRes.ok) {
        throw new Error('Failed to fetch agents')
      }
      
      const configData = await configRes.json()
      const statusData = await statusRes.json()
      
      // 合并配置和状态
      if (configData.agents && statusData.agents) {
        const statusMap = new Map()
        statusData.agents.forEach((a: any) => {
          statusMap.set(a.id, a)
        })
        
        const agentsWithStatus: Agent[] = configData.agents.map((a: any) => {
          const statusInfo = statusMap.get(a.id) || {}
          return {
            ...a,
            status: statusInfo.status || 'idle',
            lastActive: statusInfo.lastActive,
            tokensIn: statusInfo.tokensIn,
            tokensOut: statusInfo.tokensOut,
            sessions: statusInfo.sessions,
            messages: statusInfo.messages
          }
        })
        set({ agents: agentsWithStatus, loading: false })
      } else {
        // Fallback: use config only
        set({ agents: configData.agents || [], loading: false })
      }
    } catch (error) {
      console.error('Fetch agents error:', error)
      set({ error: '获取 Agent 失败', loading: false })
    }
  },
  
  // Fetch tasks from API
  fetchTasks: async () => {
    set({ loading: true, error: null })
    try {
      const apiBase = getApiBase()
      // 使用正确的 kanban API 路径
      const response = await fetch(`${apiBase}/kanban/tasks`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      
      if (data.data) {
        set({ tasks: data.data, loading: false })
      }
    } catch (error) {
      console.error('Fetch tasks error:', error)
      set({ error: '获取任务失败', loading: false })
    }
  },
  
  // Fetch activities from API
  fetchActivities: async () => {
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/kanban/activities?limit=20`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }
      
      const data = await response.json()
      
      if (data.data) {
        return data.data as Activity[]
      }
      return []
    } catch (error) {
      console.error('Fetch activities error:', error)
      return []
    }
  },
  
  // Wake agent
  wakeAgent: async (agentId: string) => {
    set({ loading: true })
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/agent-wake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId })
      })
      const data = await response.json()
      set({ loading: false })
      
      if (data.ok) {
        set((state) => ({
          agents: state.agents.map(a => 
            a.id === agentId ? { ...a, status: 'running' as const } : a
          )
        }))
      }
      
      return data.ok === true
    } catch (error) {
      console.error('Wake agent error:', error)
      set({ error: '唤醒 Agent 失败', loading: false })
      return false
    }
  },
  
  // Execute task - 和太子 Agent 一样，调用中书省处理
  executeTask: async (task: string, imageData?: string) => {
    set({ loading: true, error: null })
    try {
      const apiBase = getApiBase()
      
      // 如果有图片，直接传给太子 Agent 进行视觉分析
      if (imageData) {
        const visionMessage = `📋 太子·图像分析任务
用户上传了一张图片，请分析图片内容并回答：${task || '描述这张图片'}

[系统提示：图片数据为 Base64 格式，你可以在分析中引用图片内容]`
        
        await fetch(`${apiBase}/agent-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            agentId: 'taizi',
            message: visionMessage,
            imageData: imageData,
            useVision: true // 标记使用视觉模型
          })
        })
        
        set({ loading: false })
        return { 
          ok: true, 
          message: '已提交图片分析任务给太子',
          hasImage: true 
        }
      }
      
      // 纯文本任务，走原来的流程
      const response = await fetch(`${apiBase}/task/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task, creator: '太子' })
      })
      
      if (!response.ok) {
        throw new Error('Task execution failed')
      }
      
      const data = await response.json()
      const taskId = data.taskId
      
      // 太子逻辑：调用中书省 Agent 处理任务
      const message = `📋 太子·旨意传达 任务ID: ${taskId} 任务内容: ${task} 请开始处理任务并汇报结果。`
      
      await fetch(`${apiBase}/agent-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentId: 'zhongshu',
          message: message
        })
      })
      
      // 刷新任务列表
      get().fetchTasks()
      
      set({ loading: false })
      return { ...data, message: '已转交中书省处理' }
    } catch (error) {
      console.error('Execute task error:', error)
      set({ error: '任务执行失败', loading: false })
      return { ok: false, error: String(error) }
    }
  },
  
  // Sync agents from OpenClaw
  syncAgents: async () => {
    set({ loading: true })
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/sync-agents`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.ok) {
        await get().fetchAgents()
      }
      
      set({ loading: false })
      return data.ok === true
    } catch (error) {
      console.error('Sync agents error:', error)
      set({ error: '同步失败', loading: false })
      return false
    }
  },
  
  // Create task
  createTask: async (title: string, description: string, priority: string = '中') => {
    set({ loading: true })
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/create-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority, description })
      })
      const data = await response.json()
      set({ loading: false })
      
      if (data.ok) {
        await get().fetchTasks()
      }
      
      return data.ok === true
    } catch (error) {
      console.error('Create task error:', error)
      set({ error: '创建任务失败', loading: false })
      return false
    }
  },
  
  // Update task state
  updateTaskState: async (taskId: string, newState: string) => {
    set({ loading: true })
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/tasks/${taskId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_state: newState, reason: '' })
      })
      const data = await response.json()
      set({ loading: false })
      
      if (data.ok) {
        await get().fetchTasks()
      }
      
      return data.ok === true
    } catch (error) {
      console.error('Update task state error:', error)
      set({ error: '更新任务状态失败', loading: false })
      return false
    }
  },

  fetchChatMessages: async (channelId: string = 'collab', page: number = 0, size: number = 100) => {
    set({ collabLoading: true, collabError: null })
    try {
      // 从 localStorage 读取消息历史
      const key = `chat_messages_${channelId}`
      const stored = localStorage.getItem(key)
      const messages = stored ? JSON.parse(stored) : []
      set({
        collabMessages: messages,
        collabLoading: false,
        collabError: null,
      })
    } catch (error) {
      console.error('Fetch chat messages error:', error)
      set({ collabLoading: false, collabError: '获取会话消息失败', collabMessages: [] })
    }
  },

  sendChatMessage: async (agentId: string, content: string, channelId: string = 'collab') => {
    try {
      // 先立即显示用户消息（优化体验）
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        agentId: 'user',
        content: content,
        timestamp: new Date().toISOString(),
        role: 'user'
      }
      
      // 获取当前消息，确保不丢失
      const currentMessages = get().collabMessages || []
      const tempMessages = [...currentMessages, userMessage]
      
      // 立即更新 UI 显示用户消息
      const key = `chat_messages_${channelId}`
      localStorage.setItem(key, JSON.stringify(tempMessages))
      set({ collabMessages: tempMessages, collabError: null, collabLoading: true })
      
      // 使用 Vite 代理到 OpenClaw Gateway（避免 CORS）
      const gatewayUrl = ''
      const token = 'f6507627b380b72a07e789e190ddae5da60ba83f7be5349e'
      
      // 不设置 session key，让 Gateway 为每个 agent 创建独立 session
      const sessionKey = undefined
      
      // 获取当前 channel 的历史消息（已在前面获取）
      const storedMessages = get().collabMessages || []
      
      // 转换历史消息为 API 格式（排除最后刚添加的用户消息，因为要重新发送）
      const historyMessages = storedMessages
        .filter((msg: ChatMessage) => msg.role !== 'user' || msg.content !== content)
        .map((msg: ChatMessage) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      
      // 构建消息历史（带上下文）
      const messages = [
        ...historyMessages,
        { role: 'user', content }
      ]
      
      console.log('=== History messages:', historyMessages.length, 'Total:', messages.length)
      
      console.log('=== Sending to agent:', agentId, '=== session:', sessionKey, '=== messages:', messages.length)
      
      // 尝试用 model 字段指定 agent（按文档推荐的方式）
      const modelName = `openclaw:${agentId}`
      console.log('=== Using model:', modelName)
      
      // 构建 headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-openclaw-agent-id': agentId
      }
      if (sessionKey) {
        headers['x-openclaw-session-key'] = sessionKey
      }
      console.log('=== Headers:', headers)
      
      const response = await fetch(`/v1/chat/completions`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          stream: false
        })
      })
      
      const data = await response.json()
      console.log('Response:', response.status, data)
      console.log('Content:', data.choices?.[0]?.message?.content)
      
      if (!response.ok) {
        set({ collabError: data.error?.message || `发送失败: ${response.status}` })
        return false
      }
      
      // 将 Agent 响应添加到消息列表
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        agentId: agentId,
        content: data.choices?.[0]?.message?.content || data.response || '',
        timestamp: new Date().toISOString(),
        role: 'assistant'
      }
      
      const finalMessages = [...tempMessages, assistantMessage]
      
      // 保存到 localStorage
      localStorage.setItem(key, JSON.stringify(finalMessages))
      
      set({ collabMessages: finalMessages, collabLoading: false })
      return true
    } catch (error) {
      console.error('Send chat message error:', error)
      set({ collabError: '发送会话消息失败', collabLoading: false })
      return false
    }
  },

  clearChatMessages: async (channelId: string = 'collab') => {
    try {
      // 清理 localStorage
      const key = `chat_messages_${channelId}`
      localStorage.removeItem(key)
      set({ collabMessages: [] })
      return true
    } catch (error) {
      console.error('Clear chat messages error:', error)
      set({ collabError: '清空会话消息失败' })
      return false
    }
  },
}))

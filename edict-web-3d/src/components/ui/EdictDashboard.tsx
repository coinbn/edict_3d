import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type Agent, PIPE, type Task, type Activity } from '../../stores/useStore'
import TerminalPanel from './TerminalPanel'

// 看板列状态映射：将前端看板列 key 映射到后端任务状态/org
const COLUMN_STATE_MAP: Record<string, { states: string[], orgs?: string[] }> = {
  'Inbox':    { states: ['ToDo'] },  // 收件：所有待处理任务
  'Zhongshu': { states: ['Doing'], orgs: ['中书省'] },  // 中书起草
  'Menxia':   { states: ['Doing'], orgs: ['门下省'] },  // 门下审议
  'Doing':    { states: ['Doing'], orgs: ['尚书省', '兵部', '工部', '户部', '刑部', '礼部', '吏部'] },  // 执行中
  'Review':   { states: ['Review'] },  // 待审查
  'Done':     { states: ['Done'] },  // 已完成
}

// 根据列 key 过滤任务
const filterTasksForColumn = (tasks: Task[], columnKey: string): Task[] => {
  const config = COLUMN_STATE_MAP[columnKey]
  if (!config) return []

  return tasks.filter(t => {
    // 匹配状态
    const stateMatch = config.states.includes(t.state)
    if (!stateMatch) return false

    // 如果有 org 要求，匹配 org（处理 null/undefined/空字符串）
    if (config.orgs) {
      // 标准化 org 值（null/undefined/'' 视为相同）
      const taskOrg = t.org || ''
      return config.orgs.some(org => {
        const expectedOrg = org || ''
        return expectedOrg === taskOrg
      })
    }

    return true
  })
}
const AGENT_ROLE_MAP: Record<string, { role: string; color: string; icon: string; x: number; y: number; isImage?: boolean }> = {
  taizi:    { role: 'Coordinator', color: '#3b82f6', icon: '/taizi_avatar.png', x: 0, y: 0, isImage: true },      // 太子-中心
  zhongshu: { role: 'Architect', color: '#06b6d4', icon: '🏗️', x: -8, y: -3 },    // 左上
  shangshu: { role: 'Tech Lead', color: '#f59e0b', icon: '👑', x: 8, y: -3 },     // 右上
  menxia:   { role: 'Reviewer', color: '#f97316', icon: '👁️', x: 0, y: -6 },     // 正上
  hubu:     { role: 'Data', color: '#8b5cf6', icon: '💰', x: -5, y: -5 },          // 上偏左
  bingbu:   { role: 'DevOps', color: '#ef4444', icon: '⚔️', x: -10, y: 2 },        // 左
  xingbu:   { role: 'QA', color: '#ec4899', icon: '⚖️', x: 10, y: 2 },             // 右
  gongbu:   { role: 'Engineer', color: '#22c55e', icon: '🔧', x: -6, y: 5 },       // 左下
  libu:     { role: 'Docs', color: '#14b8a6', icon: '📜', x: 6, y: 5 },            // 右下
  libu_hr:  { role: 'HR', color: '#f97316', icon: '🎓', x: 0, y: 6 },              // 吏部-正下
  zaochao:  { role: 'Morning', color: '#fbbf24', icon: '🌅', x: 0, y: 6.5 },      // 早朝官-正下方
}

// 浮动代码片段
const CODE_SNIPPETS = [
  { text: 'async/await', color: '#22d3ee' },
  { text: 'interface', color: '#a78bfa' },
  { text: 'import', color: '#34d399' },
  { text: 'const [', color: '#fbbf24' },
  { text: 'useState', color: '#f472b6' },
  { text: 'return (', color: '#60a5fa' },
  { text: 'export', color: '#a3e635' },
  { text: 'function', color: '#fb923c' },
]

// 格式化活动时间为 HH:MM
const formatActivityTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return timeStr
  }
}

// 活动日志显示
const formatActivityText = (activity: Activity) => {
  const typeIcon = activity.type === 'flow' ? '🔄' : '📝'
  return `${typeIcon} ${activity.text}`
}

export default function EdictDashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [progress, setProgress] = useState(0)
  const [timer, setTimer] = useState(0)
  const [activities, setActivities] = useState<Activity[]>([])

  // 从store获取真实Agent数据和全局选中状态
  const { agents, tasks, fetchAgents, fetchTasks, fetchActivities, ui } = useStore()
  
  // 使用 store 中的全局 selectedAgent
  const selectedAgentId = ui.selectedAgent?.id || null

  useEffect(() => {
    fetchAgents()
    fetchTasks()
    // 获取实时活动
    const loadActivities = async () => {
      const acts = await fetchActivities()
      setActivities(acts)
    }
    loadActivities()
    // 定时刷新活动
    const interval = setInterval(loadActivities, 5000)
    return () => clearInterval(interval)
  }, [])

  // 合并真实Agent和配置
  const displayAgents = agents.length > 0
    ? agents.map(agent => {
        const config = AGENT_ROLE_MAP[agent.id] || { role: 'Agent', color: '#6b7280', icon: '🤖', x: 0, y: 0 }
        return {
          ...agent,
          ...config,
          status: agent.status === 'running' ? 'Working' : 
                  agent.status === 'idle' ? 'Idle' : 
                  agent.status === 'offline' ? 'Offline' : 
                  agent.status || 'Idle',
          isImage: config.isImage || false,
          icon: config.icon  // 确保使用配置中的icon
        }
      })
    : Object.entries(AGENT_ROLE_MAP).map(([id, config]) => ({
        id,
        label: id,
        ...config,
        status: 'Idle',
        model: 'MiniMax-M2.5',
        skills: []
      }))

  // 统计任务状态
  const taskStats = {
    total: tasks.length,
    done: tasks.filter(t => t.state === 'Done').length,
    doing: tasks.filter(t => ['Doing', 'Zhongshu', 'Menxia'].includes(t.state)).length,
    todo: tasks.filter(t => t.state === 'ToDo').length,
  }

  // 进度动画
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => t + 1)
      setProgress(p => Math.min(100, p + Math.random() * 2))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // 代码雨背景
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const columns = Math.floor(canvas.width / 12)
    // 每列从随机高度开始，不是同时从顶部开始
    const drops: number[] = Array(columns).fill(0).map(() => -Math.floor(Math.random() * 50))
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 8, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = '12px monospace'
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]
        const x = i * 12
        const y = drops[i] * 14

        // 头部高亮（白色闪光）
        if (y > 0 && y < canvas.height) {
          // 绘制头部白色高亮字符
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = '#22d3ee'
          ctx.shadowBlur = 10
          ctx.fillText(text, x, y)
          ctx.shadowBlur = 0

          // 绘制后面的尾巴（渐变色）
          for (let j = 1; j < 8; j++) {
            const tailY = y - j * 14
            if (tailY > 0) {
              const tailChar = chars[Math.floor(Math.random() * chars.length)]
              const alpha = Math.max(0, 0.6 - j * 0.08)
              ctx.fillStyle = `rgba(34, 211, 238, ${alpha})`
              ctx.fillText(tailChar, x, tailY)
            }
          }
        }

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = -Math.floor(Math.random() * 30) // 重置时也从随机高度开始
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 40)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div className="h-full w-full flex bg-[#050508] text-white overflow-hidden font-mono text-sm">
      {/* 左侧主区域 */}
      <div className="flex-1 flex flex-col relative">
        {/* 代码雨背景 - 全屏覆盖 */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        />

        {/* 顶部面包屑和进度 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#050508]/80 backdrop-blur z-10 relative">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="text-cyan-400 font-semibold">AGENT TEAM</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">{Math.floor(progress)}%</span>
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-white/40 font-mono">{formatTime(timer)}</span>
          </div>
        </div>

        {/* Agent网络图 */}
        <div className="flex-1 relative overflow-hidden z-10">
          <AgentNetwork
            agents={displayAgents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={(id) => {
              const agent = agents.find(a => a.id === id)
              if (agent) ui.setSelectedAgent(agent)
            }}
          />

          {/* 浮动代码片段 */}
          <FloatingCodeSnippets />
        </div>

        {/* 底部活动日志 */}
        <div className="h-48 border-t border-white/10 bg-[#0a0a0f]/90 backdrop-blur z-10">
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Live Activity</span>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-36px)]">
            {activities.length > 0 ? (
              activities.map((activity, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 text-xs"
                >
                  <span className="text-white/30 font-mono">{formatActivityTime(activity.time)}</span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                    {activity.agent}
                  </span>
                  <span className="text-white/70">{formatActivityText(activity)}</span>
                </motion.div>
              ))
            ) : (
              <div className="text-white/30 text-xs">暂无活动记录</div>
            )}
          </div>
        </div>
      </div>

      {/* 右侧边栏 */}
      <div className="w-[420px] border-l border-white/10 bg-[#0a0a0f]/90 backdrop-blur flex flex-col z-10">
        {/* AGENTS列表 */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Agents</span>
            <span className="text-xs text-white/40">{displayAgents.length}</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {displayAgents.map((agent) => (
              <motion.div
                key={agent.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => ui.setSelectedAgent(agent)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedAgentId === agent.id
                    ? 'bg-white/10 border border-white/20'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg overflow-hidden"
                  style={{ backgroundColor: `${agent.color}20`, border: `1px solid ${agent.color}50` }}
                >
                  {(agent as any).isImage ? (
                    <img src={agent.icon} alt={agent.label} className="w-full h-full object-cover" />
                  ) : (
                    agent.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{agent.label}</div>
                  <div className="text-xs text-white/40">{agent.role}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{
                      backgroundColor:
                        agent.status === 'running' || agent.status === 'Working' ? '#22c55e' :
                        agent.status === 'idle' || agent.status === 'Idle' ? '#3b82f6' :
                        '#6b7280'
                    }}
                  />
                  <span className="text-xs text-white/50">{agent.status || 'idle'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Workflow Status */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Workflow Status</span>
            <button
              onClick={() => fetchTasks()}
              className="text-xs px-2 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded hover:bg-cyan-500/30"
            >
              刷新
            </button>
          </div>
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 p-4 h-full min-w-max">
              {PIPE.map((column) => (
                <KanbanColumn
                  key={column.key}
                  column={column}
                  tasks={filterTasksForColumn(tasks, column.key)}
                  onSelectTask={(task) => console.log('Selected:', task)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* TERMINAL - 真实终端 */}
        <div className="h-32 border-t border-white/5">
          <TerminalPanel />
        </div>
      </div>
    </div>
  )
}

// Agent网络组件
function AgentNetwork({ agents, selectedAgentId, onSelectAgent }: {
  agents: ReturnType<typeof useStore.getState>['agents'] & Array<{ icon: string; color: string; x: number; y: number; status: string }>
  selectedAgentId: string | null
  onSelectAgent: (id: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [particles, setParticles] = useState<Array<{
    id: number
    from: string
    to: string
    progress: number
    speed: number
  }>>([])

  useEffect(() => {
    if (!containerRef.current) return
    const updateDimensions = () => {
      setDimensions({
        width: containerRef.current!.offsetWidth,
        height: containerRef.current!.offsetHeight
      })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // 粒子流动动画
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        // 更新现有粒子
        const updated = prev
          .map(p => ({ ...p, progress: p.progress + p.speed }))
          .filter(p => p.progress < 1)

        // 随机生成新粒子
        if (Math.random() < 0.3) {
          const fromAgent = agents[Math.floor(Math.random() * agents.length)]
          const toAgent = agents[Math.floor(Math.random() * agents.length)]
          if (fromAgent.id !== toAgent.id) {
            updated.push({
              id: Date.now() + Math.random(),
              from: fromAgent.id,
              to: toAgent.id,
              progress: 0,
              speed: 0.01 + Math.random() * 0.01
            })
          }
        }
        return updated
      })
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const centerX = dimensions.width / 2
  const centerY = dimensions.height / 2
  const scale = Math.min(dimensions.width, dimensions.height) / 18

  // 获取Agent位置
  const getAgentPos = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return { x: 0, y: 0 }
    return {
      x: centerX + agent.x * scale,
      y: centerY + agent.y * scale
    }
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0)" />
            <stop offset="50%" stopColor="rgba(34, 211, 238, 0.3)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
          </linearGradient>
        </defs>

        {/* 连线 */}
        {agents.map((agent, i) =>
          agents.slice(i + 1).map((other) => {
            const x1 = centerX + agent.x * scale
            const y1 = centerY + agent.y * scale
            const x2 = centerX + other.x * scale
            const y2 = centerY + other.y * scale

            return (
              <g key={`${agent.id}-${other.id}`}>
                {/* 基础连线 */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(34, 211, 238, 0.15)"
                  strokeWidth="1"
                />
                {/* 虚线效果 */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(34, 211, 238, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                  filter="url(#glow)"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="10"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </line>
              </g>
            )
          })
        )}

        {/* 流动粒子 */}
        {particles.map(particle => {
          const from = getAgentPos(particle.from)
          const to = getAgentPos(particle.to)
          const x = from.x + (to.x - from.x) * particle.progress
          const y = from.y + (to.y - from.y) * particle.progress

          // 获取目标 Agent 的颜色
          const toAgent = agents.find(a => a.id === particle.to)
          const particleColor = toAgent?.color || '#22d3ee'

          return (
            <circle
              key={particle.id}
              cx={x}
              cy={y}
              r="4"
              fill={particleColor}
              filter="url(#glow)"
              opacity={1 - Math.abs(particle.progress - 0.5) * 2}
            />
          )
        })}
      </svg>

      {/* Agent节点 */}
      {agents.map((agent) => {
        const x = centerX + agent.x * scale
        const y = centerY + agent.y * scale
        const isSelected = selectedAgentId === agent.id

        return (
          <div
            key={agent.id}
            className="absolute cursor-pointer"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onSelectAgent(isSelected ? null : agent.id)}
          >
            {/* 外圈旋转光环 - 虚线 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full border-2 border-dashed"
              style={{ 
                borderColor: `${agent.color}40`,
                width: 110,
                height: 110,
                left: -27,
                top: -27
              }}
            />

            {/* 电子轨道效果 - 外圈带小点旋转 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full"
              style={{
                width: 120,
                height: 120,
                left: -32,
                top: -32,
                border: `1px solid ${agent.color}20`,
              }}
            >
              {/* 电子点1 */}
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: agent.color,
                  boxShadow: `0 0 10px ${agent.color}`,
                  top: '50%',
                  left: '50%',
                  marginTop: '-4px',
                  marginLeft: '-4px',
                }}
              />
              {/* 电子点2 - 对角 */}
              <motion.div
                animate={{ 
                  rotate: [0, -360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: agent.color,
                  boxShadow: `0 0 8px ${agent.color}`,
                  top: '10%',
                  left: '10%',
                }}
              />
            </motion.div>

            {/* 第二层电子轨道 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full"
              style={{
                width: 100,
                height: 100,
                left: -22,
                top: -22,
                border: `1px dashed ${agent.color}30`,
              }}
            >
              {/* 电子点3 */}
              <motion.div
                animate={{ 
                  rotate: [0, -360],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute w-1 h-1 rounded-full bg-white"
                style={{
                  boxShadow: `0 0 6px white`,
                  top: '50%',
                  right: '-2px',
                  marginTop: '-2px',
                }}
              />
            </motion.div>

            {/* 反向旋转光环 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute rounded-full border border-dotted"
              style={{ 
                borderColor: `${agent.color}30`,
                width: 90,
                height: 90,
                left: -17,
                top: -17
              }}
            />

            {/* 外圈渐变光晕 */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute rounded-full"
              style={{
                background: `radial-gradient(circle, ${agent.color}40 0%, transparent 70%)`,
                width: 80,
                height: 80,
                left: -8,
                top: -8,
              }}
            />

            {/* 脉冲效果 */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute rounded-full"
              style={{ 
                backgroundColor: agent.color,
                filter: 'blur(10px)',
                width: 64,
                height: 64,
                left: 0,
                top: 0
              }}
            />

            {/* 主节点 - 呼吸动画 */}
            <motion.div
              className="relative w-16 h-16 rounded-full flex items-center justify-center text-2xl overflow-hidden"
              style={{
                backgroundColor: `${agent.color}25`,
                border: `2px solid ${agent.color}`,
                boxShadow: `0 0 30px ${agent.color}60, inset 0 0 25px ${agent.color}30`
              }}
              animate={{
                scale: isSelected ? [1.3, 1.6, 1.3] : [1, 1.3, 1],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                ease: 'easeInOut',
                delay: Math.random() * 2
              }}
            >
              {(agent as any).isImage ? (
                <img
                  src={agent.icon}
                  alt={agent.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                agent.icon
              )}
            </motion.div>

            {/* 标签 */}
            <div className="absolute top-full mt-3 left-1/2 text-center whitespace-nowrap"
              style={{ transform: 'translateX(-50%)' }}
            >
              <div className="text-sm font-bold" style={{ color: agent.color }}>{agent.label}</div>
              <div className="text-xs text-white/50">{agent.role}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 浮动代码片段 - 在节点间飘动
function FloatingCodeSnippets() {
  const [snippets, setSnippets] = useState<Array<{
    id: number
    text: string
    color: string
    x: number
    y: number
    opacity: number
    scale: number
  }>>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setSnippets(prev => {
        // 更新现有片段
        const updated = prev
          .map(s => ({
            ...s,
            y: s.y - 0.5,
            opacity: s.opacity - 0.01,
            scale: s.scale + 0.002
          }))
          .filter(s => s.opacity > 0)

        // 随机生成新片段
        if (Math.random() < 0.1 && updated.length < 5) {
          const code = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]
          updated.push({
            id: Date.now(),
            text: code.text,
            color: code.color,
            x: 20 + Math.random() * 60,
            y: 80,
            opacity: 0.6,
            scale: 1
          })
        }
        return updated
      })
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {snippets.map(s => (
        <motion.div
          key={s.id}
          className="absolute font-mono text-xs pointer-events-none"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            color: s.color,
            opacity: s.opacity,
            transform: `scale(${s.scale})`,
            textShadow: `0 0 10px ${s.color}80`
          }}
        >
          {s.text}
        </motion.div>
      ))}
    </>
  )
}

// 看板列组件
function KanbanColumn({
  column,
  tasks,
  onSelectTask
}: {
  column: typeof PIPE[0]
  tasks: Task[]
  onSelectTask: (task: Task) => void
}) {
  return (
    <div className="w-48 flex-shrink-0 flex flex-col h-full">
      {/* 列标题 */}
      <div
        className="rounded-t-lg px-3 py-2 bg-white/5 border-t-2"
        style={{ borderColor: column.color }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium" style={{ color: column.color }}>
            {column.icon} {column.label}
          </span>
          <span className="text-white/40 text-xs">{tasks.length}</span>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 bg-white/5 rounded-b-lg p-2 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="h-16 flex items-center justify-center text-white/20 text-xs">
            暂无任务
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onSelectTask(task)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 任务卡片组件
function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const priorityColors: Record<string, string> = {
    '高': 'text-red-400',
    '中': 'text-yellow-400',
    '低': 'text-green-400',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className="bg-white/10 rounded-lg p-2 cursor-pointer hover:bg-white/20 transition-colors"
    >
      <div className="flex items-start justify-between mb-1">
        <span className={`text-xs font-medium ${priorityColors[task.priority || '中']}`}>
          {task.priority || '中'}
        </span>
        <span className="text-xs text-white/30">{task.id}</span>
      </div>
      <h4 className="text-white text-xs font-medium mb-1 line-clamp-2">
        {task.title}
      </h4>
      {task.org && (
        <div className="text-xs text-white/40">
          {task.org}
        </div>
      )}
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import EdictDashboard from './EdictDashboard'
import MorningView from './MorningView'
import SessionsView from './SessionsView'
import SkillsView from './SkillsView'
import AgentCollabView from './AgentCollabView'
import ChaosButton from './ChaosButton'
import GeminiInput from './GeminiInput'
import LogViewerView from './LogViewerView'
import MemoryView from './MemoryView'
import ChannelsView from './ChannelsView'
import ServiceManagerView from './ServiceManagerView'
import UsageStatsView from './UsageStatsView'
import ImageRecognitionView from './ImageRecognitionView'
import ExtensionsView from './ExtensionsView'

export default function Overlay() {
  const { agents, ui, fetchAgents, wakeAgent, executeTask, loading, syncAgents } = useStore()
  
  // 加载时获取数据
  useEffect(() => {
    fetchAgents()
  }, [])
  
  // 标签页配置
  const tabs = [
    { key: 'home', label: '首页', icon: '🏠' },
    { key: 'edict', label: '仪表板', icon: '🎛️' },
    { key: 'stats', label: '统计', icon: '📊' },
    { key: 'morning', label: '早报', icon: '📰' },
    { key: 'messages', label: '会话', icon: '💬' },
    { key: 'agents', label: 'Agent', icon: '🤖' },
    { key: 'skills', label: '技能', icon: '⚙️' },
    { key: 'logviewer', label: '日志', icon: '📜' },
    { key: 'settings', label: '设置', icon: '🔧' },
  ]
  
  // 获取当前激活标签的索引
  const activeIndex = tabs.findIndex(t => t.key === ui.activeView)
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 顶部导航 - tabs-pro 风格 */}
      <header className="pointer-events-auto flex items-center justify-between px-8 pt-4">
        {/* Logo - Netflix Style Animated */}
        <NetflixLogo />
        
        {/* 标签页导航 */}
        <div className="rounded-2xl px-4 py-3 bg-gradient-to-r from-indigo-950 via-purple-950 to-cyan-950 border border-white/10 backdrop-blur-xl shadow-lg relative overflow-hidden animate-breathe">
          {/* 顶部高光线条 */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"></div>
          
          {/* 标签页按钮容器 */}
          <div className="flex gap-2 relative">
            {/* 激活指示器 */}
            <div 
              className="absolute h-full rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 shadow-[0_4px_24px_rgba(34,211,238,0.4),0_0_48px_rgba(99,102,241,0.2)] transition-all duration-500 ease-out"
              style={{
                width: `${100 / tabs.length}%`,
                transform: `translateX(${activeIndex * 100}%)`
              }}
            />
            
            {tabs.map((item) => (
              <button
                key={item.key}
                onClick={() => ui.setActiveView(item.key as any)}
                className={`px-5 py-2 rounded-xl text-base font-semibold transition-all duration-300 relative z-10 flex items-center gap-2 whitespace-nowrap ${
                  ui.activeView === item.key
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <span className={ui.activeView === item.key ? 'scale-110' : ''}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* 右侧占位 */}
        <div className="w-24"></div>
      </header>
      
      {/* 主内容区域 */}
      <main className="absolute left-0 right-0 bottom-0 overflow-y-auto pointer-events-auto" style={{ top: '80px', paddingBottom: '64px' }}>
        <AnimatePresence mode="wait">
          {ui.activeView === 'home' && <HomeView key="home" />}
          {ui.activeView === 'edict' && <EdictDashboard key="edict" />}
          {ui.activeView === 'stats' && <UsageStatsView key="stats" />}
          {ui.activeView === 'morning' && <MorningView key="morning" />}
          {ui.activeView === 'messages' && <AgentCollabView key="messages" />}
          {ui.activeView === 'agents' && <AgentsView key="agents" />}
          {ui.activeView === 'sessions' && <SessionsView key="sessions" />}
          {ui.activeView === 'tasks' && <TasksView key="tasks" />}
          {ui.activeView === 'skills' && <SkillsView key="skills" />}
          {ui.activeView === 'logviewer' && <LogViewerView key="logviewer" />}
          {ui.activeView === 'settings' && <SettingsView key="settings" />}
        </AnimatePresence>
      </main>
      
      {/* Agent 详情面板 */}
      <AnimatePresence>
        {ui.selectedAgent && (
          <AgentPanel 
            agent={ui.selectedAgent} 
            onClose={() => ui.setSelectedAgent(null)}
            onWake={() => wakeAgent(ui.selectedAgent!.id)}
          />
        )}
      </AnimatePresence>
      
      {/* 底部状态栏 */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center text-white/40 text-xs bg-black/20 pointer-events-auto">
        <div>Agent: {agents.length}</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          在线
        </div>
      </footer>
    </div>
  )
}

// 首页视图
function HomeView() {
  const { agents, tasks, executeTask, loading, fetchAgents, fetchTasks, ui } = useStore()
  const [taskInput, setTaskInput] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [gatewayStatus, setGatewayStatus] = useState<any>(null)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(
    () => localStorage.getItem('pollingTaskId') // 持久化，恢复时读取
  )

  const getApiBase = () => {
    return localStorage.getItem('apiBase') || 'http://localhost:8080/api'
  }

  // 获取 Gateway 和系统状态
  const fetchSystemStatus = async () => {
    try {
      const apiBase = getApiBase()
      const gatewayRes = await fetch(`${apiBase}/agents-status`)
      const gatewayData = await gatewayRes.json()
      setGatewayStatus(gatewayData)
      setSystemInfo({
        totalAgents: gatewayData.agents?.length || 0,
        runningAgents: gatewayData.agents?.filter((a: any) => a.status === "running").length || 0,
        idleAgents: gatewayData.agents?.filter((a: any) => a.status === "idle").length || 0,
        totalTokens: gatewayData.agents?.reduce((sum: number, a: any) => sum + (a.tokensIn || 0) + (a.tokensOut || 0), 0) || 0,
      })
    } catch (error) {
      console.error("Fetch system status error:", error)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    fetchAgents()
    fetchTasks() // 页面加载时获取最新任务
  }, [])

  // 页面加载时，检查是否有正在执行的任务，自动恢复轮询
  useEffect(() => {
    if (tasks.length === 0) return

    // 如果已经有轮询中的任务，跳过
    if (pollingTaskId) return

    // 优先从 localStorage 恢复轮询
    const savedTaskId = localStorage.getItem('pollingTaskId')
    if (savedTaskId) {
      const savedTask = tasks.find(t => t.id === savedTaskId)
      if (savedTask && (savedTask.state === 'Doing' || savedTask.state === 'Review')) {
        console.log('恢复轮询任务:', savedTaskId)
        setPollingTaskId(savedTaskId)
        setResult({
          taskId: savedTaskId,
          message: '继续跟踪任务进度'
        })
        return
      } else {
        // 任务已不在执行状态，清除缓存
        localStorage.removeItem('pollingTaskId')
      }
    }

    // 否则查找 Doing 或 Review 状态的任务
    const executingTask = tasks.find(t =>
      t.state === 'Doing' || t.state === 'Review'
    )

    if (executingTask) {
      console.log('发现正在执行的任务:', executingTask.id)
      setPollingTaskId(executingTask.id)
      localStorage.setItem('pollingTaskId', executingTask.id)
      setResult({
        taskId: executingTask.id,
        message: '继续跟踪任务进度'
      })
    }
  }, [tasks.length]) // tasks 加载完成后检查

  // 轮询任务状态
  useEffect(() => {
    if (!pollingTaskId) return

    const pollInterval = setInterval(async () => {
      await fetchTasks()
    }, 3000) // 每3秒轮询

    return () => clearInterval(pollInterval)
  }, [pollingTaskId, fetchTasks])

  // 监听任务完成，自动停止轮询
  useEffect(() => {
    if (!pollingTaskId) return

    const currentTask = tasks.find(t => t.id === pollingTaskId)
    if (currentTask && (currentTask.state === 'Done' || currentTask.state === 'Cancelled' || currentTask.state === 'Blocked')) {
      // 任务已结束，停止轮询
      setTimeout(() => {
        setPollingTaskId(null)
        localStorage.removeItem('pollingTaskId')
        setResult(prev => ({ ...prev, message: '任务已完成' }))
      }, 3000) // 3秒后停止
    }
  }, [tasks, pollingTaskId])

  const handleExecute = async () => {
    if (!taskInput.trim() && !selectedImage) return

    // 调用 executeTask，传递图片数据
    const res = await executeTask(taskInput, selectedImage || undefined)
    setResult(res)

    // 启动轮询
    if (res.taskId) {
      setPollingTaskId(res.taskId)
      localStorage.setItem('pollingTaskId', res.taskId)
      await fetchTasks()
    }

    // 执行后清除图片
    setSelectedImage(null)
  }

  const handleImageUpload = (imageData: string) => {
    setSelectedImage(imageData)
    console.log('图片已上传:', imageData.substring(0, 100) + '...')
  }

  // 重启 Gateway
  const handleRestartGateway = async () => {
    if (!confirm("确定要重启 Gateway 吗？")) return
    setActionLoading("restart")
    try {
      const apiBase = getApiBase()
      const res = await fetch(`${apiBase}/gateway/restart`, { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        alert("Gateway 重启成功")
        await fetchSystemStatus()
      } else {
        alert("重启失败: " + data.error)
      }
    } catch (error) {
      alert("重启失败")
    } finally {
      setActionLoading(null)
    }
  }

  // 检查更新
  const handleCheckUpdate = async () => {
    setActionLoading("update")
    try {
      const apiBase = getApiBase()
      const res = await fetch(`${apiBase}/gateway/version`)
      const data = await res.json()
      alert(`当前版本: ${data.version}\n最新版本: ${data.latestVersion || data.version}\n${data.hasUpdate ? "有可用更新!" : "已是最新版本"}`)
    } catch (error) {
      alert("检查更新失败")
    } finally {
      setActionLoading(null)
    }
  }

  // 同步 Agents
  const handleSyncAgents = async () => {
    setActionLoading("sync")
    try {
      const apiBase = getApiBase()
      const res = await fetch(`${apiBase}/sync-agents`, { method: "POST" })
      const data = await res.json()
      if (data.ok) {
        alert("同步成功")
        await fetchAgents()
        await fetchSystemStatus()
      } else {
        alert("同步失败: " + data.error)
      }
    } catch (error) {
      alert("同步失败")
    } finally {
      setActionLoading(null)
    }
  }

  // 格式化 Token
  const formatTokens = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(0) + "K"
    return num.toString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full overflow-y-auto px-8 py-4"
    >
      {/* 欢迎语 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">
          <span className="text-cyan-400">Agent</span> 协作平台
        </h1>
        <p className="text-white/40">让 AI Agent 为您协同工作</p>
      </div>
      
      {/* 快速操作 */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg text-white mb-4">快速任务</h3>
          <div className="flex gap-3 items-center">
            <GeminiInput
              value={taskInput}
              onChange={setTaskInput}
              onSubmit={handleExecute}
              onImageUpload={handleImageUpload}
              placeholder="描述您想要完成的任务..."
              className="flex-1"
            />
            <ChaosButton
              onClick={handleExecute}
              disabled={loading || (!taskInput.trim() && !selectedImage)}
              className="flex-shrink-0 text-xs px-2 py-1"
            >
              {loading ? '执行中...' : '执行'}
            </ChaosButton>
          </div>
        </div>
      </div>
      
      {/* 结果展示 + 任务进度 */}
      {result && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="max-w-4xl mx-auto"
        >
          {/* 提交成功提示 */}
          <div className="glass rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">📮</div>
              <div>
                <h3 className="text-lg text-white">{result.message || '已提交给太子处理'}</h3>
                {result.taskId && (
                  <p className="text-sm text-white/50">任务ID: {result.taskId}</p>
                )}
              </div>
            </div>
            {pollingTaskId && (
              <p className="text-sm text-cyan-400 animate-pulse">⏳ 太子正在协调三省六部执行中，每3秒刷新进度...</p>
            )}
          </div>

          {/* 当前任务进度卡片 */}
          {pollingTaskId && tasks.find(t => t.id === pollingTaskId) && (
            <div className="glass rounded-2xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-white">📋 当前任务进度</h3>
                <button
                  onClick={() => {
                    setPollingTaskId(null)
                    localStorage.removeItem('pollingTaskId')
                    setResult(null)
                  }}
                  className="text-xs text-white/40 hover:text-white"
                >
                  关闭
                </button>
              </div>
              {(() => {
                const currentTask = tasks.find(t => t.id === pollingTaskId)
                if (!currentTask) return null
                return (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        currentTask.state === 'Done' ? 'bg-green-500/20 text-green-400' :
                        currentTask.state === 'Doing' ? 'bg-yellow-500/20 text-yellow-400' :
                        currentTask.state === 'Review' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {currentTask.state === 'ToDo' ? '⏳ 待开始' :
                         currentTask.state === 'Doing' ? '⚙️ 执行中' :
                         currentTask.state === 'Review' ? '🔍 审核中' :
                         currentTask.state === 'Done' ? '✅ 已完成' :
                         currentTask.state}
                      </span>
                      <span className="text-white/60 text-sm">{currentTask.title}</span>
                    </div>
                    {currentTask.now && (
                      <p className="text-sm text-white/70">{currentTask.now}</p>
                    )}
                    {currentTask.flow && currentTask.flow.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-white/40 mb-2">流转记录</p>
                        <div className="space-y-1">
                          {currentTask.flow.slice(-3).map((entry: any, idx: number) => (
                            <p key={idx} className="text-xs text-white/50">
                              {entry.from} → {entry.to}: {entry.remark}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 完成后停止轮询 */}
                    {currentTask.state === 'Done' && (
                      <p className="text-sm text-green-400 mt-3">🎉 任务已完成！太子已回奏皇上。</p>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* 如果没有对应任务，显示原始结果 */}
          {pollingTaskId && !tasks.find(t => t.id === pollingTaskId) && (
            <div className="glass rounded-2xl p-6">
              <pre className="text-sm text-white/70 whitespace-pre-wrap overflow-auto max-h-96">
                {result.summary || result.error || JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </motion.div>
      )}
      
      {/* OpenClaw 运行状态概览 */}
      <div className="max-w-4xl mx-auto mt-8">
        <h3 className="text-lg text-white mb-4">🎛️ OpenClaw 运行状态</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Gateway 状态 */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-xl">🌐</div>
              <div>
                <div className="text-white font-medium">Gateway</div>
                <div className="text-xs text-green-400">运行中</div>
              </div>
            </div>
            <div className="text-xs text-white/40">端口: 18789</div>
            <div className="text-xs text-white/40">版本: v3.0.0</div>
          </div>

          {/* Agent 数量 */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl">🤖</div>
              <div>
                <div className="text-white font-medium">Agent</div>
                <div className="text-2xl font-bold text-cyan-400">{agents.length || 9}</div>
              </div>
            </div>
            <div className="text-xs text-white/40">{agents.filter((a: any) => a.status === 'running').length || 3} 个运行中</div>
            <div className="text-xs text-white/40">{agents.filter((a: any) => a.status === 'idle').length || 6} 个空闲</div>
          </div>

          {/* 模型池 */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl">🧠</div>
              <div>
                <div className="text-white font-medium">模型池</div>
                <div className="text-2xl font-bold text-purple-400">12</div>
              </div>
            </div>
            <div className="text-xs text-white/40">5 个提供商</div>
            <div className="text-xs text-white/40">主模型: MiniMax-M2.5</div>
          </div>

          {/* 系统状态 */}
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-xl">⚙️</div>
              <div>
                <div className="text-white font-medium">系统</div>
                <div className="text-xs text-green-400">正常</div>
              </div>
            </div>
            <div className="text-xs text-white/40">运行时间: 2d 5h</div>
            <div className="text-xs text-white/40">内存: 256MB</div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="flex gap-3 mt-4">
          <button 
            onClick={handleRestartGateway}
            disabled={actionLoading === 'restart'}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm disabled:opacity-50"
          >
            {actionLoading === 'restart' ? '重启中...' : '🔄 重启 Gateway'}
          </button>
          <button 
            onClick={() => ui.setActiveView('stats')}
            className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
          >
            📊 查看详情
          </button>
          <button 
            onClick={handleCheckUpdate}
            disabled={actionLoading === 'update'}
            className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
          >
            {actionLoading === 'update' ? '检查中...' : '✓ 检查更新'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Agent 列表视图
function AgentsView() {
  const { agents, wakeAgent, loading, fetchAgents, ui } = useStore()

  useEffect(() => {
    fetchAgents()
  }, [])
  
  // 默认 Agent 数据
  const defaultAgents = [
    { id: 'taizi', label: '太子', emoji: '👑', role: '东宫太子', model: 'MiniMax-M2.5', skills: [] },
    { id: 'zhongshu', label: '中书省', emoji: '✍️', role: '中书令', model: 'MiniMax-M2.5', skills: [] },
    { id: 'shangshu', label: '尚书省', emoji: '👑', role: '尚书令', model: 'MiniMax-M2.5', skills: [] },
    { id: 'bingbu', label: '兵部', emoji: '⚔️', role: '兵部尚书', model: 'MiniMax-M2.5', skills: [] },
    { id: 'gongbu', label: '工部', emoji: '🔧', role: '工部尚书', model: 'MiniMax-M2.5', skills: [] },
    { id: 'hubu', label: '户部', emoji: '💰', role: '户部尚书', model: 'MiniMax-M2.5', skills: [] },
    { id: 'xingbu', label: '刑部', emoji: '⚖️', role: '刑部尚书', model: 'MiniMax-M2.5', skills: [] },
    { id: 'libu', label: '礼部', emoji: '📜', role: '礼部尚书', model: 'MiniMax-M2.5', skills: [] },
    { id: 'menxia', label: '门下省', emoji: '👁️', role: '侍中', model: 'MiniMax-M2.5', skills: [] },
  ]
  
  // 使用 API 数据或默认数据
  const displayAgents = agents.length > 0 ? agents : defaultAgents
  
  const agentColors: Record<string, string> = {
    taizi: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    zhongshu: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
    shangshu: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    bingbu: 'from-red-500/20 to-red-600/20 border-red-500/30',
    gongbu: 'from-green-500/20 to-green-600/20 border-green-500/30',
    hubu: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    xingbu: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
    libu: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    menxia: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full overflow-y-auto px-8 py-4 pb-20"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Agent 列表 ({displayAgents.length})</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayAgents.map((agent: any) => (
          <div
            key={agent.id}
            className={`glass rounded-xl p-5 border ${agentColors[agent.id] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{agent.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{agent.label}</h3>
                  <p className="text-xs text-white/40">{agent.role}</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                空闲
              </span>
            </div>
            
            <div className="mb-4">
              <label className="text-xs text-white/40">模型</label>
              <p className="text-sm text-cyan-400">{agent.model}</p>
            </div>
            
            <div className="mb-4">
              <label className="text-xs text-white/40">技能</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {(agent.skills?.length ?? 0) > 0 ? agent.skills.slice(0, 3).map((skill: any, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-white/10 rounded text-white/70">
                    {skill.name}
                  </span>
                )) : <span className="text-xs text-white/30">无</span>}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => wakeAgent(agent.id)}
                className="flex-1 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/30 text-sm transition-all"
              >
                唤醒
              </button>
              <button 
                onClick={() => ui.setSelectedAgent(agent)}
                className="flex-1 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 text-sm transition-all"
              >
                详情
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// 任务视图
function TasksView() {
  const [taskInput, setTaskInput] = useState('')
  const { executeTask, loading } = useStore()
  const [result, setResult] = useState<any>(null)
  
  const handleSubmit = async () => {
    if (!taskInput.trim()) return
    const res = await executeTask(taskInput)
    setResult(res)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full overflow-y-auto px-8 py-4"
    >
      <h2 className="text-2xl font-bold text-white mb-6">任务执行</h2>
      
      {/* 任务输入 */}
      <div className="glass rounded-xl p-6 mb-6">
        <label className="text-sm text-white/60 mb-2 block">输入任务描述</label>
        <textarea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          placeholder="例如：帮我写一个用户登录功能..."
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={loading || !taskInput.trim()}
            className="px-6 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 transition-all"
          >
            {loading ? '执行中...' : '开始执行'}
          </button>
        </div>
      </div>
      
      {/* 预设任务 */}
      <div className="mb-6">
        <h3 className="text-sm text-white/40 mb-3">快速任务</h3>
        <div className="flex flex-wrap gap-2">
          {[
            '开发一个登录页面',
            '写一个天气API',
            '创建数据库表结构',
            '写单元测试',
            '部署到服务器'
          ].map((task) => (
            <button
              key={task}
              onClick={() => setTaskInput(task)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              {task}
            </button>
          ))}
        </div>
      </div>
      
      {/* 结果展示 */}
      {result && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg text-white mb-4">执行结果</h3>
          <pre className="text-sm text-white/70 whitespace-pre-wrap overflow-auto max-h-[500px]">
            {result.summary || result.error || JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </motion.div>
  )
}

// 设置视图
function SettingsView() {
  const [activeTab, setActiveTab] = useState('display')
  
  const settingTabs = [
    { key: 'image', label: '图片识别', icon: '🖼️' },
    { key: 'extensions', label: '扩展工具', icon: '🔌' },
    { key: 'display', label: '显示设置', icon: '🎨' },
    { key: 'gateway', label: 'Gateway', icon: '🌐' },
    { key: 'services', label: '服务管理', icon: '⚙️' },
    { key: 'channels', label: '消息渠道', icon: '💬' },
    { key: 'logviewer', label: '日志查看', icon: '📜' },
    { key: 'memory', label: '记忆管理', icon: '🧠' },
  ]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full overflow-y-auto px-8 py-4"
    >
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-xl font-bold text-white">⚙️ 系统设置</h2>
        
        {/* 下拉菜单 */}
        <div className="relative inline-block">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="appearance-none bg-gradient-to-r from-indigo-950 via-purple-950 to-cyan-950 border border-white/20 rounded-lg px-4 py-2 pr-10 text-white text-sm font-medium cursor-pointer hover:border-cyan-500/50 focus:outline-none focus:border-cyan-500/50 transition-all shadow-lg min-w-[160px]"
          >
            {settingTabs.map(tab => (
              <option key={tab.key} value={tab.key} className="bg-gray-900 py-2">
                {tab.icon} {tab.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/60 text-sm">
            ▼
          </div>
        </div>
      </div>
      
      <div className="max-w-3xl space-y-6">
          {activeTab === 'gateway' && (
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg text-white mb-4">🌐 Gateway 配置</h3>
              <div className="space-y-4">
                <div><label className="text-sm text-white/60">Gateway 地址</label><input type="text" defaultValue="http://localhost:18789" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50" /></div>
                <div><label className="text-sm text-white/60">访问 Token</label><input type="password" defaultValue="" placeholder="可选" className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50" /></div>
                <button className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30">保存</button>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg text-white mb-4">🎨 显示设置</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between"><span className="text-white/60">自动旋转</span><input type="checkbox" defaultChecked className="w-5 h-5 accent-cyan-500" /></label>
                <label className="flex items-center justify-between"><span className="text-white/60">显示粒子</span><input type="checkbox" defaultChecked className="w-5 h-5 accent-cyan-500" /></label>
                <label className="flex items-center justify-between"><span className="text-white/60">显示网格</span><input type="checkbox" defaultChecked className="w-5 h-5 accent-cyan-500" /></label>
              </div>
            </div>
          )}

          {activeTab === 'services' && <ServiceManagerView />}
          {activeTab === 'image' && <ImageRecognitionView />}
          {activeTab === 'extensions' && <ExtensionsView />}
          {activeTab === 'channels' && <ChannelsView />}
          {activeTab === 'logviewer' && <LogViewerView />}
          {activeTab === 'memory' && <MemoryView />}
      </div>
    </motion.div>
  )
}

// Agent 详情面板
function AgentPanel({ 
  agent, 
  onClose, 
  onWake 
}: { 
  agent: any
  onClose: () => void
  onWake: () => void
}) {
  const { ui } = useStore()
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="absolute right-0 top-0 bottom-0 w-96 glass p-6 pointer-events-auto overflow-y-auto"
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white/40 hover:text-white text-xl"
      >
        ✕
      </button>
      
      <div className="mt-8">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-5xl">{agent.emoji}</span>
          <div>
            <h2 className="text-2xl font-bold text-white">{agent.label}</h2>
            <p className="text-white/60">{agent.role}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="text-xs text-white/40">当前模型</label>
          <p className="text-cyan-400">{agent.model || 'minimax-portal/MiniMax-M2.5'}</p>
        </div>
        
        <div className="mb-6">
          <label className="text-xs text-white/40">技能</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {(agent.skills?.length ?? 0) > 0 ? agent.skills.map((skill: any, i: number) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm"
              >
                {skill.name}
              </span>
            )) : <span className="text-white/40">无</span>}
          </div>
        </div>
        
        {/* 唤醒按钮 - 跳转会话页面 */}
        <div className="flex gap-3">
          <button
            onClick={onWake}
            className="flex-1 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all"
          >
            唤醒 Agent
          </button>
          <button
            onClick={() => {
              // 先设置当前 agent 为全局选中状态
              console.log('=== 进入会话 clicked === agent:', agent.id)
              const { ui } = useStore.getState()
              ui.setSelectedAgent(agent)
              console.log('=== setSelectedAgent done === ui.selectedAgent:', ui.selectedAgent?.id)
              onClose()
              // 跳转到会话页面
              ui.setActiveView('messages')
            }}
            className="flex-1 py-3 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 transition-all"
          >
            进入会话
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Netflix Style Animated Logo Component - Exact Replica
function NetflixLogo() {
  const letters = ['E', 'D', 'I', 'C', 'T']
  
  return (
    <div className="relative flex items-center justify-center"
      style={{
        ['--blind-speed' as string]: '3s',
        ['--blinds' as string]: '7',
        ['--logo-background' as string]: '#8b5cf6',
        ['--size' as string]: '32px'
      }}
    >
      {/* White Container */}
      <div 
        className="flex flex-col items-center rounded-sm overflow-hidden"
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          padding: 'calc(0.07 * var(--size))'
        }}
      >
        {/* Logo Wrapper - Purple Background */}
        <div 
          className="flex items-center justify-center"
          style={{
            background: 'var(--logo-background)',
            padding: 'calc(0.1 * var(--size)) 0 calc(0.06 * var(--size))'
          }}
        >
          {/* Logo - Ribbon N style E */}
          <div 
            className="relative flex items-center justify-center"
            style={{
              width: '36px',
              height: 'calc(0.95 * var(--size))'
            }}
          >
            {/* E Letter SVG - Ribbon Style */}
            <svg 
              viewBox="0 0 100 130" 
              preserveAspectRatio="none"
              className="h-full w-auto"
              style={{ color: 'white' }}
            >
              {/* E 字母 - 三条横杠 + 左边竖条 */}
              <polygon points="20,10 40,10 40,120 20,120" fill="currentColor" />
              <polygon points="20,10 90,10 80,25 20,25" fill="currentColor" />
              <polygon points="20,55 80,55 70,75 20,75" fill="currentColor" />
              <polygon points="20,100 90,100 80,120 20,120" fill="currentColor" />
            </svg>
            
            {/* Sliders for blinds effect */}
            <div className="absolute inset-0"
            >
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full"
                  style={{
                    height: 0,
                    bottom: 0,
                    background: 'var(--logo-background)',
                    animation: `slider var(--blind-speed) infinite linear`,
                    animationDelay: `calc(var(--blind-speed) / var(--blinds) * ${-i})`,
                    opacity: 0
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* EDICT Text - Individual Letters */}
        <div 
          className="flex justify-center"
          style={{
            fontFamily: "'Anybody', sans-serif",
            fontWeight: 700,
            fontSize: 'calc(0.32 * var(--size))',
            lineHeight: 1,
            paddingTop: 'calc(0.05 * var(--size))',
            color: '#fff',
            letterSpacing: '0.1em',
            width: 'calc(1.7 * var(--size))'
          }}
        >
          {letters.map((letter, i) => (
            <div 
              key={i}
              style={{
                margin: '0 calc(-0.005 * var(--size))'
              }}
            >
              {letter}
            </div>
          ))}
        </div>
      </div>
      
      {/* CSS Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slider {
          0% {
            height: 0;
            bottom: 0;
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            height: calc(0.04 * var(--size));
            bottom: 100%;
          }
        }
      `}} />
    </div>
  )
}

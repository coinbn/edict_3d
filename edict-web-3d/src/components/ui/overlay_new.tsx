import { useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { motion, AnimatePresence } from 'framer-motion'
import EdictDashboard from './EdictDashboard'
import MonitorView from './MonitorView'
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

export default function Overlay() {
  const { agents, ui, fetchAgents, wakeAgent, syncAgents, loading } = useStore()
  
  // 加载时获取数据
  useEffect(() => {
    fetchAgents()
  }, [])
  
  // 标签页配置
  const tabs = [
    { key: 'home', label: '首页', icon: '🏠' },
    { key: 'edict', label: '仪表板', icon: '🎛️' },
    { key: 'morning', label: '早报', icon: '📰' },
    { key: 'monitor', label: '监控', icon: '📊' },
    { key: 'messages', label: '会话', icon: '💬' },
    { key: 'agents', label: 'Agent', icon: '🤖' },
    { key: 'skills', label: '技能', icon: '⚙️' },
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
          {ui.activeView === 'morning' && <MorningView key="morning" />}
          {ui.activeView === 'monitor' && <MonitorView key="monitor" />}
          {ui.activeView === 'messages' && <AgentCollabView key="messages" />}
          {ui.activeView === 'agents' && <AgentsView key="agents" />}
          {ui.activeView === 'sessions' && <SessionsView key="sessions" />}
          {ui.activeView === 'tasks' && <TasksView key="tasks" />}
          {ui.activeView === 'skills' && <SkillsView key="skills" />}
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex items-center justify-center"
    >
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">欢迎使用 Edict</h2>
        <p className="text-white/60">选择上方菜单开始使用</p>
      </div>
    </motion.div>
  )
}

// Agents 视图
function AgentsView() {
  const { agents, fetchAgents } = useStore()
  
  useEffect(() => {
    fetchAgents()
  }, [])
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto px-8 py-4"
    >
      <h2 className="text-2xl font-bold text-white mb-6">🤖 Agent 管理</h2>
      <div className="grid grid-cols-3 gap-4">
        {agents.length === 0 ? (
          <p className="text-white/40">暂无 Agent</p>
        ) : (
          agents.map(agent => (
            <div key={agent.id} className="glass rounded-xl p-4">
              <div className="text-2xl mb-2">{agent.emoji}</div>
              <div className="text-white font-bold">{agent.label}</div>
              <div className="text-white/40 text-sm">{agent.role}</div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

// Tasks 视图
function TasksView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto px-8 py-4"
    >
      <h2 className="text-2xl font-bold text-white mb-6">📋 任务看板</h2>
      <p className="text-white/40">任务功能开发中...</p>
    </motion.div>
  )
}

// 设置视图
function SettingsView() {
  const { fetchAgents, syncAgents, loading, setApiBase } = useStore()
  const [apiInput, setApiInput] = useState('http://localhost:8080/api')
  const [activeTab, setActiveTab] = useState('api')
  
  // 子菜单配置
  const settingTabs = [
    { key: 'api', label: 'API配置', icon: '🔗' },
    { key: 'display', label: '显示设置', icon: '🎨' },
    { key: 'gateway', label: 'Gateway', icon: '🌐' },
    { key: 'services', label: '服务管理', icon: '⚙️' },
    { key: 'channels', label: '消息渠道', icon: '💬' },
    { key: 'logviewer', label: '日志查看', icon: '📜' },
    { key: 'memory', label: '记忆管理', icon: '🧠' },
  ]
  
  const handleSync = async () => {
    await syncAgents()
    await fetchAgents()
  }
  
  const handleApiSave = () => {
    setApiBase(apiInput)
    fetchAgents()
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full overflow-y-auto px-8 py-4"
    >
      <h2 className="text-2xl font-bold text-white mb-4">⚙️ 系统设置</h2>
      
      {/* 下拉菜单 */}
      <div className="relative inline-block mb-6">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="appearance-none bg-gradient-to-r from-indigo-950 via-purple-950 to-cyan-950 border border-white/20 rounded-xl px-6 py-3 pr-12 text-white font-medium cursor-pointer hover:border-cyan-500/50 focus:outline-none focus:border-cyan-500/50 transition-all shadow-lg"
        >
          {settingTabs.map(tab => (
            <option key={tab.key} value={tab.key} className="bg-gray-900">
              {tab.icon} {tab.label}
            </option>
          ))}
        </select>
        {/* 自定义下拉箭头 */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
          ▼
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="max-w-3xl space-y-6">
        {/* API 配置 */}
        {activeTab === 'api' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">🔗 API 配置</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60">API 地址</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={apiInput}
                    onChange={(e) => setApiInput(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    onClick={handleApiSave}
                    className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
                  >
                    保存
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleSync}
                  disabled={loading}
                  className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 disabled:opacity-50"
                >
                  {loading ? '同步中...' : '🔄 同步 Agent'}
                </button>
                <button
                  onClick={() => fetchAgents()}
                  disabled={loading}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white/60 rounded-lg hover:bg-white/20"
                >
                  刷新
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gateway 配置 */}
        {activeTab === 'gateway' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">🌐 Gateway 配置</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60">Gateway 地址</label>
                <input
                  type="text"
                  defaultValue="http://localhost:18789"
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-white/60">访问 Token</label>
                <input
                  type="password"
                  defaultValue=""
                  placeholder="可选"
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <button className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30">
                保存
              </button>
            </div>
          </div>
        )}

        {/* 显示设置 */}
        {activeTab === 'display' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg text-white mb-4">🎨 显示设置</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span className="text-white/60">自动旋转</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-cyan-500" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/60">显示粒子</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-cyan-500" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/60">显示网格</span>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-cyan-500" />
              </label>
            </div>
          </div>
        )}

        {/* 服务管理 */}
        {activeTab === 'services' && (
          <ServiceManagerView />
        )}

        {/* 消息渠道 */}
        {activeTab === 'channels' && (
          <ChannelsView />
        )}

        {/* 日志查看 */}
        {activeTab === 'logviewer' && (
          <LogViewerView />
        )}

        {/* 记忆管理 */}
        {activeTab === 'memory' && (
          <MemoryView />
        )}
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
            <h3 className="text-xl font-bold text-white">{agent.label}</h3>
            <p className="text-white/40 text-sm">{agent.role}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="glass rounded-lg p-4">
            <div className="text-white/40 text-sm">状态</div>
            <div className="text-white">{agent.status || 'idle'}</div>
          </div>
          
          <div className="glass rounded-lg p-4">
            <div className="text-white/40 text-sm">模型</div>
            <div className="text-white">{agent.model}</div>
          </div>
          
          <button
            onClick={onWake}
            className="w-full py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
          >
            启动 Agent
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Netflix Logo 组件
function NetflixLogo() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">🎬</span>
      <span className="text-xl font-bold text-white">Edict</span>
    </div>
  )
}

/* CSS Keyframes */
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


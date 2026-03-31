import { useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { motion } from 'framer-motion'

export default function MonitorView() {
  const { agents, fetchAgents, wakeAgent, loading } = useStore()
  
  useEffect(() => {
    fetchAgents()
  }, [])
  
  // 默认 Agent 数据
  const defaultAgents = [
    { id: 'taizi', label: '太子', emoji: '👑', role: '东宫太子', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
    { id: 'zhongshu', label: '中书省', emoji: '✍️', role: '中书令', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
    { id: 'shangshu', label: '尚书省', emoji: '👑', role: '尚书令', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
    { id: 'bingbu', label: '兵部', emoji: '⚔️', role: '兵部尚书', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
    { id: 'gongbu', label: '工部', emoji: '🔧', role: '工部尚书', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
    { id: 'hubu', label: '户部', emoji: '💰', role: '户部尚书', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
    { id: 'xingbu', label: '刑部', emoji: '⚖️', role: '刑部尚书', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
    { id: 'libu', label: '礼部', emoji: '📜', role: '礼部尚书', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
    { id: 'menxia', label: '门下省', emoji: '👁️', role: '侍中', model: 'MiniMax-M2.5', status: 'idle', tokens_in: 0, tokens_out: 0, sessions: 0, messages: 0 },
  ]
  
  const displayAgents = agents.length > 0 ? agents : defaultAgents
  
  // 统计
  const stats = {
    total: displayAgents.length,
    running: displayAgents.filter((a: any) => a.status === 'running').length,
    idle: displayAgents.filter((a: any) => a.status === 'idle').length,
    totalTokens: displayAgents.reduce((sum: number, a: any) => sum + (a.tokens_in || 0) + (a.tokens_out || 0), 0),
  }
  
  // Agent 颜色映射
  const agentColors: Record<string, string> = {
    taizi: '#ffd700',
    zhongshu: '#00d4ff',
    shangshu: '#ffd93d',
    bingbu: '#ff6b6b',
    gongbu: '#6bcb77',
    hubu: '#4d96ff',
    xingbu: '#ff85c0',
    libu: '#a855f7',
    menxia: '#00ffcc',
  }
  
  // 状态颜色 - 统一使用与 EdictDashboard 相同的配色
  const statusColors: Record<string, { bg: string, text: string, label: string, dot: string }> = {
    running: { bg: 'bg-green-500/20', text: 'text-green-400', label: '运行中', dot: '#22c55e' },
    idle: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '空闲', dot: '#3b82f6' },
    offline: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '离线', dot: '#6b7280' },
  }
  
  // 获取统一的状态显示
  const getStatusDisplay = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'idle'
    return statusColors[normalizedStatus] || statusColors.idle
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto"
    >
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Agent 监控</h2>
        <p className="text-white/40 text-sm">实时监控所有 Agent 状态</p>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4">
          <div className="text-white/40 text-sm mb-1">Agent 总数</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-white/40 text-sm mb-1">运行中</div>
          <div className="text-3xl font-bold text-green-400">{stats.running}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-white/40 text-sm mb-1">空闲</div>
          <div className="text-3xl font-bold text-gray-400">{stats.idle}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-white/40 text-sm mb-1">Token 消耗</div>
          <div className="text-3xl font-bold text-cyan-400">{stats.totalTokens.toLocaleString()}</div>
        </div>
      </div>
      
      {/* Agent 列表 */}
      <div className="space-y-4">
        {displayAgents.map((agent: any) => {
          const color = agentColors[agent.id] || '#00d4ff'
          const status = getStatusDisplay(agent.status)
          
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                {/* 左侧：Agent 信息 */}
                <div className="flex items-center gap-4">
                  {/* 状态指示灯 */}
                  <div className="relative">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: status.dot,
                        boxShadow: `0 0 10px ${status.dot}`,
                        animation: agent.status === 'running' ? 'pulse 2s infinite' : 'none'
                      }}
                    />
                    {agent.status === 'running' && (
                      <div 
                        className="absolute inset-0 rounded-full animate-ping opacity-75"
                        style={{ backgroundColor: status.dot }}
                      />
                    )}
                  </div>
                  
                  {/* Emoji 和名称 */}
                  <div className="text-3xl">{agent.emoji}</div>
                  <div>
                    <div className="text-white font-medium">{agent.label}</div>
                    <div className="text-white/40 text-sm">{agent.role}</div>
                  </div>
                </div>
                
                {/* 中间：状态和模型 */}
                <div className="flex items-center gap-8">
                  <div className={`px-3 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
                    {status.label}
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-xs">模型</div>
                    <div className="text-cyan-400 text-sm">{agent.model || 'MiniMax-M2.5'}</div>
                  </div>
                </div>
                
                {/* 右侧：统计数据 */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-white/40 text-xs">会话</div>
                    <div className="text-white">{agent.sessions || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-xs">消息</div>
                    <div className="text-white">{agent.messages || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-xs">输入 Token</div>
                    <div className="text-white">{(agent.tokens_in || 0).toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-xs">输出 Token</div>
                    <div className="text-white">{(agent.tokens_out || 0).toLocaleString()}</div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <button
                    onClick={() => wakeAgent(agent.id)}
                    disabled={loading || agent.status === 'running'}
                    className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {agent.status === 'running' ? '运行中' : '唤醒'}
                  </button>
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="mt-4">
                {(() => {
                  const usage = Math.min(100, Math.round(((agent.tokens_in || 0) + (agent.tokens_out || 0) / 10000) * 100))
                  return (
                    <>
                      <div className="flex justify-between text-xs text-white/40 mb-1">
                        <span>资源使用率</span>
                        <span>{usage}%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${usage}%`,
                            backgroundColor: color 
                          }}
                        />
                      </div>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {/* 刷新按钮 */}
      <div className="fixed bottom-20 right-6">
        <button
          onClick={() => fetchAgents()}
          className="p-3 glass rounded-full hover:bg-white/10 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.582 0a8.002 8.002 0 011.582 8.007m0 0c2.335 0 4.247.806 5.652 2.193M4 20h.582m0 0a8.002 8.002 0 001.582-8.007m0 0A8.002 8.002 0 014 12.418m0 0L4 4m15.582 0a8.002 8.002 0 011.582 8.007m0 0c2.335 0 4.247.806 5.652 2.193" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

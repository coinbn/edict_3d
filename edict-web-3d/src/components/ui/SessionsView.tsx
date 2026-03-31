import { useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { motion } from 'framer-motion'

export default function SessionsView() {
  const { agents, fetchAgents, loading } = useStore()
  
  useEffect(() => {
    fetchAgents()
  }, [])
  
  // 使用后端真实统计字段
  const sessions = agents.length > 0 ? agents.map((a: any) => ({
    agentId: a.id,
    agentLabel: a.label,
    emoji: a.emoji,
    messages: a.messages ?? 0,
    sessionCount: a.sessions ?? 0,
    lastActive: a.lastActive || null,
    status: a.status || 'idle'
  })) : []
  
  const totalMessages = sessions.reduce((sum: number, s: any) => sum + s.messages, 0)
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto px-6 py-4"
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">会话管理</h2>
          <p className="text-white/40 text-sm">Agent 会话统计</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-white/60">总会话:</span>
            <span className="text-white ml-2">{sessions.reduce((sum: number, s: any) => sum + s.sessionCount, 0)}</span>
          </div>
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-white/60">总消息:</span>
            <span className="text-cyan-400 ml-2">{totalMessages}</span>
          </div>
        </div>
      </div>
      
      {/* 会话列表 */}
      <div className="space-y-4">
        {sessions.map((session: any, idx: number) => (
          <motion.div
            key={session.agentId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              {/* Agent 信息 */}
              <div className="flex items-center gap-4">
                <div className="text-3xl">{session.emoji}</div>
                <div>
                  <div className="text-white font-medium">{session.agentLabel}</div>
                  <div className="text-white/40 text-sm">ID: {session.agentId}</div>
                </div>
              </div>
              
              {/* 统计 */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-white/40 text-xs">会话数</div>
                  <div className="text-xl text-white">{session.sessionCount}</div>
                </div>
                <div className="text-center">
                  <div className="text-white/40 text-xs">消息数</div>
                  <div className="text-xl text-white">{session.messages}</div>
                </div>
                <div className="text-center">
                  <div className="text-white/40 text-xs">最后活跃</div>
                  <div className="text-sm text-white/60">
                    {session.lastActive ? new Date(session.lastActive).toLocaleString('zh-CN') : '-'}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${
                  session.status === 'running' 
                    ? 'bg-green-500/20 text-green-400'
                    : session.status === 'offline'
                    ? 'bg-gray-500/20 text-gray-500'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {session.status || 'idle'}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {sessions.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-white/40">暂无会话数据</p>
        </div>
      )}
    </motion.div>
  )
}

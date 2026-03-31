import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function UsageStatsView() {
  const [stats, setStats] = useState<any>({
    activeSessions: 0,
    activeAgents: 0,
    agents: [],
    sessions: [],
  })
  const [loading, setLoading] = useState(false)

  const getApiBase = () => {
    return localStorage.getItem('apiBase') || 'http://localhost:8080/api'
  }

  // 获取统计数据（从数据库读取）
  const fetchStats = async () => {
    setLoading(true)
    try {
      const apiBase = getApiBase()
      const response = await fetch(`${apiBase}/agents-status`)
      if (response.ok) {
        const data = await response.json()
        
        const agentList = data.agents || []
        
        // 活跃 Agent（在线的）
        const runningAgents = agentList.filter((a: any) => a.status === 'running').length
        
        // 总会话数（所有 Agent 的 sessions 总和）
        const totalSessions = agentList.reduce((sum: number, a: any) => sum + (a.sessions || 0), 0)
        
        // 创建会话列表 - 将每个 Agent 视为一个"活跃会话"
        const sessions = agentList.map((a: any) => ({
          id: a.id,
          agent: a.label,
          emoji: a.emoji,
          channel: a.channel || 'Web',
          status: a.status,
          startTime: a.lastActive ? new Date(a.lastActive).toLocaleString('zh-CN') : '未知',
          messages: a.messages || 0,
        }))
        
        setStats({
          activeSessions: totalSessions,
          activeAgents: runningAgents,
          agents: agentList.map((a: any) => ({
            id: a.id,
            name: a.label,
            emoji: a.emoji,
            status: a.status,
            lastActive: a.lastActive ? new Date(a.lastActive).toLocaleString('zh-CN') : '未知',
            sessions: a.sessions || 0,
            model: a.model,
          })),
          sessions,
        })
      }
    } catch (error) {
      console.error('Fetch stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 同步并刷新数据（先同步 OpenClaw 到数据库，再读取）
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const apiBase = getApiBase()
      
      // 1. 先同步 OpenClaw 数据到数据库
      const syncRes = await fetch(`${apiBase}/sync-sessions`, { method: 'POST' })
      const syncData = await syncRes.json()
      console.log('同步结果:', syncData)
      
      // 2. 再从数据库读取最新数据
      await fetchStats()
    } catch (error) {
      console.error('Refresh error:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    // 初始从数据库加载数据
    fetchStats()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">📈 统计</h3>
          <p className="text-white/40 text-sm">Agent 运行状态统计</p>
        </div>
        <button onClick={handleRefresh} disabled={loading} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          {loading ? '加载中...' : '🔄 刷新'}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-white/40">
          <span className="animate-pulse">加载中...</span>
        </div>
      ) : (
        <>
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass rounded-xl p-6">
              <div className="text-white/40 text-sm mb-1">总会话数</div>
              <div className="text-3xl font-bold text-cyan-400">{stats.activeSessions}</div>
              <div className="text-white/40 text-sm mt-2">历史累计</div>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="text-white/40 text-sm mb-1">在线 Agent</div>
              <div className="text-3xl font-bold text-purple-400">{stats.activeAgents}</div>
              <div className="text-white/40 text-sm mt-2">/ {stats.agents.length}</div>
            </div>
          </div>

          {/* 活跃会话列表 */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">💬 活跃会话</h4>
              <span className="text-sm text-white/40">{stats.sessions.length} 个会话</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/40 text-sm border-b border-white/10">
                    <th className="pb-3 font-medium">Agent</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">消息数</th>
                    <th className="pb-3 font-medium text-right">最后活跃</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sessions?.length > 0 ? (
                    stats.sessions.map((session: any) => (
                      <tr key={session.id} className="border-b border-white/5 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span>{session.emoji}</span>
                            <span className="text-white">{session.agent}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            session.status === 'running' 
                              ? 'bg-green-500/20 text-green-400' 
                              : session.status === 'offline'
                              ? 'bg-gray-500/20 text-gray-500'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {session.status || 'idle'}
                          </span>
                        </td>
                        <td className="py-3 text-white/60">{session.messages}</td>
                        <td className="py-3 text-right text-white/40 text-sm">{session.startTime}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-white/40">
                        暂无活跃会话数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../stores/useStore'
import { motion } from 'framer-motion'

// 日志源配置
const LOG_SOURCES = [
  { key: 'gateway', label: 'Gateway 日志', path: '/logs/gateway.log', icon: '🌐' },
  { key: 'agent', label: 'Agent 日志', path: '/logs/agent.log', icon: '🤖' },
  { key: 'system', label: '系统日志', path: '/logs/system.log', icon: '⚙️' },
  { key: 'error', label: '错误日志', path: '/logs/error.log', icon: '🚨' },
]

// 日志级别颜色
const logLevelColors: Record<string, string> = {
  ERROR: 'text-red-400',
  WARN: 'text-yellow-400',
  INFO: 'text-blue-400',
  DEBUG: 'text-gray-400',
  SUCCESS: 'text-green-400',
}

export default function LogViewerView() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSource, setSelectedSource] = useState('gateway')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const logContainerRef = useRef<HTMLDivElement>(null)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Gateway API 基础地址
  const getGatewayApiBase = () => {
    return localStorage.getItem('gatewayBase') || 'http://localhost:18789'
  }

  // 获取日志
  const fetchLogs = async () => {
    setLoading(true)
    try {
      const gatewayBase = getGatewayApiBase()
      
      // 尝试从 Gateway API 获取日志
      const response = await fetch(`${gatewayBase}/api/logs?source=${selectedSource}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      } else {
        // 如果 API 不可用，使用模拟数据
        setLogs(generateMockLogs(selectedSource))
      }
    } catch (error) {
      console.error('Fetch logs error:', error)
      // 使用模拟数据
      setLogs(generateMockLogs(selectedSource))
    } finally {
      setLoading(false)
    }
  }

  // 生成模拟日志（API 不可用时）
  const generateMockLogs = (source: string): any[] => {
    const now = new Date()
    const levels = ['ERROR', 'WARN', 'INFO', 'DEBUG']
    const messages: Record<string, string[]> = {
      gateway: [
        '[Gateway] Starting OpenClaw Gateway on port 18789',
        '[Gateway] WebSocket server initialized',
        '[Gateway] Agent registry loaded: 9 agents',
        '[Gateway] New session spawned: taizi',
        '[Gateway] Message processed in 123ms',
      ],
      agent: [
        '[Agent:taizi] Handling user message',
        '[Agent:zhongshu] Planning task execution',
        '[Agent:bingbu] Executing code task',
        '[Agent:zaochao] Generating morning brief',
      ],
      system: [
        '[System] Memory usage: 512MB / 2048MB',
        '[System] CPU usage: 23%',
        '[System] Active connections: 5',
        '[System] Scheduled task executed: morning-brief',
      ],
      error: [
        '[Error] Failed to connect to OpenAI API',
        '[Error] Timeout: Gateway response > 30s',
      ],
    }
    
    return Array.from({ length: 20 }, (_, i) => {
      const level = levels[Math.floor(Math.random() * levels.length)]
      const sourceMsgs = messages[source] || messages.gateway
      const msg = sourceMsgs[Math.floor(Math.random() * sourceMsgs.length)]
      const time = new Date(now.getTime() - (20 - i) * 60000)
      
      return {
        id: `log-${i}`,
        timestamp: time.toISOString(),
        level,
        message: msg,
        source,
      }
    })
  }

  // 初始化
  useEffect(() => {
    fetchLogs()
    
    // 自动刷新
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchLogs, 5000)
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [selectedSource, autoRefresh])

  // 过滤日志
  const filteredLogs = logs.filter(log => {
    const matchKeyword = !searchKeyword || 
      log.message?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.level?.toLowerCase().includes(searchKeyword.toLowerCase())
    const matchLevel = levelFilter === 'all' || log.level === levelFilter
    return matchKeyword && matchLevel
  })

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour12: false })
  }

  // 复制日志
  const copyLogs = () => {
    const text = filteredLogs.map(log => 
      `[${formatTime(log.timestamp)}] [${log.level}] ${log.message}`
    ).join('\n')
    navigator.clipboard.writeText(text)
  }

  // 导出日志
  const exportLogs = () => {
    const text = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level}] ${log.message}`
    ).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedSource}-logs-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* 标题 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">📜 日志查看</h2>
          <p className="text-white/40 text-sm">实时查看系统日志，支持搜索和过滤</p>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center gap-2"
          >
            🔄 刷新
          </button>
          <button
            onClick={copyLogs}
            className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          >
            📋 复制
          </button>
          <button
            onClick={exportLogs}
            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            💾 导出
          </button>
        </div>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {/* 日志源选择 */}
        <div className="flex gap-2">
          {LOG_SOURCES.map(source => (
            <button
              key={source.key}
              onClick={() => setSelectedSource(source.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedSource === source.key
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {source.icon} {source.label}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="搜索日志内容..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* 级别过滤 */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none"
        >
          <option value="all">全部级别</option>
          <option value="ERROR">ERROR</option>
          <option value="WARN">WARN</option>
          <option value="INFO">INFO</option>
          <option value="DEBUG">DEBUG</option>
        </select>

        {/* 自动刷新开关 */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4 rounded bg-white/10 border-white/20"
          />
          <span className="text-white/60 text-sm">自动刷新</span>
        </label>
      </div>

      {/* 日志列表 */}
      <div 
        ref={logContainerRef}
        className="flex-1 bg-black/30 rounded-xl border border-white/10 overflow-auto font-mono text-sm"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/40">
            <span className="animate-pulse">加载中...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40">
            暂无日志
          </div>
        ) : (
          <div className="p-2">
            {filteredLogs.map((log, index) => (
              <div
                key={log.id || index}
                className="px-3 py-1.5 hover:bg-white/5 flex items-start gap-3 border-b border-white/5"
              >
                {/* 时间 */}
                <span className="text-white/30 text-xs whitespace-nowrap">
                  {formatTime(log.timestamp)}
                </span>
                
                {/* 级别 */}
                <span className={`text-xs font-bold whitespace-nowrap w-16 ${
                  logLevelColors[log.level] || 'text-white/40'
                }`}>
                  [{log.level}]
                </span>
                
                {/* 消息 */}
                <span className="text-white/80 flex-1 break-all">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="mt-2 flex items-center justify-between text-sm text-white/40">
        <span>共 {filteredLogs.length} 条日志</span>
        <span>来源: {LOG_SOURCES.find(s => s.key === selectedSource)?.label}</span>
      </div>
    </motion.div>
  )
}

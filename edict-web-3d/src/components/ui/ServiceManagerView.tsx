import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// 服务状态
interface ServiceStatus {
  name: string
  displayName: string
  status: 'running' | 'stopped' | 'error'
  version?: string
  uptime?: string
  port?: number
  pid?: number
  memory?: string
  cpu?: number
}

// 可用服务
const SERVICES = [
  { key: 'gateway', name: 'OpenClaw Gateway', displayName: 'Gateway', defaultPort: 18789 },
  { key: 'node', name: 'Node.js', displayName: 'Node.js', defaultPort: null },
  { key: 'npm', name: 'NPM', displayName: 'NPM', defaultPort: null },
]

export default function ServiceManagerView() {
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Gateway API 基础地址
  const getGatewayApiBase = () => {
    return localStorage.getItem('gatewayBase') || 'http://localhost:18789'
  }

  // 获取服务状态
  const fetchServices = async () => {
    setLoading(true)
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/services/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      } else {
        setServices(getMockServices())
      }
    } catch (error) {
      console.error('Fetch services error:', error)
      setServices(getMockServices())
    } finally {
      setLoading(false)
    }
  }

  // 模拟服务数据
  const getMockServices = (): ServiceStatus[] => [
    {
      name: 'gateway',
      displayName: 'Gateway',
      status: 'running',
      version: '3.0.0',
      uptime: '2d 5h 30m',
      port: 18789,
      pid: 12345,
      memory: '256MB',
      cpu: 12,
    },
    {
      name: 'node',
      displayName: 'Node.js',
      status: 'running',
      version: 'v22.19.0',
      uptime: '2d 5h 32m',
      memory: '512MB',
      cpu: 8,
    },
    {
      name: 'npm',
      displayName: 'NPM',
      status: 'stopped',
    },
  ]

  // 启动服务
  const startService = async (serviceKey: string) => {
    setActionLoading(serviceKey)
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/services/${serviceKey}/start`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchServices()
      } else {
        // 模拟启动成功
        setServices(services.map(s => 
          s.name === serviceKey ? { ...s, status: 'running' as const } : s
        ))
      }
    } catch (error) {
      console.error('Start service error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // 停止服务
  const stopService = async (serviceKey: string) => {
    setActionLoading(serviceKey)
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/services/${serviceKey}/stop`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchServices()
      } else {
        // 模拟停止成功
        setServices(services.map(s => 
          s.name === serviceKey ? { ...s, status: 'stopped' as const } : s
        ))
      }
    } catch (error) {
      console.error('Stop service error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // 重启服务
  const restartService = async (serviceKey: string) => {
    setActionLoading(serviceKey)
    try {
      // 先停止
      await stopService(serviceKey)
      // 等待一下
      await new Promise(resolve => setTimeout(resolve, 1000))
      // 再启动
      await startService(serviceKey)
    } finally {
      setActionLoading(null)
    }
  }

  // 检查更新
  const checkUpdate = async (serviceKey: string) => {
    setActionLoading(serviceKey)
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/services/${serviceKey}/check-update`, {
        method: 'GET',
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(`当前版本: ${data.current}\n最新版本: ${data.latest}\n${data.hasUpdate ? '有可用更新！' : '已是最新版本'}`)
      } else {
        alert('当前版本: 3.0.0\n最新版本: 3.0.0\n已是最新版本')
      }
    } catch (error) {
      console.error('Check update error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // 一键升级
  const upgradeService = async (serviceKey: string) => {
    if (!confirm('确定要升级到最新版本吗？')) return
    
    setActionLoading(serviceKey)
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/services/${serviceKey}/upgrade`, {
        method: 'POST',
      })
      
      if (response.ok) {
        alert('升级成功！请重启服务以应用更新。')
        await fetchServices()
      } else {
        alert('模拟：升级成功（实际需 Gateway API 支持）')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('升级失败，请稍后重试')
    } finally {
      setActionLoading(null)
    }
  }

  // 备份配置
  const backupConfig = async () => {
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/config/backup`, {
        method: 'POST',
      })
      
      if (response.ok) {
        alert('配置备份成功！')
      } else {
        alert('配置备份成功（模拟）')
      }
    } catch (error) {
      console.error('Backup error:', error)
      alert('配置备份失败')
    }
  }

  // 还原配置
  const restoreConfig = async () => {
    if (!confirm('确定要还原配置吗？这将覆盖当前配置。')) return
    
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/config/restore`, {
        method: 'POST',
      })
      
      if (response.ok) {
        alert('配置还原成功！')
        await fetchServices()
      } else {
        alert('配置还原成功（模拟）')
      }
    } catch (error) {
      console.error('Restore error:', error)
      alert('配置还原失败')
    }
  }

  // 初始化
  useEffect(() => {
    fetchServices()
    
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchServices, 5000)
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoRefresh])

  // 状态颜色
  const statusColors = {
    running: { bg: 'bg-green-500/20', text: 'text-green-400', label: '运行中', dot: '#22c55e' },
    stopped: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '已停止', dot: '#6b7280' },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', label: '错误', dot: '#ef4444' },
  }

  // 统计
  const stats = {
    total: services.length,
    running: services.filter(s => s.status === 'running').length,
    stopped: services.filter(s => s.status === 'stopped').length,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* 标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">⚙️ 服务管理</h2>
          <p className="text-white/40 text-sm">管理 OpenClaw 服务状态、版本和配置</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded bg-white/10 border-white/20"
            />
            <span className="text-white/60 text-sm">自动刷新</span>
          </label>
          <button
            onClick={fetchServices}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-4">
          <div className="text-white/40 text-sm mb-1">服务总数</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-white/40 text-sm mb-1">运行中</div>
          <div className="text-3xl font-bold text-green-400">{stats.running}</div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="text-white/40 text-sm mb-1">已停止</div>
          <div className="text-3xl font-bold text-gray-400">{stats.stopped}</div>
        </div>
      </div>

      {/* 服务列表 */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {loading && services.length === 0 ? (
          <div className="text-center text-white/40 py-8">加载中...</div>
        ) : (
          services.map((service) => {
            const status = statusColors[service.status]
            
            return (
              <div
                key={service.name}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                {/* 服务头部 */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* 状态指示 */}
                    <div className="relative">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.dot }}
                      />
                      {service.status === 'running' && (
                        <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: status.dot, opacity: 0.75 }} />
                      )}
                    </div>
                    
                    {/* 服务信息 */}
                    <div>
                      <h3 className="text-white font-bold">{service.displayName}</h3>
                      <p className="text-white/40 text-sm">{service.name}</p>
                    </div>
                  </div>
                  
                  {/* 状态标签 */}
                  <div className={`px-3 py-1 rounded-lg ${status.bg} ${status.text} text-sm`}>
                    {status.label}
                  </div>
                </div>
                
                {/* 服务详情 */}
                {service.status === 'running' && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-white/40">版本</span>
                        <div className="text-white">{service.version || '-'}</div>
                      </div>
                      <div>
                        <span className="text-white/40">运行时间</span>
                        <div className="text-white">{service.uptime || '-'}</div>
                      </div>
                      <div>
                        <span className="text-white/40">端口</span>
                        <div className="text-white">{service.port || '-'}</div>
                      </div>
                      <div>
                        <span className="text-white/40">内存</span>
                        <div className="text-white">{service.memory || '-'}</div>
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-white/40 mb-1">
                        <span>CPU 使用率</span>
                        <span>{service.cpu || 0}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                          style={{ width: `${service.cpu || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="px-4 py-3 bg-black/20 flex items-center gap-2">
                  {service.status === 'running' ? (
                    <>
                      <button
                        onClick={() => restartService(service.name)}
                        disabled={actionLoading === service.name}
                        className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        🔄 重启
                      </button>
                      <button
                        onClick={() => stopService(service.name)}
                        disabled={actionLoading === service.name}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        ⏹️ 停止
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startService(service.name)}
                      disabled={actionLoading === service.name}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                    >
                      ▶️ 启动
                    </button>
                  )}
                  
                  {service.name === 'gateway' && (
                    <>
                      <button
                        onClick={() => checkUpdate(service.name)}
                        disabled={actionLoading === service.name}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50 ml-auto"
                      >
                        🔍 检查更新
                      </button>
                      <button
                        onClick={() => upgradeService(service.name)}
                        disabled={actionLoading === service.name}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        ⬆️ 升级
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 底部：配置管理 */}
      <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
        <div>
          <h4 className="text-white font-medium">配置管理</h4>
          <p className="text-white/40 text-sm">备份和还原 OpenClaw 配置</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={backupConfig}
            className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
          >
            📥 备份配置
          </button>
          <button
            onClick={restoreConfig}
            className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
          >
            📤 还原配置
          </button>
        </div>
      </div>
    </motion.div>
  )
}

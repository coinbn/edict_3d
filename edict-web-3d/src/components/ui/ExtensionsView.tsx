import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// 扩展工具列表
const EXTENSIONS = [
  {
    id: 'cftunnel',
    name: 'cftunnel',
    label: 'Cloudflare Tunnel',
    icon: '🌐',
    description: '内网穿透工具，将本地服务暴露到公网',
    status: 'stopped',
    version: '2024.1.0',
    config: {
      tunnelToken: '',
      domain: '',
    }
  },
  {
    id: 'clawapp',
    name: 'clawapp',
    label: 'ClawApp',
    icon: '📱',
    description: '移动端状态监控客户端',
    status: 'stopped',
    version: '1.2.0',
    config: {
      deviceId: '',
      syncInterval: 30,
    }
  },
]

export default function ExtensionsView() {
  const [extensions, setExtensions] = useState(EXTENSIONS)
  const [loading, setLoading] = useState(false)
  const [selectedExt, setSelectedExt] = useState<typeof EXTENSIONS[0] | null>(null)

  // 获取扩展状态
  const fetchExtensions = async () => {
    setLoading(true)
    try {
      const gatewayBase = localStorage.getItem('gatewayBase') || 'http://localhost:18789'
      const response = await fetch(`${gatewayBase}/api/extensions`)
      if (response.ok) {
        const data = await response.json()
        setExtensions(data.extensions || EXTENSIONS)
      }
    } catch (error) {
      console.error('Fetch extensions error:', error)
      // 使用默认数据
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExtensions()
  }, [])

  // 启动/停止扩展
  const toggleExtension = async (extId: string) => {
    const ext = extensions.find(e => e.id === extId)
    if (!ext) return

    const newStatus = ext.status === 'running' ? 'stopped' : 'running'
    
    try {
      const gatewayBase = localStorage.getItem('gatewayBase') || 'http://localhost:18789'
      const action = newStatus === 'running' ? 'start' : 'stop'
      
      await fetch(`${gatewayBase}/api/extensions/${extId}/${action}`, {
        method: 'POST'
      })
      
      setExtensions(prev => prev.map(e => 
        e.id === extId ? { ...e, status: newStatus } : e
      ))
    } catch (error) {
      console.error('Toggle extension error:', error)
      // 模拟切换
      setExtensions(prev => prev.map(e => 
        e.id === extId ? { ...e, status: newStatus } : e
      ))
    }
  }

  // 保存配置
  const saveConfig = async (extId: string, config: any) => {
    try {
      const gatewayBase = localStorage.getItem('gatewayBase') || 'http://localhost:18789'
      await fetch(`${gatewayBase}/api/extensions/${extId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      setExtensions(prev => prev.map(e => 
        e.id === extId ? { ...e, config } : e
      ))
      setSelectedExt(null)
    } catch (error) {
      console.error('Save config error:', error)
      // 模拟保存
      setExtensions(prev => prev.map(e => 
        e.id === extId ? { ...e, config } : e
      ))
      setSelectedExt(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">🔌 扩展工具</h3>
          <p className="text-white/40 text-sm">管理和配置扩展组件</p>
        </div>
        <button
          onClick={fetchExtensions}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          🔄 刷新
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-white/40">
          <span className="animate-pulse">加载中...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {extensions.map((ext) => (
            <div key={ext.id} className="glass rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl">
                    {ext.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{ext.label}</h4>
                    <p className="text-white/40 text-sm">{ext.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-white/30">版本 {ext.version}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        ext.status === 'running'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {ext.status === 'running' ? '运行中' : '已停止'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedExt(ext)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    ⚙️ 配置
                  </button>
                  
                  <button
                    onClick={() => toggleExtension(ext.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      ext.status === 'running'
                        ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {ext.status === 'running' ? '⏹️ 停止' : '▶️ 启动'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* 安装新扩展提示 */}
          <div className="glass rounded-xl p-6 border border-dashed border-white/20">
            <div className="flex items-center justify-center text-white/40">
              <div className="text-center">
                <div className="text-4xl mb-2">➕</div>
                <p>更多扩展工具即将上线</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 配置弹窗 */}
      {selectedExt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedExt(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl border border-white/20 p-6 w-96"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="text-xl font-bold text-white mb-4">⚙️ {selectedExt.label} 配置</h4>
            
            <div className="space-y-4">
              {Object.entries(selectedExt.config).map(([key, value]) => (
                <div key={key}>
                  <label className="text-sm text-white/60 block mb-1">
                    {key === 'tunnelToken' ? 'Tunnel Token' : 
                     key === 'domain' ? '域名' :
                     key === 'deviceId' ? '设备ID' :
                     key === 'syncInterval' ? '同步间隔(秒)' : key}
                  </label>
                  <input
                    type={key === 'syncInterval' ? 'number' : 'text'}
                    defaultValue={value as string}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500/50"
                    onChange={(e) => {
                      const newConfig = { ...selectedExt.config }
                      newConfig[key] = key === 'syncInterval' ? parseInt(e.target.value) : e.target.value
                      setSelectedExt({ ...selectedExt, config: newConfig })
                    }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedExt(null)}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => saveConfig(selectedExt.id, selectedExt.config)}
                className="flex-1 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
              >
                保存
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

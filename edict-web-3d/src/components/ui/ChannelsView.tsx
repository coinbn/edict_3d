import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// 消息渠道类型
interface Channel {
  id: string
  name: string
  type: 'telegram' | 'discord' | 'feishu' | 'dingtalk' | 'qq' | 'whatsapp' | 'signal'
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
  agents: string[]
  lastMessage?: string
}

// 可用的渠道类型配置
const CHANNEL_TYPES = [
  { 
    key: 'telegram', 
    label: 'Telegram', 
    icon: '✈️', 
    color: '#0088cc',
    fields: [
      { name: 'botToken', label: 'Bot Token', type: 'password' },
      { name: 'chatId', label: 'Chat ID', type: 'text' },
    ]
  },
  { 
    key: 'discord', 
    label: 'Discord', 
    icon: '🎮', 
    color: '#5865f2',
    fields: [
      { name: 'botToken', label: 'Bot Token', type: 'password' },
      { name: 'guildId', label: 'Guild ID', type: 'text' },
      { name: 'channelId', label: 'Channel ID', type: 'text' },
    ]
  },
  { 
    key: 'feishu', 
    label: '飞书', 
    icon: '📧', 
    color: '#2a90ff',
    fields: [
      { name: 'appId', label: 'App ID', type: 'text' },
      { name: 'appSecret', label: 'App Secret', type: 'password' },
    ]
  },
  { 
    key: 'dingtalk', 
    label: '钉钉', 
    icon: '🔔', 
    color: '#1e92ff',
    fields: [
      { name: 'agentId', label: 'Agent ID', type: 'text' },
      { name: 'appKey', label: 'App Key', type: 'text' },
      { name: 'appSecret', label: 'App Secret', type: 'password' },
    ]
  },
  { 
    key: 'qq', 
    label: 'QQ', 
    icon: '🐧', 
    color: '#12b7f5',
    fields: [
      { name: 'botId', label: 'Bot ID', type: 'text' },
      { name: 'authorization', label: 'Authorization', type: 'password' },
    ]
  },
]

export default function ChannelsView() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addChannelType, setAddChannelType] = useState<string>('')
  const [testLoading, setTestLoading] = useState<string | null>(null)
  
  // Gateway API 基础地址
  const getGatewayApiBase = () => {
    return localStorage.getItem('gatewayBase') || 'http://localhost:18789'
  }

  // 获取渠道列表
  const fetchChannels = async () => {
    setLoading(true)
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/channels`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setChannels(data.channels || [])
      } else {
        setChannels(getMockChannels())
      }
    } catch (error) {
      console.error('Fetch channels error:', error)
      setChannels(getMockChannels())
    } finally {
      setLoading(false)
    }
  }

  // 模拟渠道数据
  const getMockChannels = (): Channel[] => [
    {
      id: 'ch-1',
      name: 'Telegram 主群',
      type: 'telegram',
      enabled: true,
      status: 'connected',
      config: { chatId: '-1001234567890' },
      agents: ['taizi'],
      lastMessage: '2026-03-30 12:00:00',
    },
    {
      id: 'ch-2',
      name: 'Discord 开发频道',
      type: 'discord',
      enabled: true,
      status: 'connected',
      config: { channelId: '123456789' },
      agents: ['zhongshu', 'bingbu'],
      lastMessage: '2026-03-30 11:30:00',
    },
    {
      id: 'ch-3',
      name: '飞书工作群',
      type: 'feishu',
      enabled: false,
      status: 'disconnected',
      config: {},
      agents: [],
      lastMessage: '2026-03-29 18:00:00',
    },
  ]

  // 添加渠道
  const addChannel = async (channelData: Partial<Channel>) => {
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData)
      })
      
      if (response.ok) {
        await fetchChannels()
        setShowAddModal(false)
        setAddChannelType('')
        return true
      }
      return false
    } catch (error) {
      console.error('Add channel error:', error)
      // 模拟添加
      const newChannel: Channel = {
        ...channelData,
        id: `ch-${Date.now()}`,
        status: 'disconnected',
      } as Channel
      setChannels([...channels, newChannel])
      setShowAddModal(false)
      setAddChannelType('')
      return true
    }
  }

  // 删除渠道
  const deleteChannel = async (channelId: string) => {
    try {
      const gatewayBase = getGatewayApiBase()
      
      await fetch(`${gatewayBase}/api/channels/${channelId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Delete channel error:', error)
    }
    setChannels(channels.filter(c => c.id !== channelId))
    setSelectedChannel(null)
  }

  // 测试连接
  const testConnection = async (channel: Channel) => {
    setTestLoading(channel.id)
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/channels/${channel.id}/test`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        setChannels(channels.map(c => 
          c.id === channel.id ? { ...c, status: data.connected ? 'connected' : 'error' } : c
        ))
      } else {
        // 模拟测试成功
        setChannels(channels.map(c => 
          c.id === channel.id ? { ...c, status: 'connected' as const } : c
        ))
      }
    } catch (error) {
      console.error('Test connection error:', error)
      setChannels(channels.map(c => 
        c.id === channel.id ? { ...c, status: 'error' as const } : c
      ))
    } finally {
      setTestLoading(null)
    }
  }

  // 切换启用状态
  const toggleChannel = async (channel: Channel) => {
    const newEnabled = !channel.enabled
    setChannels(channels.map(c => 
      c.id === channel.id ? { ...c, enabled: newEnabled } : c
    ))
  }

  // 初始化
  useEffect(() => {
    fetchChannels()
  }, [])

  // 状态颜色
  const statusColors = {
    connected: { bg: 'bg-green-500/20', text: 'text-green-400', label: '已连接' },
    disconnected: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '未连接' },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', label: '错误' },
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex gap-4"
    >
      {/* 左侧：渠道列表 */}
      <div className="w-96 flex flex-col">
        {/* 标题和操作 */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">💬 消息渠道</h2>
            <p className="text-white/40 text-sm">管理 Telegram、Discord 等消息接入</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
          >
            + 添加渠道
          </button>
        </div>

        {/* 渠道列表 */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center text-white/40 py-8">加载中...</div>
          ) : channels.length === 0 ? (
            <div className="text-center text-white/40 py-8">
              <div className="text-4xl mb-4">📭</div>
              <p>暂无消息渠道</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-cyan-400 hover:underline"
              >
                添加第一个渠道
              </button>
            </div>
          ) : (
            channels.map((channel) => {
              const channelType = CHANNEL_TYPES.find(t => t.key === channel.type)
              const status = statusColors[channel.status]
              
              return (
                <div
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedChannel?.id === channel.id
                      ? 'bg-cyan-500/20 border border-cyan-500/30'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  } ${!channel.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {/* 图标 */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${channelType?.color}30` }}
                    >
                      {channelType?.icon}
                    </div>
                    
                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">{channel.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-white/40 text-sm">
                        {channelType?.label} · {channel.agents.length} 个 Agent
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 右侧：渠道详情 */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* 头部 */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedChannel.name}</h3>
                <p className="text-white/40 text-sm">
                  {CHANNEL_TYPES.find(t => t.key === selectedChannel.type)?.label}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* 启用开关 */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-white/60 text-sm">启用</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={selectedChannel.enabled}
                      onChange={() => toggleChannel(selectedChannel)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      selectedChannel.enabled ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        selectedChannel.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </div>
                </label>
                
                {/* 测试连接 */}
                <button
                  onClick={() => testConnection(selectedChannel)}
                  disabled={testLoading === selectedChannel.id}
                  className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                >
                  {testLoading === selectedChannel.id ? '测试中...' : '🔗 测试连接'}
                </button>
                
                {/* 删除 */}
                <button
                  onClick={() => deleteChannel(selectedChannel.id)}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  🗑️ 删除
                </button>
              </div>
            </div>

            {/* 配置信息 */}
            <div className="bg-black/30 rounded-xl border border-white/10 p-4 space-y-4">
              <h4 className="text-white font-medium">渠道配置</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/40 text-sm">类型</label>
                  <div className="text-white mt-1">
                    {CHANNEL_TYPES.find(t => t.key === selectedChannel.type)?.label}
                  </div>
                </div>
                <div>
                  <label className="text-white/40 text-sm">状态</label>
                  <div className={`mt-1 ${
                    statusColors[selectedChannel.status].text
                  }`}>
                    {statusColors[selectedChannel.status].label}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-white/40 text-sm">绑定的 Agent</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedChannel.agents.length > 0 ? (
                    selectedChannel.agents.map(agentId => (
                      <span 
                        key={agentId}
                        className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-sm"
                      >
                        🤖 {agentId}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/40">未绑定 Agent</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-white/40 text-sm">最后消息</label>
                <div className="text-white mt-1">
                  {selectedChannel.lastMessage || '暂无消息'}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <p>选择左侧渠道查看详情</p>
            </div>
          </div>
        )}
      </div>

      {/* 添加渠道弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 rounded-xl border border-white/10 p-6 w-[480px]"
          >
            <h3 className="text-xl font-bold text-white mb-4">添加消息渠道</h3>
            
            {/* 渠道类型选择 */}
            <div className="mb-4">
              <label className="text-white/60 text-sm mb-2 block">选择渠道类型</label>
              <div className="grid grid-cols-3 gap-2">
                {CHANNEL_TYPES.map(type => (
                  <button
                    key={type.key}
                    onClick={() => setAddChannelType(type.key)}
                    className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-1 ${
                      addChannelType === type.key
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-white text-sm">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 渠道名称 */}
            <div className="mb-4">
              <label className="text-white/60 text-sm mb-2 block">渠道名称</label>
              <input
                type="text"
                placeholder="例如：Telegram 主群"
                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* 按钮 */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowAddModal(false); setAddChannelType(''); }}
                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => addChannel({ name: '新渠道', type: addChannelType as any, enabled: false })}
                disabled={!addChannelType}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../stores/useStore'

const gradients = [
  'from-purple-500 via-pink-500 to-purple-500',
  'from-blue-500 via-cyan-500 to-blue-500',
  'from-green-500 via-emerald-500 to-green-500',
  'from-yellow-500 via-orange-500 to-yellow-500',
]

export default function AgentCollabView() {
  const {
    agents,
    collabMessages,
    collabLoading,
    collabError,
    fetchAgents,
    fetchChatMessages,
    sendChatMessage,
    clearChatMessages,
    ui,
  } = useStore()
  // 内部状态用于缓存
  const [innerSelectedAgent, setInnerSelectedAgent] = useState<string | null>(null)

  // 每个 agent 独立的思考状态
  const [agentThinking, setAgentThinking] = useState<Record<string, boolean>>({})

  // 优先使用全局 selectedAgent，其次使用内部缓存
  const selectedAgent = ui.selectedAgent?.id || innerSelectedAgent
  const [input, setInput] = useState('')
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const [channelId, setChannelId] = useState<string>('collab')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 每个 Agent 独立的 channel
  const getChannelId = (agentId: string) => `agent_${agentId}`

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  // 同步全局 selectedAgent 到内部状态
  useEffect(() => {
    if (ui.selectedAgent?.id) {
      setInnerSelectedAgent(ui.selectedAgent.id)
    } else if (agents.length > 0 && !innerSelectedAgent) {
      // 如果没有全局选中，且内部也没有，则默认选第一个
      setInnerSelectedAgent(agents[0].id)
    }
  }, [ui.selectedAgent, agents.length])

  // 调试：打印 selectedAgent 变化
  useEffect(() => {
    console.log('=== selectedAgent changed ===', selectedAgent)
  }, [selectedAgent])

  // 切换 Agent 时加载对应的历史消息
  useEffect(() => {
    if (selectedAgent) {
      const newChannelId = getChannelId(selectedAgent)
      setChannelId(newChannelId)
      fetchChatMessages(newChannelId)
    }
  }, [selectedAgent])

  useEffect(() => {
    scrollToBottom()
  }, [collabMessages])

  const handleSend = async () => {
    if (!input.trim()) return

    const message = input
    const targetAgent = selectedAgent || agents[0]?.id
    console.log('=== handleSend === selectedAgent:', selectedAgent, 'target:', targetAgent, 'channelId:', channelId)

    // 设置该 agent 为思考状态
    setAgentThinking(prev => ({ ...prev, [targetAgent]: true }))
    setInput('')  // 先清空输入框

    try {
      await sendChatMessage(targetAgent, message, channelId)
    } finally {
      // 无论成功失败，都停止思考状态
      setAgentThinking(prev => ({ ...prev, [targetAgent]: false }))
    }
  }

  const handleClear = async () => {
    await clearChatMessages(channelId)
  }

  return (
    <div className="flex h-full bg-gray-950 relative overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
             style={{ top: '10%', left: '20%' }} />
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
             style={{ top: '50%', right: '10%', animationDelay: '1s' }} />
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
             style={{ bottom: '10%', left: '40%', animationDelay: '2s' }} />
      </div>

      {/* 左侧边栏 */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 bg-gray-900/80 backdrop-blur-xl border-r border-gray-800 flex flex-col relative z-10"
      >
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Team</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {agents.map((agent, index) => (
            <motion.button
              key={agent.id}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                console.log('=== Agent clicked ===', agent.id)
                setInnerSelectedAgent(agent.id)
              }}
              onHoverStart={() => setHoveredAgent(agent.id)}
              onHoverEnd={() => setHoveredAgent(null)}
              className={`w-full p-3 rounded-xl cursor-pointer transition-all text-left relative overflow-hidden ${
                selectedAgent === agent.id
                  ? 'bg-gray-800/80 text-white'
                  : 'hover:bg-gray-800/50 text-gray-300'
              }`}
            >
              {/* 发光边框效果 */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${gradients[index % gradients.length]} opacity-0 transition-opacity duration-300`}
                style={{ opacity: hoveredAgent === agent.id ? 0.2 : selectedAgent === agent.id ? 0.1 : 0 }}
              />
              
              <div className="relative flex items-center gap-3">
                <motion.span
                  className="text-2xl relative"
                  animate={hoveredAgent === agent.id ? { scale: 1.2 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {agent.emoji || '🤖'}
                  {/* 思考中指示器 */}
                  {agentThinking[agent.id] && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse" />
                  )}
                </motion.span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{agent.label}</span>
                    {/* 状态标识 */}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      agent.status === 'running'
                        ? 'bg-green-500/20 text-green-400'
                        : agent.status === 'offline'
                        ? 'bg-gray-500/20 text-gray-500'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {agent.status || 'idle'}
                    </span>
                  </div>
                  <div className={`text-xs ${selectedAgent === agent.id ? 'text-white/70' : 'text-gray-500'}`}>
                    {agent.role || 'Agent'}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="p-3 border-t border-gray-800 relative z-10">
          <div className="text-xs text-gray-500 text-center">
            在线: {agents.filter((a: any) => a.status === 'running').length} / {agents.length}
          </div>
        </div>
      </motion.div>

      {/* 右侧对话区域 */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* 消息区域 */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {collabLoading && collabMessages.length === 0 ? (
            <div className="text-center text-gray-500">加载中...</div>
          ) : collabMessages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center text-gray-500">
                <motion.div 
                  className="text-5xl mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  💬
                </motion.div>
                <div>开始和 Team 协作</div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {collabMessages.map((msg: any, index: number) => {
                const msgAgent = agents.find(a => a.id === msg.agentId)
                const isUser = msg.agentId === 'user'
                return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <motion.div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      isUser ? 'bg-blue-600' : 'bg-gradient-to-br ' + gradients[index % gradients.length]
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {isUser ? '👤' : msgAgent?.emoji || '🤖'}
                  </motion.div>
                  
                  <div className={`max-w-xl ${isUser ? 'text-right' : ''}`}>
                    <div className={`text-sm font-medium mb-1 ${isUser ? 'text-blue-400' : 'text-gray-400'}`}>
                      {isUser ? '我' : msgAgent?.label || msg.agentId}
                    </div>
                    <motion.div 
                      className={`p-4 rounded-2xl inline-block ${
                        isUser
                          ? 'bg-blue-600/80 text-white rounded-tr-sm'
                          : 'bg-gray-800/80 backdrop-blur text-gray-200 rounded-tl-sm border border-gray-700/50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      {msg.content}
                    </motion.div>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              )})}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </motion.div>

        {/* 输入框 */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-4 border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-xl relative z-10"
        >
          {/* 当前选中 Agent 的思考状态 - 只显示当前选中的 */}
          {agentThinking[selectedAgent || ''] && (
            <div className="mb-3 flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 backdrop-blur border border-cyan-500/30">
              <span className="text-2xl">
                {agents.find(a => a.id === selectedAgent)?.emoji || '🤖'}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span className="text-sm text-cyan-400">
                  {agents.find(a => a.id === selectedAgent)?.label || selectedAgent} 正在思考...
                </span>
              </div>
            </div>
          )}
          {collabError && <div className="text-xs text-red-400 mb-2">{collabError}</div>}
          <div className="flex gap-3">
            <motion.input
              whileFocus={{ scale: 1.01 }}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="flex-1 bg-gray-800/50 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur"
            />
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium"
            >
              发送
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClear}
              className="px-4 py-3 bg-gray-700/80 text-white rounded-xl font-medium"
            >
              清空
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

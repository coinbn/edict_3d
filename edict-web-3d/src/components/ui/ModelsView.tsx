import { useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'
import { motion } from 'framer-motion'

const API_BASE = 'http://localhost:8080/api'

const AVAILABLE_MODELS = [
  { id: 'minimax-portal/MiniMax-M2.5', name: 'MiniMax M2.5', provider: 'MiniMax' },
  { id: 'minimax-portal/MiniMax-M2.1', name: 'MiniMax M2.1', provider: 'MiniMax' },
  { id: 'moonshot/kimi-k2.5', name: 'Kimi K2.5', provider: 'Moonshot' },
  { id: 'kimi-coding/k2p5', name: 'Kimi Coding K2.5', provider: 'Moonshot' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini', provider: 'OpenAI' },
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
]

export default function ModelsView() {
  const { agents, fetchAgents } = useStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  useEffect(() => {
    fetchAgents()
  }, [])
  
  const changeModel = async (agentId: string, model: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${API_BASE}/set-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, model })
      })
      const data = await res.json()
      
      if (data.ok) {
        setSuccess(`已将 ${agentId} 切换为 ${model}`)
        fetchAgents()
      } else {
        setError(data.error || '切换失败')
      }
    } catch (err) {
      setError('切换模型失败')
    } finally {
      setLoading(false)
    }
  }
  
  const providerColors: Record<string, string> = {
    'MiniMax': 'from-blue-500/20 border-blue-500/30 text-blue-400',
    'Moonshot': 'from-purple-500/20 border-purple-500/30 text-purple-400',
    'OpenAI': 'from-green-500/20 border-green-500/30 text-green-400',
    'Anthropic': 'from-orange-500/20 border-orange-500/30 text-orange-400',
  }
  
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
          <h2 className="text-2xl font-bold text-white">模型配置</h2>
          <p className="text-white/40 text-sm">管理 Agent 使用的 AI 模型</p>
        </div>
      </div>
      
      {error && (
        <div className="glass rounded-xl p-4 mb-4 border border-red-500/30">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="glass rounded-xl p-4 mb-4 border border-green-500/30">
          <p className="text-green-400">{success}</p>
        </div>
      )}
      
      {/* Agent 模型配置 */}
      <div className="space-y-4">
        {agents.map((agent: any, idx: number) => {
          const currentModel = agent.model || ''
          const currentProvider = AVAILABLE_MODELS.find(m => m.id === currentModel)?.provider || 'Other'
          const providerStyle = providerColors[currentProvider] || providerColors['MiniMax']
          
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass rounded-xl p-5"
            >
              {/* Agent 信息 */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                <span className="text-3xl">{agent.emoji}</span>
                <div className="flex-1">
                  <div className="text-white font-medium">{agent.label}</div>
                  <div className="text-white/40 text-sm">{agent.role}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${providerStyle}`}>
                  {currentProvider}
                </div>
              </div>
              
              {/* 当前模型 */}
              <div className="mb-4">
                <label className="text-white/40 text-sm">当前模型</label>
                <div className="text-cyan-400 font-medium mt-1">
                  {currentModel || '未设置'}
                </div>
              </div>
              
              {/* 模型选择 */}
              <div>
                <label className="text-white/40 text-sm mb-2 block">切换模型</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => changeModel(agent.id, model.id)}
                      disabled={loading || currentModel === model.id}
                      className={`p-2 rounded-lg text-sm transition-all ${
                        currentModel === model.id
                          ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-400'
                          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      {agents.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-white/40">暂无 Agent 数据</p>
        </div>
      )}
    </motion.div>
  )
}

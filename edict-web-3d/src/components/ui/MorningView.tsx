import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const API_BASE = 'http://localhost:8080/api'

interface MorningBrief {
  date: string
  generatedAt: string
  categories: Record<string, { title: string; summary: string; source?: string }[]>
}

export default function MorningView() {
  const [brief, setBrief] = useState<MorningBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchBrief = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/morning-brief`)
      const json = await res.json()
      // 后端返回格式: {code: 200, data: {...}}
      setBrief(json.data || json)
    } catch (err) {
      setError('获取早报失败')
    } finally {
      setLoading(false)
    }
  }
  
  // 真正调用 zaochao 生成新数据（重新生成按钮）
  const generateBrief = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/morning-brief/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const json = await res.json()
      if (json.ok || json.success) {
        // 生成成功后，等待几秒再获取数据（给Agent处理时间）
        setTimeout(() => fetchBrief(), 3000)
      } else {
        setError(json.message || json.error || '生成失败')
        setLoading(false)
      }
    } catch (err) {
      setError('调用生成接口失败')
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchBrief()
  }, [])
  
  // 分类颜色
  const categoryColors: Record<string, { bg: string, border: string, text: string }> = {
    '科技': { bg: 'from-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
    '商业': { bg: 'from-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    '国际': { bg: 'from-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
    '社会': { bg: 'from-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
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
          <h2 className="text-2xl font-bold text-white">每日早报</h2>
          <p className="text-white/40 text-sm">
            {brief?.date || new Date().toLocaleDateString('zh-CN')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBrief}
            disabled={loading}
            className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg hover:bg-purple-500/30 disabled:opacity-50"
          >
            {loading ? '加载中...' : '刷新'}
          </button>
          <button
            onClick={generateBrief}
            disabled={loading}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
          >
            重新生成
          </button>
        </div>
      </div>
      
      {error && (
        <div className="glass rounded-xl p-4 mb-4 border border-red-500/30">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {loading && !brief && (
        <div className="flex items-center justify-center h-64">
          <div className="text-white/40">加载中...</div>
        </div>
      )}
      
      {/* 早报内容 */}
      {brief && (
        <div className="space-y-6">
          {Object.entries(brief.categories).map(([category, articles]) => {
            const colors = categoryColors[category] || categoryColors['科技']
            
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl p-5"
              >
                {/* 分类标题 */}
                <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-white/10`}>
                  <span className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')}`}></span>
                  <h3 className={`text-lg font-bold ${colors.text}`}>{category}</h3>
                  <span className="text-white/30 text-sm">({articles.length})</span>
                </div>
                
                {/* 文章列表 */}
                <div className="space-y-4">
                  {articles.map((article, idx) => (
                    <div key={idx} className="group">
                      <h4 className="text-white font-medium mb-1 group-hover:text-cyan-400 transition-colors">
                        {article.title}
                      </h4>
                      {article.summary && (
                        <p className="text-white/50 text-sm line-clamp-2">
                          {article.summary}
                        </p>
                      )}
                      {article.source && (
                        <p className="text-white/30 text-xs mt-1">
                          来源: {article.source}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      
      {/* 无数据 */}
      {!brief && !loading && !error && (
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">📰</div>
          <p className="text-white/40 mb-4">暂无早报数据</p>
          <button
            onClick={generateBrief}
            className="px-6 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
          >
            生成早报
          </button>
        </div>
      )}
    </motion.div>
  )
}

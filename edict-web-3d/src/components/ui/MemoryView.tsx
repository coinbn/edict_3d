import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

// 记忆文件类型
interface MemoryFile {
  name: string
  path: string
  size: number
  modified: string
  type: 'daily' | 'core' | 'config'
  content?: string
}

// 记忆文件分类
const MEMORY_CATEGORIES = [
  { key: 'daily', label: '日常记忆', icon: '📅', pattern: 'memory/*.md' },
  { key: 'core', label: '核心文件', icon: '🧠', files: ['MEMORY.md', 'SOUL.md', 'USER.md', 'IDENTITY.md', 'AGENTS.md', 'TOOLS.md'] },
  { key: 'config', label: '配置文件', icon: '⚙️', files: ['HEARTBEAT.md'] },
]

// 核心文件路径映射
const CORE_FILES: Record<string, string> = {
  'MEMORY.md': 'C:\\Users\\admin\\.openclaw\\workspace\\MEMORY.md',
  'SOUL.md': 'C:\\Users\\admin\\.openclaw\\workspace\\SOUL.md',
  'USER.md': 'C:\\Users\\admin\\.openclaw\\workspace\\USER.md',
  'IDENTITY.md': 'C:\\Users\\admin\\.openclaw\\workspace\\IDENTITY.md',
  'AGENTS.md': 'C:\\Users\\admin\\.openclaw\\workspace\\AGENTS.md',
  'TOOLS.md': 'C:\\Users\\admin\\.openclaw\\workspace\\TOOLS.md',
  'HEARTBEAT.md': 'C:\\Users\\admin\\.openclaw\\workspace\\HEARTBEAT.md',
}

export default function MemoryView() {
  const [files, setFiles] = useState<MemoryFile[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<MemoryFile | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('daily')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [exporting, setExporting] = useState(false)

  // Gateway API 基础地址
  const getGatewayApiBase = () => {
    return localStorage.getItem('gatewayBase') || 'http://localhost:18789'
  }

  // 获取记忆文件列表
  const fetchMemoryFiles = async () => {
    setLoading(true)
    try {
      const gatewayBase = getGatewayApiBase()
      
      // 尝试从 Gateway API 获取记忆文件列表
      const response = await fetch(`${gatewayBase}/api/memory/files`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      } else {
        // 使用本地文件列表
        setFiles(getLocalMemoryFiles())
      }
    } catch (error) {
      console.error('Fetch memory files error:', error)
      setFiles(getLocalMemoryFiles())
    } finally {
      setLoading(false)
    }
  }

  // 获取本地记忆文件列表（模拟）
  const getLocalMemoryFiles = (): MemoryFile[] => {
    const now = new Date()
    const dailyFiles = [
      { name: '2026-03-30.md', path: 'memory/2026-03-30.md', size: 2048, modified: now.toISOString(), type: 'daily' as const },
      { name: '2026-03-29.md', path: 'memory/2026-03-29.md', size: 1536, modified: new Date(now.getTime() - 86400000).toISOString(), type: 'daily' as const },
      { name: '2026-03-28.md', path: 'memory/2026-03-28.md', size: 3072, modified: new Date(now.getTime() - 172800000).toISOString(), type: 'daily' as const },
    ]
    
    const coreFiles: MemoryFile[] = [
      { name: 'MEMORY.md', path: 'MEMORY.md', size: 12288, modified: now.toISOString(), type: 'core' as const },
      { name: 'SOUL.md', path: 'SOUL.md', size: 4096, modified: now.toISOString(), type: 'core' as const },
      { name: 'USER.md', path: 'USER.md', size: 512, modified: now.toISOString(), type: 'core' as const },
      { name: 'IDENTITY.md', path: 'IDENTITY.md', size: 256, modified: now.toISOString(), type: 'core' as const },
      { name: 'AGENTS.md', path: 'AGENTS.md', size: 8192, modified: now.toISOString(), type: 'core' as const },
      { name: 'TOOLS.md', path: 'TOOLS.md', size: 4096, modified: now.toISOString(), type: 'core' as const },
    ]
    
    const configFiles: MemoryFile[] = [
      { name: 'HEARTBEAT.md', path: 'HEARTBEAT.md', size: 128, modified: now.toISOString(), type: 'config' as const },
    ]
    
    return [...dailyFiles, ...coreFiles, ...configFiles]
  }

  // 读取文件内容
  const readFileContent = async (file: MemoryFile) => {
    try {
      const gatewayBase = getGatewayApiBase()
      
      // 尝试从 API 获取
      const response = await fetch(`${gatewayBase}/api/memory/read?path=${encodeURIComponent(file.path)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.content || ''
      }
      
      // 模拟内容
      return getMockContent(file.name)
    } catch (error) {
      console.error('Read file error:', error)
      return getMockContent(file.name)
    }
  }

  // 获取模拟内容
  const getMockContent = (fileName: string): string => {
    const contents: Record<string, string> = {
      'MEMORY.md': `# 🧠 长期记忆\n\n## 学习内容记录\n\n### 2025-02-27 量化交易学习日\n\n**学习主题:**\n- 技术指标：RSI（相对强弱指标）\n- 经典策略：均值回归策略\n\n---\n*最后更新: 2025-02-27*`,
      'SOUL.md': `# 太子 · 皇上代理\n\n你是太子，皇上消息的第一接收人和分拣者。`,
      'USER.md': `# USER.md - About Your Human\n\n- **Name:** \n- **What to call them:**\n- **Timezone:** Asia/Shanghai`,
      'HEARTBEAT.md': `# HEARTBEAT.md\n\n# Keep this file empty to skip heartbeat API calls.`,
      'default': `# ${fileName}\n\n文件内容加载中...`,
    }
    return contents[fileName] || contents.default
  }

  // 保存文件内容
  const saveFileContent = async (file: MemoryFile, content: string) => {
    try {
      const gatewayBase = getGatewayApiBase()
      
      const response = await fetch(`${gatewayBase}/api/memory/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, content })
      })
      
      if (response.ok) {
        // 更新本地状态
        setFiles(files.map(f => 
          f.path === file.path ? { ...f, content } : f
        ))
        setEditMode(false)
        return true
      }
      return false
    } catch (error) {
      console.error('Save file error:', error)
      return false
    }
  }

  // 导出为 ZIP
  const exportAsZip = async () => {
    setExporting(true)
    try {
      // 创建模拟 ZIP（实际应该调用 API）
      const memoryDir = 'C:\\Users\\admin\\.openclaw\\workspace\\memory'
      const filesToExport = files.filter(f => 
        selectedCategory === 'all' || f.type === selectedCategory
      )
      
      // 触发下载
      const blob = new Blob([JSON.stringify(filesToExport.map(f => f.name))], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `memory-backup-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // 初始化
  useEffect(() => {
    fetchMemoryFiles()
  }, [])

  // 点击文件
  const handleFileClick = async (file: MemoryFile) => {
    setSelectedFile(file)
    setEditMode(false)
    const content = await readFileContent(file)
    setEditContent(content)
  }

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  // 过滤文件
  const filteredFiles = files.filter(f => {
    const matchCategory = selectedCategory === 'all' || f.type === selectedCategory
    const matchSearch = !searchKeyword || f.name.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex gap-4"
    >
      {/* 左侧：文件列表 */}
      <div className="w-80 flex flex-col">
        {/* 标题 */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white">🧠 记忆管理</h2>
          <p className="text-white/40 text-sm">查看和编辑 Agent 记忆文件</p>
        </div>

        {/* 分类选择 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            📁 全部
          </button>
          {MEMORY_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="搜索记忆文件..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* 文件列表 */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center text-white/40 py-8">加载中...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center text-white/40 py-8">暂无记忆文件</div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.path}
                onClick={() => handleFileClick(file)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedFile?.path === file.path
                    ? 'bg-cyan-500/20 border border-cyan-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium truncate">{file.name}</span>
                  <span className="text-white/40 text-xs">{formatSize(file.size)}</span>
                </div>
                <div className="text-white/40 text-xs mt-1">
                  {formatTime(file.modified)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 导出按钮 */}
        <button
          onClick={exportAsZip}
          disabled={exporting}
          className="mt-4 w-full py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {exporting ? '导出中...' : '📦 导出记忆'} 
        </button>
      </div>

      {/* 右侧：文件内容 */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            {/* 文件头部 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedFile.name}</h3>
                <p className="text-white/40 text-sm">
                  {formatSize(selectedFile.size)} · {selectedFile.type === 'daily' ? '日常记忆' : selectedFile.type === 'core' ? '核心文件' : '配置文件'}
                </p>
              </div>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <button
                      onClick={() => saveFileContent(selectedFile, editContent)}
                      className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      💾 保存
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition-colors"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                  >
                    ✏️ 编辑
                  </button>
                )}
              </div>
            </div>

            {/* 文件内容 */}
            <div className="flex-1 bg-black/30 rounded-xl border border-white/10 overflow-hidden">
              {editMode ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full p-4 bg-transparent text-white/80 font-mono text-sm resize-none focus:outline-none"
                  placeholder="输入文件内容..."
                />
              ) : (
                <pre className="w-full h-full p-4 text-white/80 font-mono text-sm overflow-auto whitespace-pre-wrap">
                  {editContent || '文件内容为空'}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40">
            <div className="text-center">
              <div className="text-4xl mb-4">🧠</div>
              <p>选择左侧记忆文件查看内容</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

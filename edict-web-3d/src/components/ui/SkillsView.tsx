import { useState } from 'react'
import { motion } from 'framer-motion'

// 技能分类定义
const skillCategories = [
  {
    id: 'core',
    name: 'OpenClaw 核心',
    icon: '⚡',
    color: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/30',
    skills: [
      { name: 'browser', description: 'Web 浏览器控制 - 页面导航、截图、UI 自动化', version: 'builtin' },
      { name: 'exec', description: 'Shell 命令执行 - 运行脚本、进程管理', version: 'builtin' },
      { name: 'web_search', description: '网络搜索 - AI 驱动的实时搜索', version: 'builtin' },
      { name: 'web_fetch', description: '网页获取 - 提取 URL 内容转为 Markdown', version: 'builtin' },
      { name: 'tts', description: '语音合成 - 文本转语音输出', version: 'builtin' },
      { name: 'voice_call', description: '语音通话 - 拨打电话进行语音对话', version: 'builtin' },
      { name: 'message', description: '消息发送 - 跨渠道消息和通知', version: 'builtin' },
      { name: 'canvas', description: '画布控制 - 呈现、截图、UI 推送', version: 'builtin' },
      { name: 'nodes', description: '节点控制 - 配对设备管理', version: 'builtin' },
      { name: 'sessions', description: '会话管理 - 子代理和会话控制', version: 'builtin' },
      { name: 'subagents', description: '子代理 - 代理编排和监控', version: 'builtin' },
      { name: 'process', description: '进程管理 - 后台执行会话控制', version: 'builtin' },
      { name: 'memory_search', description: '记忆检索 - 语义搜索长期记忆', version: 'builtin' },
    ]
  },
  {
    id: 'feishu',
    name: '飞书办公',
    icon: '📋',
    color: 'from-blue-600/20 to-indigo-500/20',
    borderColor: 'border-blue-500/30',
    skills: [
      { name: 'feishu_doc', description: '飞书文档 - 文档读写操作', version: 'builtin' },
      { name: 'feishu_wiki', description: '飞书知识库 - 知识库导航管理', version: 'builtin' },
      { name: 'feishu_drive', description: '飞书云盘 - 文件存储管理', version: 'builtin' },
      { name: 'feishu_chat', description: '飞书聊天 - 群组和消息', version: 'builtin' },
      { name: 'feishu_bitable', description: '飞书多维表格 - 表格数据管理', version: 'builtin' },
    ]
  },
  {
    id: 'minimax',
    name: 'MiniMax 官方',
    icon: '🎯',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    skills: [
      { name: 'minimax-multimodal', description: '多模态 AI 工具包 - TTS、音乐、视频、图像生成', version: '1.0' },
      { name: 'minimax-docx', description: 'Word 文档处理 - 创建、编辑、格式化 DOCX', version: '1.0' },
      { name: 'minimax-pdf', description: 'PDF 生成与处理 - 高质量视觉设计', version: '1.0' },
      { name: 'minimax-xlsx', description: 'Excel 处理 - 创建、读取、分析、编辑', version: '1.0' },
      { name: 'frontend-dev', description: '前端开发 - React/Next.js + Tailwind + 动画', version: '1.0' },
      { name: 'fullstack-dev', description: '全栈开发 - API、认证、实时功能、数据库', version: '1.0' },
    ]
  },
  {
    id: 'development',
    name: '开发工具',
    icon: '💻',
    color: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/30',
    skills: [
      { name: 'coding-agent', description: '代码编写、调试、重构、架构设计', version: '1.0' },
      { name: 'debug-pro', description: '前端/UI Bug 调试，自动收集日志', version: '1.0' },
      { name: 'nano-pdf', description: 'PDF 处理：合并、拆分、提取文本', version: '1.0' },
      { name: 'playwright-cli-main', description: '浏览器自动化测试', version: '1.0' },
      { name: 'github', description: 'GitHub 操作 - Issues、PR、CI/CD', version: '1.0' },
      { name: 'gh-issues', description: 'GitHub Issues 处理、PR 监控', version: '1.0' },
    ]
  },
  {
    id: 'data',
    name: '数据处理',
    icon: '📊',
    color: 'from-violet-500/20 to-purple-500/20',
    borderColor: 'border-violet-500/30',
    skills: [
      { name: 'tavily-search', description: 'AI 搜索引擎，实时网络搜索', version: '1.0' },
      { name: 'nano-banana-pro', description: '数据处理与分析', version: '1.0' },
      { name: 'summarize', description: '文本摘要 - 压缩长内容为精简总结', version: '1.0' },
    ]
  },
  {
    id: 'communication',
    name: '通讯社交',
    icon: '💬',
    color: 'from-pink-500/20 to-rose-500/20',
    borderColor: 'border-pink-500/30',
    skills: [
      { name: 'moltbook', description: 'AI 社交网络，发帖评论互动', version: '1.0' },
      { name: 'tts-temp', description: '语音合成功能', version: '1.0' },
    ]
  },
  {
    id: 'memory',
    name: '智能记忆',
    icon: '🧠',
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/30',
    skills: [
      { name: 'cognitive-memory', description: '多存储记忆系统，知识图谱', version: '1.0' },
      { name: 'cognitive-memory-temp', description: '记忆系统临时版本', version: '1.0' },
      { name: 'self-improving-agent', description: '持续改进，错误学习', version: '1.0' },
    ]
  },
  {
    id: 'system',
    name: '系统工具',
    icon: '🔧',
    color: 'from-slate-500/20 to-gray-500/20',
    borderColor: 'border-slate-500/30',
    skills: [
      { name: 'clawhub', description: 'Skill 市场，浏览安装技能', version: '1.0' },
      { name: 'agent-council', description: '自主 AI Agent 创建和管理', version: '1.0' },
      { name: 'agent-council-main', description: 'Agent 理事会主模块', version: '1.0' },
      { name: 'healthcheck', description: '系统安全检查和配置', version: '1.0' },
      { name: 'skill-creator', description: '创建和打包 Agent Skills', version: '1.0' },
    ]
  },
]

export default function SkillsView() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 过滤技能
  const filteredCategories = skillCategories.map(cat => ({
    ...cat,
    skills: cat.skills.filter(skill => 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.skills.length > 0)

  const totalSkills = skillCategories.reduce((sum, cat) => sum + cat.skills.length, 0)
  const builtinSkills = skillCategories.filter(c => c.id === 'core' || c.id === 'feishu').reduce((sum, cat) => sum + cat.skills.length, 0)
  const installedSkills = totalSkills - builtinSkills

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
          <h2 className="text-2xl font-bold text-white">技能中心</h2>
          <p className="text-white/40 text-sm">
            共 {totalSkills} 个技能 · {builtinSkills} 个内置 · {installedSkills} 个已安装
          </p>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索技能..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
        </div>
      </div>

      {/* 分类筛选标签 */}
      {!searchQuery && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              activeCategory === null
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            全部
          </button>
          {skillCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.name}
              <span className="ml-1 text-xs opacity-50">({cat.skills.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* 技能列表 */}
      <div className="space-y-6">
        {(searchQuery ? filteredCategories : skillCategories.filter(cat => 
          activeCategory === null || cat.id === activeCategory
        )).map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-xl p-5 border ${category.borderColor}`}
          >
            {/* 分类标题 */}
            <div className={`flex items-center gap-3 mb-4 pb-3 border-b border-white/10 bg-gradient-to-r ${category.color} rounded-lg p-3`}>
              <span className="text-2xl">{category.icon}</span>
              <div>
                <h3 className="text-lg font-bold text-white">{category.name}</h3>
                <p className="text-white/40 text-sm">{category.skills.length} 个技能</p>
              </div>
            </div>

            {/* 技能卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.skills.map((skill, idx) => (
                <motion.div
                  key={skill.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg p-4 transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                      {skill.name}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      skill.version === 'builtin' 
                        ? 'text-amber-400/70 bg-amber-500/10' 
                        : 'text-white/30 bg-white/5'
                    }`}>
                      {skill.version === 'builtin' ? '内置' : `v${skill.version}`}
                    </span>
                  </div>
                  <div className="text-white/40 text-sm leading-relaxed">
                    {skill.description}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-cyan-400/50 bg-cyan-500/5 px-2 py-1 rounded">
                      {category.name}
                    </span>
                    <span className="text-xs text-white/20">
                      {skill.version === 'builtin' ? '⚡ 核心' : '✅ 已安装'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 空状态 */}
      {searchQuery && filteredCategories.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white/40">未找到匹配的技能</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
          >
            清除搜索
          </button>
        </div>
      )}

      {/* 底部信息 */}
      <div className="mt-8 glass rounded-xl p-4">
        <div className="flex items-center justify-between text-sm text-white/40">
          <div>
            <span className="text-cyan-400">{totalSkills}</span> 个技能 · 
            <span className="text-amber-400"> {builtinSkills}</span> 个内置 · 
            <span className="text-emerald-400"> {installedSkills}</span> 个已安装
          </div>
          <div className="flex items-center gap-4">
            <span>技能来源: OpenClaw / MiniMax / Community</span>
            <span className="text-white/20">|</span>
            <span>最后更新: 2026-03-30</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

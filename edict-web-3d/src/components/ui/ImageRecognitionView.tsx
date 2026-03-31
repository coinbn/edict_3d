import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  timestamp: Date
}

export default function ImageRecognitionView() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImages(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // 移除选中的图片
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  // 处理拖拽
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImages(prev => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() && selectedImages.length === 0) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      images: selectedImages.length > 0 ? [...selectedImages] : undefined,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setSelectedImages([])
    setLoading(true)

    // 模拟 AI 响应
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: selectedImages.length > 0
          ? '我看到了您上传的图片。这是一张包含...的图片。如果您有具体的问题，请告诉我！'
          : '请上传图片，我可以帮您分析图片内容。支持拖拽或点击上传。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
      setLoading(false)
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">🖼️ 图片识别</h3>
          <p className="text-white/40 text-sm">上传图片，AI 自动分析内容</p>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 glass rounded-xl overflow-hidden flex flex-col">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div
              className="h-full flex flex-col items-center justify-center text-white/40"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-6xl mb-4">📸</div>
              <p>拖拽图片到此处</p>
              <p className="text-sm">或点击下方按钮上传</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  msg.role === 'user' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
                }`}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className={`max-w-[70%] space-y-2 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}>
                  {/* 图片 */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Uploaded ${idx}`}
                          className="w-32 h-32 object-cover rounded-lg border border-white/10"
                        />
                      ))}
                    </div>
                  )}
                  {/* 文本 */}
                  {msg.content && (
                    <div className={`px-4 py-2 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-cyan-500/20 text-white'
                        : 'bg-white/5 text-white/80'
                    }`}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">🤖</div>
              <div className="px-4 py-2 bg-white/5 rounded-2xl">
                <span className="animate-pulse">分析中...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-white/10">
          {/* 已选图片预览 */}
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`Selected ${idx}`}
                    className="w-16 h-16 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/80 rounded-full text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              📎 图片
            </button>
            
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="描述图片或提问..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            
            <button
              onClick={handleSend}
              disabled={loading || (!inputText.trim() && selectedImages.length === 0)}
              className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30 disabled:opacity-50 transition-colors"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

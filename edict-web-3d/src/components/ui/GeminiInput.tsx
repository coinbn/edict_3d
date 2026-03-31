import { useState, useEffect, useRef } from 'react'

interface GeminiInputProps {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
  onImageUpload?: (imageData: string) => void
  placeholder?: string
  className?: string
}

export default function GeminiInput({
  value,
  onChange,
  onSubmit,
  onImageUpload,
  placeholder = 'Ask Gemini',
  className = '',
}: GeminiInputProps) {
  const [rotation, setRotation] = useState(0)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef<number>(Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 旋转动画
  useEffect(() => {
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      setRotation((elapsed * 72) % 360) // 5s 一圈 = 72deg/s
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const gradientStyle = {
    background: `conic-gradient(from ${rotation}deg at 52% 49%, 
      oklch(0.63 0.2 251.22) 27%, 
      oklch(0.67 0.21 25.81) 33%, 
      oklch(0.9 0.19 93.93) 41%, 
      oklch(0.79 0.25 150.49) 49%, 
      oklch(0.63 0.2 251.22) 65%, 
      oklch(0.72 0.21 150.89) 93%, 
      oklch(0.63 0.2 251.22))`,
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit()
    }
  }

  const handlePlusClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const imageData = event.target?.result as string
        setSelectedImage(imageData)
        if (onImageUpload) {
          onImageUpload(imageData)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* 图片预览 */}
      {selectedImage && (
        <div className="absolute -top-16 left-2 flex items-center gap-2 bg-gray-800/90 rounded-lg p-2 z-20">
          <img 
            src={selectedImage} 
            alt="Selected" 
            className="w-12 h-12 object-cover rounded"
          />
          <button
            onClick={handleRemoveImage}
            className="text-white/60 hover:text-white text-xs px-2 py-1 bg-red-500/20 rounded"
          >
            ✕
          </button>
        </div>
      )}

      <div
        className="gemini-input"
        style={{
          position: 'relative',
          borderRadius: '150px',
          background: 'none',
          padding: 0,
          border: '4px solid #555',
          width: '100%',
          height: '60px',
        }}
      >
        {/* 模糊发光背景 */}
        <div
          style={{
            ...gradientStyle,
            position: 'absolute',
            inset: '-4px',
            borderRadius: '150px',
            filter: 'blur(15px)',
            zIndex: 0,
            opacity: 0.6,
          }}
        />

        {/* 内部内容 */}
        <div
          style={{
            background: '#1a1c1e',
            display: 'grid',
            gridTemplateColumns: '48px 1fr 48px',
            alignItems: 'center',
            gap: '0.5rem',
            borderRadius: '150px',
            height: '52px',
            position: 'relative',
            zIndex: 2,
            border: '4px solid #1a1c1e',
          }}
        >
          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 左边 + 按钮 */}
          <button
            type="button"
            onClick={handlePlusClick}
            style={{
              background: selectedImage ? 'rgba(34, 197, 94, 0.2)' : 'none',
              border: 'none',
              cursor: 'pointer',
              color: selectedImage ? '#22c55e' : '#8b8f96',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = selectedImage ? '#22c55e' : '#fff'
              if (!selectedImage) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = selectedImage ? '#22c55e' : '#8b8f96'
              if (!selectedImage) {
                e.currentTarget.style.background = 'none'
              }
            }}
            title="上传图片"
          >
            {selectedImage ? '📷' : '+'}
          </button>

          {/* 输入框 */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedImage ? '描述这张图片...' : placeholder}
            style={{
              background: 'none',
              border: 'none',
              color: value ? '#fff' : '#8b8f96',
              fontSize: '1rem',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 300,
              outline: 'none',
              width: '100%',
              height: '100%',
            }}
          />

          {/* 右边按钮 */}
          <button
            type="button"
            onClick={onSubmit}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8b8f96',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#8b8f96'
              e.currentTarget.style.background = 'none'
            }}
          >
            ▶
          </button>
        </div>

        {/* 边框渐变层 */}
        <div
          style={{
            ...gradientStyle,
            position: 'absolute',
            inset: '-4px',
            borderRadius: '150px',
            filter: 'blur(5px)',
            zIndex: 1,
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  )
}

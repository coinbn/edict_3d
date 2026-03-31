import { useState, useEffect } from 'react'
import { useStore } from '../../stores/useStore'

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const loading = useStore(s => s.loading)
  
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setVisible(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [loading])
  
  if (!visible) return null
  
  return (
    <div className={`absolute inset-0 bg-space flex items-center justify-center z-50 transition-opacity duration-1000 ${loading ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center">
        {/* Loading 动画 */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 border-2 border-neon-blue/30 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-transparent border-t-neon-blue rounded-full animate-spin"></div>
          <div className="absolute inset-4 border-2 border-transparent border-t-neon-purple rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
        
        {/* 文字 */}
        <h1 className="text-3xl font-display font-bold neon-blue mb-2">
          EDICT
        </h1>
        <p className="text-white/40 animate-pulse">
          加载中...
        </p>
      </div>
    </div>
  )
}

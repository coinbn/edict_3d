import { useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useStore } from './stores/useStore'
import Scene from './components/3d/Scene'
import Overlay from './components/ui/Overlay'
import LoadingScreen from './components/ui/LoadingScreen'

export default function App() {
  const { fetchAgents } = useStore()
  
  useEffect(() => {
    fetchAgents()
  }, [])
  
  return (
    <div className="w-full h-full relative" style={{ background: '#050508' }}>
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 5, 22], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          <Overlay />
        </div>
      </div>
      
      {/* Loading Screen */}
      <LoadingScreen />
    </div>
  )
}

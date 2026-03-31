import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { 
  Stars, 
  Float, 
  Text,
  Sparkles,
  OrbitControls,
  Html,
  Billboard
} from '@react-three/drei'
import * as THREE from 'three'

// 改进的逼真星球材质
function RealisticPlanet({ 
  color, 
  emissive,
  size = 1,
  intensity = 1,
  roughness = 0.8,
  metalness = 0.1,
  hasAtmosphere = true
}: { 
  color: string
  emissive: string
  size?: number
  intensity?: number
  roughness?: number
  metalness?: number
  hasAtmosphere?: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  
  // 生成程序化纹理
  const textures = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    // 基础颜色
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 512, 512)
    
    // 添加噪点纹理模拟表面
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const radius = Math.random() * 20 + 5
      const alpha = Math.random() * 0.3
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 添加裂纹/地形纹理
    ctx.strokeStyle = `rgba(0,0,0,0.1)`
    ctx.lineWidth = 2
    for (let i = 0; i < 20; i++) {
      ctx.beginPath()
      let x = Math.random() * 512
      let y = Math.random() * 512
      ctx.moveTo(x, y)
      for (let j = 0; j < 5; j++) {
        x += (Math.random() - 0.5) * 100
        y += (Math.random() - 0.5) * 100
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    
    return texture
  }, [color])
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y -= 0.001
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05
      glowRef.current.scale.setScalar(pulse)
    }
  })
  
  return (
    <group>
      {/* 核心球体 - 使用高细分几何体 */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <icosahedronGeometry args={[size * 0.8, 64]} />
        <meshStandardMaterial
          map={textures}
          color={color}
          emissive={emissive}
          emissiveIntensity={intensity * 0.3}
          roughness={roughness}
          metalness={metalness}
          bumpMap={textures}
          bumpScale={0.02}
        />
      </mesh>
      
      {/* 大气层散射效果 */}
      {hasAtmosphere && (
        <mesh ref={atmosphereRef}>
          <sphereGeometry args={[size * 0.95, 64, 64]} />
          <meshBasicMaterial
            color={emissive}
            transparent
            opacity={0.15 * intensity}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      
      {/* 内层光晕 */}
      <mesh>
        <sphereGeometry args={[size * 1.1, 32, 32]} />
        <meshBasicMaterial
          color={emissive}
          transparent
          opacity={0.08 * intensity}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* 外层光晕 */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.4, 32, 32]} />
        <meshBasicMaterial
          color={emissive}
          transparent
          opacity={0.04 * intensity}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* 光照 */}
      <pointLight color={emissive} intensity={intensity * 1.5} distance={size * 8} decay={2} />
    </group>
  )
}

// 改进的太阳 - 带日冕效果
function RealisticSun() {
  const coreRef = useRef<THREE.Mesh>(null)
  const coronaRef = useRef<THREE.Group>(null)
  const flareRef = useRef<THREE.Mesh>(null)
  
  // 生成太阳表面纹理
  const sunTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    // 基础渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#ff4400')
    gradient.addColorStop(0.5, '#ff6600')
    gradient.addColorStop(1, '#ff8800')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1024, 512)
    
    // 添加太阳黑子和表面细节
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 512
      const w = Math.random() * 100 + 20
      const h = Math.random() * 30 + 10
      
      ctx.fillStyle = `rgba(100,20,0,${Math.random() * 0.5 + 0.2})`
      ctx.fillRect(x, y, w, h)
    }
    
    // 添加耀斑效果
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 512
      const radius = Math.random() * 40 + 10
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
      grad.addColorStop(0, 'rgba(255,255,200,0.8)')
      grad.addColorStop(1, 'rgba(255,200,100,0)')
      
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
  }, [])
  
  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.003
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.y -= 0.001
      coronaRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
    if (flareRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1 + 
                    Math.sin(state.clock.elapsedTime * 3.5) * 0.05
      flareRef.current.scale.setScalar(scale)
    }
  })
  
  return (
    <group>
      {/* 核心 - 高细分球体 */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.2, 128]} />
        <meshStandardMaterial
          map={sunTexture}
          color="#ff4400"
          emissive="#ff2200"
          emissiveIntensity={2}
          emissiveMap={sunTexture}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>
      
      {/* 内层日冕 */}
      <mesh>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.3}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* 动态日冕 */}
      <group ref={coronaRef}>
        <mesh>
          <sphereGeometry args={[2.0, 32, 32]} />
          <meshBasicMaterial
            color="#ff8800"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      
      {/* 外层光晕 */}
      <mesh ref={flareRef}>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial
          color="#ffaa00"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* 最外层光晕 */}
      <mesh>
        <sphereGeometry args={[4.0, 32, 32]} />
        <meshBasicMaterial
          color="#ffcc00"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* 强烈的主光源 */}
      <pointLight color="#ff6600" intensity={5} distance={50} decay={1.5} />
      <pointLight color="#ff8800" intensity={2} distance={30} decay={2} position={[2, 2, 2]} />
    </group>
  )
}

// 小行星带
function AsteroidBelt() {
  const asteroids = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => ({
      id: i,
      distance: 12 + Math.random() * 4,
      size: 0.02 + Math.random() * 0.05,
      angle: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.03,
      color: ['#666', '#777', '#555', '#444'][Math.floor(Math.random() * 4)]
    }))
  }, [])
  
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const asteroid = asteroids[i]
        asteroid.angle += asteroid.speed * delta
        child.position.x = Math.cos(asteroid.angle) * asteroid.distance
        child.position.z = Math.sin(asteroid.angle) * asteroid.distance * 0.3
        child.position.y = Math.sin(asteroid.angle * 2) * 0.3
        child.rotation.x += delta * 0.5
        child.rotation.y += delta * 0.3
      })
    }
  })
  
  return (
    <group ref={groupRef}>
      {asteroids.map((asteroid) => (
        <mesh key={asteroid.id}>
          <dodecahedronGeometry args={[asteroid.size, 0]} />
          <meshStandardMaterial color={asteroid.color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// Agent 行星配置
const agentPlanets = [
  { id: 'taizi', label: '太子', emoji: '👑', color: '#ffd700', emissive: '#ffaa00', size: 0.9, distance: 8, speed: 0.12, roughness: 0.6, metalness: 0.4 },
  { id: 'zhongshu', label: '中书省', emoji: '✍️', color: '#00d4ff', emissive: '#0088cc', size: 0.7, distance: 6, speed: 0.2, roughness: 0.4, metalness: 0.7 },
  { id: 'shangshu', label: '尚书省', emoji: '👑', color: '#ffd93d', emissive: '#cc9900', size: 0.75, distance: 6.5, speed: 0.18, roughness: 0.5, metalness: 0.5 },
  { id: 'bingbu', label: '兵部', emoji: '⚔️', color: '#ff6b6b', emissive: '#cc4444', size: 0.65, distance: 5, speed: 0.25, roughness: 0.7, metalness: 0.3 },
  { id: 'gongbu', label: '工部', emoji: '🔧', color: '#6bcb77', emissive: '#44aa55', size: 0.6, distance: 5.5, speed: 0.22, roughness: 0.8, metalness: 0.2 },
  { id: 'hubu', label: '户部', emoji: '💰', color: '#4d96ff', emissive: '#3366cc', size: 0.7, distance: 6.8, speed: 0.16, roughness: 0.3, metalness: 0.8 },
  { id: 'xingbu', label: '刑部', emoji: '⚖️', color: '#ff85c0', emissive: '#cc66aa', size: 0.6, distance: 6.2, speed: 0.19, roughness: 0.6, metalness: 0.4 },
  { id: 'libu', label: '礼部', emoji: '📜', color: '#a855f7', emissive: '#8833cc', size: 0.65, distance: 5.3, speed: 0.23, roughness: 0.5, metalness: 0.5 },
  { id: 'menxia', label: '门下省', emoji: '👁️', color: '#00ffcc', emissive: '#00aa88', size: 0.55, distance: 7.2, speed: 0.14, roughness: 0.4, metalness: 0.6 },
]

// 改进的行星组件
function Planet({ config }: { config: typeof agentPlanets[0] }) {
  const groupRef = useRef<THREE.Group>(null)
  const orbitRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  
  const angleRef = useRef(Math.random() * Math.PI * 2)
  
  useFrame((state, delta) => {
    angleRef.current += config.speed * delta
    
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * config.distance
      groupRef.current.position.z = Math.sin(angleRef.current) * config.distance * 0.4
      groupRef.current.position.y = Math.sin(angleRef.current * 0.5) * 0.8
    }
  })
  
  return (
    <group>
      {/* 轨道线 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[config.distance, 0.012, 16, 128]} />
        <meshBasicMaterial color={config.color} transparent opacity={0.12} />
      </mesh>
      
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.3}>
        <group 
          ref={groupRef}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <RealisticPlanet 
            color={config.color}
            emissive={config.emissive}
            size={config.size}
            intensity={hovered ? 1.8 : 1}
            roughness={config.roughness}
            metalness={config.metalness}
          />
          
          {/* 标签 */}
          <Text
            position={[0, -config.size - 0.7, 0]}
            fontSize={0.28}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {config.emoji} {config.label}
          </Text>
        </group>
      </Float>
    </group>
  )
}

// 改进的背景星星
function RealisticStars() {
  return (
    <>
      {/* 远景星星 */}
      <Stars 
        radius={200} 
        depth={100} 
        count={15000} 
        factor={6} 
        saturation={0.2} 
        fade 
        speed={0.2} 
      />
      
      {/* 近景大星星 */}
      <Stars 
        radius={80} 
        depth={30} 
        count={200} 
        factor={2} 
        saturation={0.8} 
        fade 
        speed={0.1} 
      />
    </>
  )
}

// 改进的网格地面
function GridFloor() {
  const gridRef = useRef<THREE.Mesh>(null)
  const circleRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (gridRef.current) {
      const material = gridRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.05 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02
    }
    if (circleRef.current) {
      const material = circleRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 0.3) * 0.03
    }
  })
  
  return (
    <group position={[0, -8, 0]}>
      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 150, 75, 75]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          wireframe 
          transparent 
          opacity={0.05}
        />
      </mesh>
      
      <mesh ref={circleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <circleGeometry args={[20, 64]} />
        <meshBasicMaterial 
          color="#ff6600" 
          transparent 
          opacity={0.1}
        />
      </mesh>
    </group>
  )
}

// 主场景
export default function Scene() {
  return (
    <>
      <color attach="background" args={['#000003']} />
      <fog attach="fog" args={['#000008', 15, 60]} />
      
      {/* 环境光 */}
      <ambientLight intensity={0.05} />
      
      {/* 主光源（太阳方向） */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.5} 
        color="#ffaa66"
        castShadow
      />
      
      {/* 补充光源 */}
      <pointLight position={[20, 20, 20]} intensity={0.3} color="#00d4ff" distance={50} />
      <pointLight position={[-20, -10, -20]} intensity={0.2} color="#a855f7" distance={50} />
      
      {/* 星星背景 */}
      <RealisticStars />
      
      {/* 粒子效果 */}
      <Sparkles
        count={800}
        scale={40}
        size={2}
        speed={0.2}
        opacity={0.5}
        color="#00d4ff"
      />
      
      {/* 网格地面 */}
      <GridFloor />
      
      {/* 小行星带 */}
      <AsteroidBelt />
      
      {/* 太阳 */}
      <RealisticSun />
      
      {/* 行星 */}
      {agentPlanets.map((planet) => (
        <Planet key={planet.id} config={planet} />
      ))}
      
      {/* 轨道控制器 */}
      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        minDistance={8}
        maxDistance={50}
        autoRotate={true}
        autoRotateSpeed={0.1}
      />
    </>
  )
}

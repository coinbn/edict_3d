import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Node class from ca.html
class Node {
  position: THREE.Vector3
  connections: { node: Node; strength: number }[] = []
  level: number = 0
  type: number = 0
  size: number = 1

  constructor(position: THREE.Vector3, level = 0, type = 0) {
    this.position = position
    this.connections = []
    this.level = level
    this.type = type
    this.size = type === 0 ? 0.8 + Math.random() * 0.6 : 0.5 + Math.random() * 0.5
  }

  addConnection(node: Node, strength = 1.0) {
    if (!this.isConnectedTo(node)) {
      this.connections.push({ node, strength })
      node.connections.push({ node: this, strength })
    }
  }

  isConnectedTo(node: Node) {
    return this.connections.some(conn => conn.node === node)
  }
}

// Generate crystalline sphere network
function generateCrystallineSphere(): Node[] {
  const nodes: Node[] = []
  const rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0)
  rootNode.size = 2.0
  nodes.push(rootNode)

  const layers = 4
  const goldenRatio = (1 + Math.sqrt(5)) / 2

  for (let layer = 1; layer <= layers; layer++) {
    const radius = layer * 3.5
    const numPoints = Math.floor(layer * 10)

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / numPoints)
      const theta = 2 * Math.PI * i / goldenRatio
      const pos = new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi)
      )
      const isLeaf = layer === layers || Math.random() < 0.3
      const node = new Node(pos, layer, isLeaf ? 1 : 0)
      nodes.push(node)

      if (layer > 1) {
        const prevLayerNodes = nodes.filter(n => n.level === layer - 1 && n !== rootNode)
        prevLayerNodes.sort((a, b) => pos.distanceTo(a.position) - pos.distanceTo(b.position))
        for (let j = 0; j < Math.min(2, prevLayerNodes.length); j++) {
          node.addConnection(prevLayerNodes[j], 0.7)
        }
      } else {
        rootNode.addConnection(node, 0.8)
      }
    }

    // Connect nearby nodes in same layer
    const layerNodes = nodes.filter(n => n.level === layer && n !== rootNode)
    for (let i = 0; i < layerNodes.length; i++) {
      const node = layerNodes[i]
      const nearby = layerNodes.filter(n => n !== node)
        .sort((a, b) => node.position.distanceTo(a.position) - node.position.distanceTo(b.position))
        .slice(0, 4)
      for (const nearNode of nearby) {
        const dist = node.position.distanceTo(nearNode.position)
        if (dist < radius * 0.7 && !node.isConnectedTo(nearNode)) {
          node.addConnection(nearNode, 0.5)
        }
      }
    }
  }

  return nodes
}

// Color palettes
const colorPalettes = [
  [new THREE.Color(0x667eea), new THREE.Color(0x764ba2), new THREE.Color(0xf093fb)],
  [new THREE.Color(0xf857a6), new THREE.Color(0xff5858), new THREE.Color(0xfeca57)],
  [new THREE.Color(0x4facfe), new THREE.Color(0x00f2fe), new THREE.Color(0x43e97b)],
]

export default function NeuralScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    const palette = colorPalettes[0]

    console.log('NeuralScene: Starting...')

    // Scene
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x000000, 0.003)

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.set(0, 5, 22)

    console.log('NeuralScene: Creating renderer...')

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000)
    container.appendChild(renderer.domElement)

    console.log('NeuralScene: Renderer created')

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 8
    controls.maxDistance = 45
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.8
    controls.enablePan = false

    // Starfield
    console.log('NeuralScene: Creating stars...')
    const starGeo = new THREE.BufferGeometry()
    const starPositions: number[] = []
    for (let i = 0; i < 5000; i++) {
      const r = 50 + Math.random() * 80
      const phi = Math.acos(Math.random() * 2 - 1)
      const theta = Math.random() * Math.PI * 2
      starPositions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    const starMat = new THREE.PointsMaterial({ size: 0.15, color: 0xffffff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)
    console.log('NeuralScene: Stars created')

    // Generate network
    console.log('NeuralScene: Generating network...')
    const nodes = generateCrystallineSphere()
    console.log('NeuralScene: Generated', nodes.length, 'nodes')

    // Create nodes mesh
    const nodePositions: number[] = []
    const nodeColors: number[] = []

    nodes.forEach(node => {
      nodePositions.push(node.position.x, node.position.y, node.position.z)
      const colorIndex = Math.min(node.level, palette.length - 1)
      const color = palette[colorIndex].clone()
      color.offsetHSL(Math.random() * 0.03 - 0.015, Math.random() * 0.08 - 0.04, Math.random() * 0.08 - 0.04)
      nodeColors.push(color.r, color.g, color.b)
    })

    const nodesGeo = new THREE.BufferGeometry()
    nodesGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3))
    nodesGeo.setAttribute('color', new THREE.Float32BufferAttribute(nodeColors, 3))

    const nodesMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const nodesMesh = new THREE.Points(nodesGeo, nodesMat)
    scene.add(nodesMesh)
    console.log('NeuralScene: Nodes mesh created')

    // Create connections
    const connPositions: number[] = []
    const connColors: number[] = []
    const processed = new Set<string>()

    nodes.forEach((node, idx) => {
      node.connections.forEach(conn => {
        const connIdx = nodes.indexOf(conn.node)
        const key = [Math.min(idx, connIdx), Math.max(idx, connIdx)].join('-')
        if (!processed.has(key) && connIdx >= 0) {
          processed.add(key)
          connPositions.push(
            node.position.x, node.position.y, node.position.z,
            conn.node.position.x, conn.node.position.y, conn.node.position.z
          )
          const colorIndex = Math.min(Math.floor((node.level + conn.node.level) / 2), palette.length - 1)
          const color = palette[colorIndex].clone()
          connColors.push(color.r, color.g, color.b, color.r, color.g, color.b)
        }
      })
    })

    const connGeo = new THREE.BufferGeometry()
    connGeo.setAttribute('position', new THREE.Float32BufferAttribute(connPositions, 3))
    connGeo.setAttribute('color', new THREE.Float32BufferAttribute(connColors, 3))

    const connMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const connMesh = new THREE.LineSegments(connGeo, connMat)
    scene.add(connMesh)
    console.log('NeuralScene: Connections mesh created')

    // Central core
    const coreGeo = new THREE.IcosahedronGeometry(1.5, 2)
    const coreMat = new THREE.MeshStandardMaterial({
      color: palette[0],
      emissive: palette[0],
      emissiveIntensity: 2,
      roughness: 0.2,
      metalness: 0.8
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    scene.add(core)

    // Core glow
    const glowGeo = new THREE.SphereGeometry(2.2, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: palette[0],
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    scene.add(glow)

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(palette[0], 2, 25)
    pointLight1.position.set(10, 10, 10)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(palette[1], 1, 25)
    pointLight2.position.set(-10, -10, -10)
    scene.add(pointLight2)

    console.log('NeuralScene: Setup complete, starting animation')

    // Animation
    const clock = new THREE.Clock()

    function animate() {
      requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Pulse effect
      nodesMat.size = 0.5 + Math.sin(t * 3) * 0.15

      // Rotate
      nodesMesh.rotation.y = Math.sin(t * 0.08) * 0.08
      connMesh.rotation.y = Math.sin(t * 0.08) * 0.08

      // Core
      core.rotation.y += 0.012
      core.rotation.x += 0.008
      glow.scale.setScalar(1 + Math.sin(t * 1.5) * 0.1)

      stars.rotation.y += 0.0003
      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // Resize
    function onResize() {
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0" style={{ background: '#000000' }} />
}

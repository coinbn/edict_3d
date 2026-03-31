import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// Color palettes matching ca.html
const colorPalettes = [
  [new THREE.Color(0x667eea), new THREE.Color(0x764ba2), new THREE.Color(0xf093fb), new THREE.Color(0x9d50bb), new THREE.Color(0x6e48aa)],
  [new THREE.Color(0xf857a6), new THREE.Color(0xff5858), new THREE.Color(0xfeca57), new THREE.Color(0xff6348), new THREE.Color(0xff9068)],
  [new THREE.Color(0x4facfe), new THREE.Color(0x00f2fe), new THREE.Color(0x43e97b), new THREE.Color(0x38f9d7), new THREE.Color(0x4484ce)]
]

// Simplex noise functions for GLSL
const noiseFunctions = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`

// Node shader material
const nodeVertexShader = `${noiseFunctions}
attribute float nodeSize;
attribute float nodeType;
attribute vec3 nodeColor;
attribute float distanceFromRoot;

uniform float uTime;
uniform vec3 uPulsePositions[3];
uniform float uPulseTimes[3];
uniform float uPulseSpeed;
uniform float uBaseNodeSize;

varying vec3 vColor;
varying float vNodeType;
varying vec3 vPosition;
varying float vPulseIntensity;
varying float vDistanceFromRoot;
varying float vGlow;
varying float vTwinkle;

float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
  if (pulseTime < 0.0) return 0.0;
  float timeSinceClick = uTime - pulseTime;
  if (timeSinceClick < 0.0 || timeSinceClick > 4.0) return 0.0;
  float pulseRadius = timeSinceClick * uPulseSpeed;
  float distToClick = distance(worldPos, pulsePos);
  float pulseThickness = 3.0;
  float waveProximity = abs(distToClick - pulseRadius);
  return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(4.0, 0.0, timeSinceClick);
}

void main() {
  vNodeType = nodeType;
  vColor = nodeColor;
  vDistanceFromRoot = distanceFromRoot;
  vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  vPosition = worldPos;
  
  float totalPulseIntensity = 0.0;
  for (int i = 0; i < 3; i++) {
    totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
  }
  vPulseIntensity = min(totalPulseIntensity, 1.0);
  
  // Enhanced breathing and twinkling
  float breathe = sin(uTime * 0.7 + distanceFromRoot * 0.15) * 0.15 + 0.85;
  float twinkle = sin(uTime * 3.0 + position.x * 10.0 + position.y * 8.0) * 0.5 + 0.5;
  vTwinkle = twinkle;
  
  float baseSize = nodeSize * breathe * (0.8 + twinkle * 0.4);
  float pulseSize = baseSize * (1.0 + vPulseIntensity * 2.5);
  vGlow = 0.5 + 0.5 * sin(uTime * 0.5 + distanceFromRoot * 0.2);
  
  vec3 modifiedPosition = position;
  if (nodeType > 0.5) {
    float noise = snoise(position * 0.08 + uTime * 0.08);
    modifiedPosition += normal * noise * 0.15;
  }
  
  vec4 mvPosition = modelViewMatrix * vec4(modifiedPosition, 1.0);
  gl_PointSize = pulseSize * uBaseNodeSize * (1000.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}`

const nodeFragmentShader = `
uniform float uTime;
uniform vec3 uPulseColors[3];

varying vec3 vColor;
varying float vNodeType;
varying vec3 vPosition;
varying float vPulseIntensity;
varying float vDistanceFromRoot;
varying float vGlow;
varying float vTwinkle;

void main() {
  vec2 center = 2.0 * gl_PointCoord - 1.0;
  float dist = length(center);
  if (dist > 1.0) discard;
  
  float glow1 = 1.0 - smoothstep(0.0, 0.5, dist);
  float glow2 = 1.0 - smoothstep(0.0, 1.0, dist);
  float glowStrength = pow(glow1, 1.2) + glow2 * 0.3;
  
  // Enhanced twinkling effect
  float twinkleIntensity = vTwinkle * 0.4 + 0.6;
  float breatheColor = 0.9 + 0.1 * sin(uTime * 0.6 + vDistanceFromRoot * 0.25);
  vec3 baseColor = vColor * breatheColor * twinkleIntensity;
  vec3 finalColor = baseColor;
  
  if (vPulseIntensity > 0.0) {
    vec3 pulseColor = mix(vec3(1.0), uPulseColors[0], 0.4);
    finalColor = mix(baseColor, pulseColor, vPulseIntensity * 0.8);
    finalColor *= (1.0 + vPulseIntensity * 1.2);
    glowStrength *= (1.0 + vPulseIntensity);
  }
  
  float coreBrightness = smoothstep(0.4, 0.0, dist);
  finalColor += vec3(1.0) * coreBrightness * 0.3;
  
  // Add twinkle to glow
  glowStrength *= (0.7 + vTwinkle * 0.6);
  
  float alpha = glowStrength * (0.95 - 0.3 * dist);
  
  float camDistance = length(vPosition - cameraPosition);
  float distanceFade = smoothstep(100.0, 15.0, camDistance);
  
  if (vNodeType > 0.5) {
    finalColor *= 1.1;
    alpha *= 0.9;
  }
  
  finalColor *= (1.0 + vGlow * 0.1);
  gl_FragColor = vec4(finalColor, alpha * distanceFade);
}`

// Connection shader material
const connectionVertexShader = `${noiseFunctions}
attribute vec3 startPoint;
attribute vec3 endPoint;
attribute float connectionStrength;
attribute float pathIndex;
attribute vec3 connectionColor;

uniform float uTime;
uniform vec3 uPulsePositions[3];
uniform float uPulseTimes[3];
uniform float uPulseSpeed;

varying vec3 vColor;
varying float vConnectionStrength;
varying float vPulseIntensity;
varying float vPathPosition;
varying float vDistanceFromCamera;

float getPulseIntensity(vec3 worldPos, vec3 pulsePos, float pulseTime) {
  if (pulseTime < 0.0) return 0.0;
  float timeSinceClick = uTime - pulseTime;
  if (timeSinceClick < 0.0 || timeSinceClick > 4.0) return 0.0;
  
  float pulseRadius = timeSinceClick * uPulseSpeed;
  float distToClick = distance(worldPos, pulsePos);
  float pulseThickness = 3.0;
  float waveProximity = abs(distToClick - pulseRadius);
  
  return smoothstep(pulseThickness, 0.0, waveProximity) * smoothstep(4.0, 0.0, timeSinceClick);
}

void main() {
  float t = position.x;
  vPathPosition = t;
  
  vec3 midPoint = mix(startPoint, endPoint, 0.5);
  float pathOffset = sin(t * 3.14159) * 0.15;
  vec3 perpendicular = normalize(cross(normalize(endPoint - startPoint), vec3(0.0, 1.0, 0.0)));
  if (length(perpendicular) < 0.1) perpendicular = vec3(1.0, 0.0, 0.0);
  midPoint += perpendicular * pathOffset;
  
  vec3 p0 = mix(startPoint, midPoint, t);
  vec3 p1 = mix(midPoint, endPoint, t);
  vec3 finalPos = mix(p0, p1, t);
  
  float noiseTime = uTime * 0.15;
  float noise = snoise(vec3(pathIndex * 0.08, t * 0.6, noiseTime));
  finalPos += perpendicular * noise * 0.12;
  
  vec3 worldPos = (modelMatrix * vec4(finalPos, 1.0)).xyz;
  
  float totalPulseIntensity = 0.0;
  for (int i = 0; i < 3; i++) {
    totalPulseIntensity += getPulseIntensity(worldPos, uPulsePositions[i], uPulseTimes[i]);
  }
  vPulseIntensity = min(totalPulseIntensity, 1.0);
  
  vColor = connectionColor;
  vConnectionStrength = connectionStrength;
  vDistanceFromCamera = length(worldPos - cameraPosition);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
}`

const connectionFragmentShader = `
uniform float uTime;
uniform vec3 uPulseColors[3];

varying vec3 vColor;
varying float vConnectionStrength;
varying float vPulseIntensity;
varying float vPathPosition;
varying float vDistanceFromCamera;

void main() {
  float flowPattern1 = sin(vPathPosition * 25.0 - uTime * 4.0) * 0.5 + 0.5;
  float flowPattern2 = sin(vPathPosition * 15.0 - uTime * 2.5 + 1.57) * 0.5 + 0.5;
  float combinedFlow = (flowPattern1 + flowPattern2 * 0.5) / 1.5;
  
  vec3 baseColor = vColor * (0.8 + 0.2 * sin(uTime * 0.6 + vPathPosition * 12.0));
  float flowIntensity = 0.4 * combinedFlow * vConnectionStrength;
  vec3 finalColor = baseColor;
  
  if (vPulseIntensity > 0.0) {
    vec3 pulseColor = mix(vec3(1.0), uPulseColors[0], 0.3);
    finalColor = mix(baseColor, pulseColor * 1.2, vPulseIntensity * 0.7);
    flowIntensity += vPulseIntensity * 0.8;
  }
  
  finalColor *= (0.7 + flowIntensity + vConnectionStrength * 0.5);
  
  float baseAlpha = 0.7 * vConnectionStrength;
  float flowAlpha = combinedFlow * 0.3;
  float alpha = baseAlpha + flowAlpha;
  alpha = mix(alpha, min(1.0, alpha * 2.5), vPulseIntensity);
  
  float distanceFade = smoothstep(100.0, 15.0, vDistanceFromCamera);
  gl_FragColor = vec4(finalColor, alpha * distanceFade);
}`

// Starfield shader
const starVertexShader = `
attribute float size;
attribute vec3 color;
varying vec3 vColor;
uniform float uTime;

void main() {
  vColor = color;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float twinkle = sin(uTime * 2.0 + position.x * 100.0) * 0.3 + 0.7;
  gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`

const starFragmentShader = `
varying vec3 vColor;
void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  if (dist > 0.5) discard;
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  gl_FragColor = vec4(vColor, alpha * 0.8);
}
`

class Node {
  position: THREE.Vector3
  connections: { node: Node; strength: number }[]
  level: number
  type: number
  size: number
  distanceFromRoot: number

  constructor(position: THREE.Vector3, level = 0, type = 0) {
    this.position = position
    this.connections = []
    this.level = level
    this.type = type
    this.size = type === 0 ? THREE.MathUtils.randFloat(0.8, 1.4) : THREE.MathUtils.randFloat(0.5, 1.0)
    this.distanceFromRoot = 0
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

function generateNeuralNetwork(formationIndex = 0, densityFactor = 1.0) {
  const nodes: Node[] = []
  let rootNode: Node

  function generateCrystallineSphere() {
    rootNode = new Node(new THREE.Vector3(0, 0, 0), 0, 0)
    rootNode.size = 2.0
    nodes.push(rootNode)

    const layers = 5
    const goldenRatio = (1 + Math.sqrt(5)) / 2

    for (let layer = 1; layer <= layers; layer++) {
      const radius = layer * 3
      const numPoints = Math.floor(layer * 12 * densityFactor)

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
        node.distanceFromRoot = radius
        nodes.push(node)

        if (layer > 1) {
          const prevLayerNodes = nodes.filter(n => n.level === layer - 1 && n !== rootNode)
          prevLayerNodes.sort((a, b) => pos.distanceTo(a.position) - pos.distanceTo(b.position))
          for (let j = 0; j < Math.min(3, prevLayerNodes.length); j++) {
            const dist = pos.distanceTo(prevLayerNodes[j].position)
            const strength = 1.0 - (dist / (radius * 2))
            node.addConnection(prevLayerNodes[j], Math.max(0.3, strength))
          }
        } else {
          rootNode.addConnection(node, 0.9)
        }
      }

      const layerNodes = nodes.filter(n => n.level === layer && n !== rootNode)
      for (let i = 0; i < layerNodes.length; i++) {
        const node = layerNodes[i]
        const nearby = layerNodes
          .filter(n => n !== node)
          .sort((a, b) => node.position.distanceTo(a.position) - node.position.distanceTo(b.position))
          .slice(0, 5)
        for (const nearNode of nearby) {
          const dist = node.position.distanceTo(nearNode.position)
          if (dist < radius * 0.8 && !node.isConnectedTo(nearNode)) {
            node.addConnection(nearNode, 0.6)
          }
        }
      }
    }

    const outerNodes = nodes.filter(n => n.level >= 3)
    for (let i = 0; i < Math.min(20, outerNodes.length); i++) {
      const n1 = outerNodes[Math.floor(Math.random() * outerNodes.length)]
      const n2 = outerNodes[Math.floor(Math.random() * outerNodes.length)]
      if (n1 !== n2 && !n1.isConnectedTo(n2) && Math.abs(n1.level - n2.level) > 1) {
        n1.addConnection(n2, 0.4)
      }
    }
  }

  generateCrystallineSphere()
  return { nodes, rootNode }
}

function StarField() {
  const ref = useRef<THREE.Points>(null)
  const { scene } = useThree()

  const { geometry, material } = useMemo(() => {
    const count = 8000
    const positions: number[] = []
    const colors: number[] = []
    const sizes: number[] = []

    for (let i = 0; i < count; i++) {
      const r = THREE.MathUtils.randFloat(50, 150)
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2))
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2)
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )

      const colorChoice = Math.random()
      if (colorChoice < 0.7) {
        colors.push(1, 1, 1)
      } else if (colorChoice < 0.85) {
        colors.push(0.7, 0.8, 1)
      } else {
        colors.push(1, 0.9, 0.8)
      }
      sizes.push(THREE.MathUtils.randFloat(0.1, 0.3))
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    return { geometry: geo, material: mat }
  }, [])

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.0002
      ;(ref.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return <points ref={ref} geometry={geometry} material={material} />
}

function NeuralNetwork() {
  const nodesRef = useRef<THREE.Points>(null)
  const connectionsRef = useRef<THREE.LineSegments>(null)
  const [activePaletteIndex, setActivePaletteIndex] = useState(0)
  const lastPulseIndex = useRef(0)
  const { camera, scene } = useThree()

  const { networkData, nodesGeometry, connectionsGeometry, nodesMaterial, connectionsMaterial } = useMemo(() => {
    const network = generateNeuralNetwork(0, 1.0)
    const palette = colorPalettes[activePaletteIndex]

    // Nodes geometry
    const nodePositions: number[] = []
    const nodeTypes: number[] = []
    const nodeSizes: number[] = []
    const nodeColors: number[] = []
    const distancesFromRoot: number[] = []

    network.nodes.forEach((node) => {
      nodePositions.push(node.position.x, node.position.y, node.position.z)
      nodeTypes.push(node.type)
      nodeSizes.push(node.size)
      distancesFromRoot.push(node.distanceFromRoot)

      const colorIndex = Math.min(node.level, palette.length - 1)
      const baseColor = palette[colorIndex % palette.length].clone()
      baseColor.offsetHSL(
        THREE.MathUtils.randFloatSpread(0.03),
        THREE.MathUtils.randFloatSpread(0.08),
        THREE.MathUtils.randFloatSpread(0.08)
      )
      nodeColors.push(baseColor.r, baseColor.g, baseColor.b)
    })

    const nodesGeo = new THREE.BufferGeometry()
    nodesGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3))
    nodesGeo.setAttribute('nodeType', new THREE.Float32BufferAttribute(nodeTypes, 1))
    nodesGeo.setAttribute('nodeSize', new THREE.Float32BufferAttribute(nodeSizes, 1))
    nodesGeo.setAttribute('nodeColor', new THREE.Float32BufferAttribute(nodeColors, 3))
    nodesGeo.setAttribute('distanceFromRoot', new THREE.Float32BufferAttribute(distancesFromRoot, 1))

    const pulseUniforms = {
      uTime: { value: 0.0 },
      uPulsePositions: { value: [new THREE.Vector3(1e3, 1e3, 1e3), new THREE.Vector3(1e3, 1e3, 1e3), new THREE.Vector3(1e3, 1e3, 1e3)] },
      uPulseTimes: { value: [-1e3, -1e3, -1e3] },
      uPulseColors: { value: [new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1)] },
      uPulseSpeed: { value: 18.0 },
      uBaseNodeSize: { value: 0.6 }
    }

    const nodesMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(pulseUniforms),
      vertexShader: nodeVertexShader,
      fragmentShader: nodeFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    // Connections geometry
    const connectionColors: number[] = []
    const connectionStrengths: number[] = []
    const connectionPositions: number[] = []
    const startPoints: number[] = []
    const endPoints: number[] = []
    const pathIndices: number[] = []
    const processedConnections = new Set<string>()
    let pathIndex = 0

    network.nodes.forEach((node, nodeIndex) => {
      node.connections.forEach(connection => {
        const connectedNode = connection.node
        const connectedIndex = network.nodes.indexOf(connectedNode)
        if (connectedIndex === -1) return

        const key = `${Math.min(nodeIndex, connectedIndex)}-${Math.max(nodeIndex, connectedIndex)}`
        if (!processedConnections.has(key)) {
          processedConnections.add(key)
          const startPoint = node.position
          const endPoint = connectedNode.position
          const numSegments = 20

          for (let i = 0; i < numSegments; i++) {
            const t = i / (numSegments - 1)
            connectionPositions.push(t, 0, 0)
            startPoints.push(startPoint.x, startPoint.y, startPoint.z)
            endPoints.push(endPoint.x, endPoint.y, endPoint.z)
            pathIndices.push(pathIndex)
            connectionStrengths.push(connection.strength)

            const avgLevel = Math.min(Math.floor((node.level + connectedNode.level) / 2), palette.length - 1)
            const baseColor = palette[avgLevel % palette.length].clone()
            baseColor.offsetHSL(
              THREE.MathUtils.randFloatSpread(0.03),
              THREE.MathUtils.randFloatSpread(0.08),
              THREE.MathUtils.randFloatSpread(0.08)
            )
            connectionColors.push(baseColor.r, baseColor.g, baseColor.b)
          }
          pathIndex++
        }
      })
    })

    const connectionsGeo = new THREE.BufferGeometry()
    connectionsGeo.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3))
    connectionsGeo.setAttribute('startPoint', new THREE.Float32BufferAttribute(startPoints, 3))
    connectionsGeo.setAttribute('endPoint', new THREE.Float32BufferAttribute(endPoints, 3))
    connectionsGeo.setAttribute('connectionStrength', new THREE.Float32BufferAttribute(connectionStrengths, 1))
    connectionsGeo.setAttribute('connectionColor', new THREE.Float32BufferAttribute(connectionColors, 3))
    connectionsGeo.setAttribute('pathIndex', new THREE.Float32BufferAttribute(pathIndices, 1))

    const connectionsMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(pulseUniforms),
      vertexShader: connectionVertexShader,
      fragmentShader: connectionFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    palette.forEach((color, i) => {
      if (i < 3) {
        connectionsMat.uniforms.uPulseColors.value[i].copy(color)
        nodesMat.uniforms.uPulseColors.value[i].copy(color)
      }
    })

    return {
      networkData: network,
      nodesGeometry: nodesGeo,
      connectionsGeometry: connectionsGeo,
      nodesMaterial: nodesMat,
      connectionsMaterial: connectionsMat
    }
  }, [activePaletteIndex])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (nodesRef.current) {
      ;(nodesRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t
      nodesRef.current.rotation.y = Math.sin(t * 0.04) * 0.05
    }
    if (connectionsRef.current) {
      ;(connectionsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t
      connectionsRef.current.rotation.y = Math.sin(t * 0.04) * 0.05
    }
  })

  // Handle click for pulse effect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!nodesRef.current || !connectionsRef.current) return

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(pointer, camera)
      const interactionPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
      const interactionPoint = new THREE.Vector3()
      interactionPlane.normal.copy(camera.position).normalize()
      interactionPlane.constant = -interactionPlane.normal.dot(camera.position) + camera.position.length() * 0.5

      if (raycaster.ray.intersectPlane(interactionPlane, interactionPoint)) {
        triggerPulse(interactionPoint)
      }
    }

    // Auto trigger pulse every 10 seconds
    const autoPulseInterval = setInterval(() => {
      if (!nodesRef.current || !connectionsRef.current) return
      
      // Random position in the network area
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 10
      const randomPoint = new THREE.Vector3(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 10,
        Math.sin(angle) * radius
      )
      triggerPulse(randomPoint)
    }, 10000)

    const triggerPulse = (point: THREE.Vector3) => {
      if (!nodesRef.current || !connectionsRef.current) return
      
      const time = performance.now() / 1000
      lastPulseIndex.current = (lastPulseIndex.current + 1) % 3

      const nodesMat = nodesRef.current.material as THREE.ShaderMaterial
      const connectionsMat = connectionsRef.current.material as THREE.ShaderMaterial

      nodesMat.uniforms.uPulsePositions.value[lastPulseIndex.current].copy(point)
      nodesMat.uniforms.uPulseTimes.value[lastPulseIndex.current] = time
      connectionsMat.uniforms.uPulsePositions.value[lastPulseIndex.current].copy(point)
      connectionsMat.uniforms.uPulseTimes.value[lastPulseIndex.current] = time

      const palette = colorPalettes[activePaletteIndex]
      const randomColor = palette[Math.floor(Math.random() * palette.length)]
      nodesMat.uniforms.uPulseColors.value[lastPulseIndex.current].copy(randomColor)
      connectionsMat.uniforms.uPulseColors.value[lastPulseIndex.current].copy(randomColor)
    }

    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('click', handleClick)
      clearInterval(autoPulseInterval)
    }
  }, [camera, activePaletteIndex])

  return (
    <group>
      <points ref={nodesRef} geometry={nodesGeometry} material={nodesMaterial} />
      <lineSegments ref={connectionsRef} geometry={connectionsGeometry} material={connectionsMaterial} />
    </group>
  )
}

export default function Scene() {
  return (
    <>
      <color attach="background" args={['#050508']} />
      <fog attach="fog" args={['#000000', 0.002]} />

      <StarField />
      <NeuralNetwork />

      <ambientLight intensity={0.1} />

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={8}
        maxDistance={80}
        autoRotate={true}
        autoRotateSpeed={0.2}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.6}
      />

      <EffectComposer>
        <Bloom intensity={2.5} luminanceThreshold={0.3} luminanceSmoothing={0.5} />
      </EffectComposer>
    </>
  )
}

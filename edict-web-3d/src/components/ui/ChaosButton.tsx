import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

// Vertex shader - pass through UV coordinates
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

// Fragment shader - converted from Metal shader
const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_tap;
  uniform float u_speed;
  uniform float u_amplitude;
  uniform float u_pulseMin;
  uniform float u_pulseMax;
  uniform float u_noiseType;

  // Hash-based noise (original)
  float hash(float n) {
    return fract(sin(n) * 753.5453123);
  }

  float noiseHash(vec2 x) {
    vec2 p = floor(x);
    vec2 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    float n = p.x + p.y * 157.0;
    return mix(
      mix(hash(n + 0.0), hash(n + 1.0), f.x),
      mix(hash(n + 157.0), hash(n + 158.0), f.x),
      f.y
    );
  }

  // Trigonometric noise (more periodic)
  float noiseTrig(vec2 p) {
    float x = p.x;
    float y = p.y;

    float n = sin(x * 1.0 + sin(y * 1.3)) * 0.5;
    n += sin(y * 1.0 + sin(x * 1.1)) * 0.5;
    n += sin((x + y) * 0.5) * 0.25;
    n += sin((x - y) * 0.7) * 0.25;

    return n * 0.5 + 0.5;
  }

  // Noise dispatcher
  float noise(vec2 p) {
    if (u_noiseType < 0.5) {
      return noiseHash(p);
    } else {
      return noiseTrig(p);
    }
  }

  // Fractional Brownian Motion
  float fbm(vec2 p, vec3 a) {
    float v = 0.0;
    v += noise(p * a.x) * 0.50;
    v += noise(p * a.y) * 1.50;
    v += noise(p * a.z) * 0.125 * 0.1;
    return v;
  }

  // Draw animated lines
  vec3 drawLines(vec2 uv, vec3 fbmOffset, vec3 color1, float secs) {
    float timeVal = secs * 0.1;
    vec3 finalColor = vec3(0.0);

    vec3 colorSets[4];
    colorSets[0] = vec3(0.7, 0.05, 1.0);
    colorSets[1] = vec3(1.0, 0.19, 0.0);
    colorSets[2] = vec3(0.0, 1.0, 0.3);
    colorSets[3] = vec3(0.0, 0.38, 1.0);

    // First pass - base lines
    for(int i = 0; i < 4; i++) {
      float indexAsFloat = float(i);
      float amp = u_amplitude + (indexAsFloat * 0.0);
      float period = 2.0 + (indexAsFloat + 2.0);
      float thickness = mix(0.4, 0.2, noise(uv * 2.0));

      float t = abs(1.0 / (sin(uv.y + fbm(uv + timeVal * period, fbmOffset)) * amp) * thickness);

      finalColor += t * colorSets[i];
    }

    // Second pass - secondary lines
    for(int i = 0; i < 4; i++) {
      float indexAsFloat = float(i);
      float amp = (u_amplitude * 0.5) + (indexAsFloat * 5.0);
      float period = 9.0 + (indexAsFloat + 2.0);
      float thickness = mix(0.1, 0.1, noise(uv * 12.0));

      float t = abs(1.0 / (sin(uv.y + fbm(uv + timeVal * period, fbmOffset)) * amp) * thickness);

      finalColor += t * colorSets[i] * color1;
    }

    return finalColor;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.x) * 1.0 - 1.0;
    uv *= 1.5;

    vec3 lineColor1 = vec3(1.0, 0.0, 0.5);
    vec3 lineColor2 = vec3(0.3, 0.5, 1.5);

    float spread = abs(u_tap);
    vec3 finalColor = vec3(0.0);

    float t = sin(u_time) * 0.5 + 0.5;
    float pulse = mix(u_pulseMin, u_pulseMax, t);

    finalColor = drawLines(uv, vec3(65.2, 40.0, 4.0), lineColor1, u_time * u_speed) * pulse;
    finalColor += drawLines(uv, vec3(5.0 * spread / 2.0, 2.1 * spread, 1.0), lineColor2, u_time * u_speed);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const config = {
  noiseType: 'trig',
  // Resting state
  restingSpeed: 0.35,
  restingAmplitude: 80,
  restingPulseMin: 0.05,
  restingPulseMax: 0.2,
  restingTap: 1.0,
  // Active state
  activeSpeed: 2.8,
  activeAmplitude: 10,
  activePulseMin: 0.05,
  activePulseMax: 0.4,
  activeTap: 1.0,
  // Transition
  activeDuration: 0.3,
  restingDuration: 0.5,
  activeEase: 'power2.out',
  restingEase: 'power2.out',
}

interface ChaosButtonProps {
  onClick?: () => void
  disabled?: boolean
  children?: React.ReactNode
  className?: string
}

export default function ChaosButton({ onClick, disabled, children, className = '' }: ChaosButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({})
  const animRef = useRef<{
    startTime: number
    lastTime: number
    phase: number
    currentSpeed: number
    currentAmplitude: number
    currentPulseMin: number
    currentPulseMax: number
    currentTap: number
  }>({
    startTime: Date.now(),
    lastTime: 0,
    phase: 0,
    currentSpeed: config.restingSpeed,
    currentAmplitude: config.restingAmplitude,
    currentPulseMin: config.restingPulseMin,
    currentPulseMax: config.restingPulseMax,
    currentTap: config.restingTap,
  })

  const compileShader = useCallback((gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    return shader
  }, [])

  const resize = useCallback(() => {
    const button = buttonRef.current
    const canvas = canvasRef.current
    const gl = glRef.current
    if (!button || !canvas || !gl) return

    const dpr = Math.min(window.devicePixelRatio, 2)
    const rect = button.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(uniformsRef.current.resolution, canvas.width, canvas.height)
  }, [])

  const activate = useCallback(() => {
    const s = animRef.current
    gsap.killTweensOf(s)
    gsap.to(s, {
      currentSpeed: config.activeSpeed,
      currentAmplitude: config.activeAmplitude,
      currentPulseMin: config.activePulseMin,
      currentPulseMax: config.activePulseMax,
      currentTap: config.activeTap,
      duration: config.activeDuration,
      ease: config.activeEase,
    })
  }, [])

  const deactivate = useCallback(() => {
    const s = animRef.current
    gsap.killTweensOf(s)
    gsap.to(s, {
      currentSpeed: config.restingSpeed,
      currentAmplitude: config.restingAmplitude,
      currentPulseMin: config.restingPulseMin,
      currentPulseMax: config.restingPulseMax,
      currentTap: config.restingTap,
      duration: config.restingDuration,
      ease: config.restingEase,
    })
  }, [])

  useEffect(() => {
    const button = buttonRef.current
    const canvas = canvasRef.current
    if (!button || !canvas) return

    const gl = canvas.getContext('webgl', { alpha: false, antialias: true })!
    glRef.current = gl

    // Compile shaders
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return

    // Create program
    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program))
      return
    }
    programRef.current = program
    gl.useProgram(program)

    // Set up geometry (fullscreen quad)
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    const positionLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    // Get uniform locations
    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      tap: gl.getUniformLocation(program, 'u_tap'),
      speed: gl.getUniformLocation(program, 'u_speed'),
      amplitude: gl.getUniformLocation(program, 'u_amplitude'),
      pulseMin: gl.getUniformLocation(program, 'u_pulseMin'),
      pulseMax: gl.getUniformLocation(program, 'u_pulseMax'),
      noiseType: gl.getUniformLocation(program, 'u_noiseType'),
    }

    // Initial resize
    resize()

    // Animation loop
    const animate = () => {
      const s = animRef.current
      const time = (Date.now() - s.startTime) / 1000
      const deltaTime = time - s.lastTime
      s.lastTime = time

      s.phase += deltaTime * s.currentSpeed
      if (s.phase > 1000) s.phase = s.phase % 1000

      gl.uniform1f(uniformsRef.current.time, s.phase)
      gl.uniform1f(uniformsRef.current.tap, s.currentTap)
      gl.uniform1f(uniformsRef.current.speed, 1.0)
      gl.uniform1f(uniformsRef.current.amplitude, s.currentAmplitude)
      gl.uniform1f(uniformsRef.current.pulseMin, s.currentPulseMin)
      gl.uniform1f(uniformsRef.current.pulseMax, s.currentPulseMax)
      gl.uniform1f(uniformsRef.current.noiseType, config.noiseType === 'trig' ? 1.0 : 0.0)

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

      requestAnimationFrame(animate)
    }
    const rafId = requestAnimationFrame(animate)

    // Event listeners
    button.addEventListener('mousedown', activate)
    button.addEventListener('mouseup', deactivate)
    button.addEventListener('mouseleave', deactivate)
    button.addEventListener('touchstart', activate)
    button.addEventListener('touchend', deactivate)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(rafId)
      button.removeEventListener('mousedown', activate)
      button.removeEventListener('mouseup', deactivate)
      button.removeEventListener('mouseleave', deactivate)
      button.removeEventListener('touchstart', activate)
      button.removeEventListener('touchend', deactivate)
      window.removeEventListener('resize', resize)
    }
  }, [compileShader, resize, activate, deactivate])

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={disabled}
      className={`chaos-button ${className}`}
      style={{
        position: 'relative',
        border: 'none',
        background: 'linear-gradient(#eee, #555)',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '240px',
        height: '60px',
        borderRadius: '150px',
        overflow: 'hidden',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.2s',
      }}
    >
      <canvas
        ref={canvasRef}
        className="chaos-canvas"
        style={{
          position: 'absolute',
          inset: '2px',
          display: 'block',
          height: 'calc(100% - 4px)',
          width: 'calc(100% - 4px)',
          borderRadius: 'inherit',
        }}
      />
      <span
        className="chaos-label"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'block',
          color: 'white',
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '0.5px',
          textShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'none',
          lineHeight: '60px',
          textAlign: 'center',
        }}
      >
        {children}
      </span>
    </button>
  )
}

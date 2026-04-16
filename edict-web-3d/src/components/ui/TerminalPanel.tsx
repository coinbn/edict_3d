import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'

interface TerminalProps {
  wsUrl?: string
  initialLines?: string[]
}

export default function TerminalPanel({
  wsUrl = 'ws://localhost:8080/terminal',
  initialLines = []
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [connected, setConnected] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentLineRef = useRef('')

  // 获取 API 基础地址并构建 WebSocket URL
  const getWsUrl = () => {
    const apiBase = localStorage.getItem('apiBase') || 'http://localhost:8080/api'
    // 如果用户设置了 apiBase，自动转换为对应的 WebSocket 地址
    if (apiBase.startsWith('http://')) {
      return apiBase.replace('http://', 'ws://') + '/terminal'
    }
    if (apiBase.startsWith('https://')) {
      return apiBase.replace('https://', 'wss://') + '/terminal'
    }
    return wsUrl
  }

  useEffect(() => {
    if (!terminalRef.current) return

    const container = terminalRef.current
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      setTimeout(() => {
        if (terminalRef.current?.clientWidth) {
          initTerminal()
        }
      }, 500)
      return
    }

    initTerminal()

    function initTerminal() {
      if (!terminalRef.current) return

      const term = new XTerminal({
        theme: {
          background: '#0a0a0f',
          foreground: '#e5e7eb',
          cursor: '#22d3ee',
          cursorAccent: '#0a0a0f',
          selectionBackground: 'rgba(34, 211, 238, 0.3)',
          black: '#0a0a0f',
          red: '#ef4444',
          green: '#22c55e',
          yellow: '#eab308',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#22d3ee',
          white: '#e5e7eb',
          brightBlack: '#4b5563',
          brightRed: '#f87171',
          brightGreen: '#4ade80',
          brightYellow: '#facc15',
          brightBlue: '#60a5fa',
          brightMagenta: '#c084fc',
          brightCyan: '#67e8f9',
          brightWhite: '#f9fafb',
        },
        fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
        fontSize: 12,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 1000,
        allowTransparency: true,
      })

      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.loadAddon(new WebLinksAddon())

      term.open(terminalRef.current)

      setTimeout(() => {
        try {
          fitAddon.fit()
        } catch (e) {
          // 忽略 fit 错误
        }
      }, 100)

      xtermRef.current = term
      fitAddonRef.current = fitAddon

      // 显示初始内容
      term.writeln('\x1b[36m➜\x1b[0m \x1b[1;37mEdict Terminal\x1b[0m')
      term.writeln('')
      initialLines.forEach((line) => term.writeln(line))
      term.writeln('')

      // 本地输入处理：直接发送到 WebSocket
      term.onData((data) => {
        const code = data.charCodeAt(0)
        if (code === 13) { // Enter
          term.writeln('')
          const line = currentLineRef.current
          if (line.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(line + '\n')
          }
          currentLineRef.current = ''
        } else if (code === 127 || code === 8) { // Backspace
          if (currentLineRef.current.length > 0) {
            currentLineRef.current = currentLineRef.current.slice(0, -1)
            term.write('\b \b')
          }
        } else if (code >= 32) { // Printable characters
          currentLineRef.current += data
          term.write(data)
        }
      })

      connectWebSocket(term)
    }

    function connectWebSocket(term: XTerminal) {
      const url = getWsUrl()
      term.writeln(`\x1b[90mConnecting to ${url}...\x1b[0m`)

      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          setErrorMsg(null)
          term.writeln('\x1b[32m✓ Terminal connected\x1b[0m')
          term.writeln('')
          // 连接后后端会自动启动 npm run dev，不需要发送命令
        }

        ws.onmessage = (event) => {
          term.write(event.data)
        }

        ws.onerror = (err) => {
          setConnected(false)
          setErrorMsg('WebSocket error')
          term.writeln('\x1b[31m✗ Connection error\x1b[0m')
          console.error('Terminal WebSocket error:', err)
        }

        ws.onclose = () => {
          setConnected(false)
          term.writeln('\x1b[33m⚠ Terminal disconnected\x1b[0m')

          // 3秒后自动重连
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (xtermRef.current) {
              xtermRef.current.writeln('\x1b[90mReconnecting...\x1b[0m')
              connectWebSocket(xtermRef.current)
            }
          }, 3000)
        }
      } catch (e) {
        setConnected(false)
        setErrorMsg(String(e))
        term.writeln(`\x1b[31m✗ Failed to connect: ${e}\x1b[0m`)
      }
    }

    const handleResize = () => {
      try {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit()
        }
      } catch (e) {
        // 忽略 resize 错误
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (xtermRef.current) {
        try {
          xtermRef.current.dispose()
        } catch (e) {
          // 忽略 dispose 错误
        }
      }
    }
  }, [])

  // 保持 terminal 大小适配
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        if (fitAddonRef.current && terminalRef.current?.clientWidth) {
          fitAddonRef.current.fit()
        }
      } catch (e) {
        // 忽略错误
      }
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0f]">
      {/* 终端头部 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#151520] border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-white/40 ml-2">npm run dev</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : errorMsg ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <span className="text-xs text-white/40">
            {connected ? 'Connected' : errorMsg ? 'Error' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* 终端内容 */}
      <div
        ref={terminalRef}
        className="flex-1 p-2 overflow-hidden"
        style={{ minHeight: 0 }}
      />
    </div>
  )
}

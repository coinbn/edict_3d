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
  wsUrl = 'ws://localhost:8080/api/terminal',
  initialLines = []
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerminal | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!terminalRef.current) return

    // 检查容器是否有有效尺寸
    const container = terminalRef.current
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      // 延迟检查
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
      
      // 创建 xterm 实例
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

      // 添加插件
      const fitAddon = new FitAddon()
      term.loadAddon(fitAddon)
      term.loadAddon(new WebLinksAddon())

      term.open(terminalRef.current)
      
      // 延迟 fit 确保 DOM 已渲染
      setTimeout(() => {
        try {
          fitAddon.fit()
        } catch (e) {
          // 忽略 fit 错误
        }
      }, 100)

      xtermRef.current = term

      // 显示初始内容
      term.writeln('\x1b[36m➜\x1b[0m \x1b[1;37mEdict Terminal (Mock Mode)\x1b[0m')
      term.writeln('')
      term.writeln('\x1b[33m⚠\x1b[0m Terminal server not connected')
      term.writeln('\x1b[33m⚠\x1b[0m Running in mock mode - commands are simulated')
      term.writeln('')
      initialLines.forEach((line) => term.writeln(line))
      term.writeln('')
      
      // 模拟本地输入处理
      let currentLine = ''
      term.onData((data) => {
        const code = data.charCodeAt(0)
        if (code === 13) { // Enter
          term.writeln('')
          if (currentLine.trim()) {
            term.writeln(`\x1b[32m$ \x1b[0m${currentLine}`)
            term.writeln(`\x1b[90m(mock) Command executed: ${currentLine}\x1b[0m`)
          }
          currentLine = ''
          term.write('\x1b[32m$ \x1b[0m')
        } else if (code === 127 || code === 8) { // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1)
            term.write('\b \b')
          }
        } else if (code >= 32) { // Printable characters
          currentLine += data
          term.write(data)
        }
      })

      term.write('\x1b[32m$ \x1b[0m')
      setConnected(false)
    }

    // 监听 resize
    const handleResize = () => {
      try {
        if (xtermRef.current) {
          const fitAddon = xtermRef.current.loadedAddons?.find(
            (a): a is FitAddon => (a as any).fit?.()
          )
          if (fitAddon) {
            (fitAddon as any).fit()
          }
        }
      } catch (e) {
        // 忽略 resize 错误
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      try {
        term.dispose()
      } catch (e) {
        // 忽略 dispose 错误
      }
    }
  }, [])

  // 保持 terminal 大小适配
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        if (xtermRef.current && terminalRef.current?.clientWidth) {
          const fitAddon = xtermRef.current.loadedAddons?.find(
            (a): a is FitAddon => (a as any).fit?.()
          )
          if (fitAddon) {
            (fitAddon as any).fit()
          }
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
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
          <span className="text-xs text-white/40">{connected ? 'Connected' : 'Mock Mode'}</span>
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

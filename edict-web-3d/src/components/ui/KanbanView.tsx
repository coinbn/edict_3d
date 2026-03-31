import { useState, useEffect } from 'react'
import { useStore, PIPE, type Task } from '../../stores/useStore'
import { motion, AnimatePresence } from 'framer-motion'

export default function KanbanView() {
  const { tasks, fetchTasks, loading, ui, setSelectedTask } = useStore()
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  
  useEffect(() => {
    fetchTasks()
  }, [])
  
  // 按状态分组任务
  const tasksByState = PIPE.reduce((acc, pipe) => {
    acc[pipe.key] = tasks.filter(t => t.state === pipe.key)
    return acc
  }, {} as Record<string, Task[]>)
  
  // 统计
  const stats = {
    total: tasks.length,
    doing: tasks.filter(t => t.state === 'Doing').length,
    done: tasks.filter(t => t.state === 'Done').length,
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex flex-col"
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-bold text-white">旨意看板</h2>
          <p className="text-white/40 text-sm">任务流程可视化</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-white/60">总计:</span>
            <span className="text-white ml-2">{stats.total}</span>
          </div>
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-white/60">执行中:</span>
            <span className="text-red-400 ml-2">{stats.doing}</span>
          </div>
          <div className="glass rounded-lg px-4 py-2">
            <span className="text-white/60">已完成:</span>
            <span className="text-green-400 ml-2">{stats.done}</span>
          </div>
          <button
            onClick={() => fetchTasks()}
            className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
          >
            刷新
          </button>
        </div>
      </div>
      
      {/* 看板区域 */}
      <div className="flex-1 overflow-x-auto px-6 pb-4">
        <div className="flex gap-4 min-w-max h-full">
          {PIPE.map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              tasks={tasksByState[column.key] || []}
              onDragStart={setDraggedTask}
              onDragEnd={() => setDraggedTask(null)}
            />
          ))}
        </div>
      </div>
      
      {/* 任务详情弹窗 */}
      <AnimatePresence>
        {ui.selectedTask && (
          <TaskDetailModal 
            task={ui.selectedTask} 
            onClose={() => setSelectedTask(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// 看板列
function KanbanColumn({ 
  column, 
  tasks,
  onDragStart,
  onDragEnd
}: { 
  column: typeof PIPE[0]
  tasks: Task[]
  onDragStart: (task: Task) => void
  onDragEnd: () => void
}) {
  return (
    <div className="w-72 flex-shrink-0 flex flex-col">
      {/* 列标题 */}
      <div 
        className="glass rounded-t-xl px-4 py-3"
        style={{ borderTop: `3px solid ${column.color}` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg" style={{ color: column.color }}>
            {column.icon} {column.label}
          </span>
          <span className="text-white/40 text-sm">{tasks.length}</span>
        </div>
      </div>
      
      {/* 任务列表 */}
      <div 
        className="flex-1 glass rounded-b-xl p-2 overflow-y-auto"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDragEnd()}
      >
        {tasks.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-white/20 text-sm">
            暂无任务
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onDragStart={() => onDragStart(task)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 任务卡片
function TaskCard({ task, onDragStart }: { task: Task; onDragStart: () => void }) {
  const { setSelectedTask } = useStore()
  
  const priorityColors: Record<string, string> = {
    '高': 'text-red-400',
    '中': 'text-yellow-400',
    '低': 'text-green-400',
  }
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={onDragStart}
      onClick={() => setSelectedTask(task)}
      className="glass rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-medium ${priorityColors[task.priority || '中']}`}>
          {task.priority || '中'}
        </span>
        <span className="text-xs text-white/30">{task.id}</span>
      </div>
      <h4 className="text-white text-sm font-medium mb-1 line-clamp-2">
        {task.title}
      </h4>
      {task.org && (
        <div className="text-xs text-white/40">
          {task.org}
        </div>
      )}
    </motion.div>
  )
}

// 任务详情弹窗
function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { updateTaskState } = useStore()
  
  const currentStateIdx = PIPE.findIndex(p => p.key === task.state)
  const nextState = currentStateIdx < PIPE.length - 1 ? PIPE[currentStateIdx + 1] : null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">{task.title}</h3>
            <p className="text-white/40 text-sm mt-1">ID: {task.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* 状态进度条 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {PIPE.map((p, idx) => (
              <div 
                key={p.key}
                className={`flex flex-col items-center ${idx <= currentStateIdx ? 'text-white' : 'text-white/30'}`}
              >
                <span>{p.icon}</span>
                <span className="text-xs mt-1">{p.label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
              style={{ width: `${((currentStateIdx + 1) / PIPE.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* 任务信息 */}
        <div className="space-y-4">
          <div>
            <label className="text-white/40 text-sm">描述</label>
            <p className="text-white mt-1">{task.description || '无'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/40 text-sm">优先级</label>
              <p className="text-white mt-1">{task.priority || '中'}</p>
            </div>
            <div>
              <label className="text-white/40 text-sm">当前状态</label>
              <p className="text-white mt-1">{task.state}</p>
            </div>
          </div>
          
          {task.org && (
            <div>
              <label className="text-white/40 text-sm">负责部门</label>
              <p className="text-white mt-1">{task.org}</p>
            </div>
          )}
          
          {task.now && (
            <div>
              <label className="text-white/40 text-sm">当前进度</label>
              <p className="text-white mt-1">{task.now}</p>
            </div>
          )}
        </div>
        
        {/* 操作按钮 */}
        {nextState && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              onClick={() => updateTaskState(task.id, nextState.key)}
              className="flex-1 py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/30"
            >
              推进到 {nextState.icon} {nextState.label}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

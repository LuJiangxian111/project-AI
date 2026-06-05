import { useEffect, useState } from 'react';
import { Plus, MoreHorizontal, Clock, AlertCircle } from 'lucide-react';
import api from '../api/client';
import type { Task } from '../types';

const columns = [
  { key: 'todo', label: '待办', color: 'bg-slate-500' },
  { key: 'in_progress', label: '进行中', color: 'bg-blue-500' },
  { key: 'review', label: '审查中', color: 'bg-amber-500' },
  { key: 'done', label: '已完成', color: 'bg-emerald-500' },
];

const priorityColors: Record<string, string> = {
  low: 'bg-slate-500/10 text-slate-400',
  medium: 'bg-blue-500/10 text-blue-400',
  high: 'bg-amber-500/10 text-amber-400',
  critical: 'bg-red-500/10 text-red-400',
};

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks').then(res => setTasks(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">任务管理</h2>
          <p className="text-slate-400 mt-1">看板视图 - 拖拽管理任务</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm">
          <Plus size={16} /> 新建任务
        </button>
      </div>

      {loading ? (
        <div className="flex gap-4">
          {columns.map(col => <div key={col.key} className="flex-1 h-64 bg-[#0f172a] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <div key={col.key} className="flex-1 min-w-[280px] bg-[#0f172a] border border-[#1e293b] rounded-xl">
              <div className="flex items-center justify-between p-4 border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                  <span className="text-xs text-slate-500 bg-[#1e293b] px-1.5 py-0.5 rounded">
                    {getTasksByStatus(col.key).length}
                  </span>
                </div>
                <button className="text-slate-600 hover:text-slate-400"><Plus size={16} /></button>
              </div>
              <div className="p-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                {getTasksByStatus(col.key).map(task => (
                  <div key={task.id} className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 hover:border-[#475569] transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm text-white leading-snug">{task.title}</h4>
                      <button className="text-slate-600 hover:text-slate-400"><MoreHorizontal size={14} /></button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.priority && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock size={10} /> {new Date(task.due_date).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
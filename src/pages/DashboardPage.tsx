import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, ListTodo, Briefcase, AlertTriangle,
  TrendingUp, Plus, Sparkles, Clock, Users
} from 'lucide-react';
import api from '../api/client';
import type { Project, Task, JobPosition } from '../types';

interface DashboardData {
  projects: Project[];
  tasks: Task[];
  positions: JobPosition[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ projects: [], tasks: [], positions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects?limit=5'),
      api.get('/tasks?limit=5'),
      api.get('/job-positions?limit=5'),
    ]).then(([proj, task, pos]) => {
      setData({ projects: proj.data, tasks: task.data, positions: pos.data });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeProjects = data.projects.filter(p => p.status === 'active' || p.status === 'planning');
  const pendingTasks = data.tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const openPositions = data.positions.filter(p => p.status === 'open');

  const statCards = [
    { label: '活跃项目', value: activeProjects.length, icon: FolderKanban, color: 'from-indigo-500 to-blue-500' },
    { label: '待办任务', value: pendingTasks.length, icon: ListTodo, color: 'from-amber-500 to-orange-500' },
    { label: '招聘岗位', value: openPositions.length, icon: Briefcase, color: 'from-emerald-500 to-teal-500' },
    { label: '风险预警', value: 0, icon: AlertTriangle, color: 'from-red-500 to-pink-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">仪表盘</h2>
          <p className="text-slate-400 mt-1">项目概览和关键指标</p>
        </div>
        <div className="flex gap-3">
          <Link to="/projects" className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors text-sm">
            <Plus size={16} /> 新建项目
          </Link>
          <Link to="/ai-agent" className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] text-slate-300 rounded-lg hover:bg-[#334155] transition-colors text-sm">
            <Sparkles size={16} /> AI 助手
          </Link>
        </div>
      </div>

      {/* 指标卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{loading ? '-' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 项目列表 */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderKanban size={16} className="text-indigo-400" /> 最近项目
            </h3>
            <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300">查看全部</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-[#1e293b] rounded-lg animate-pulse" />)}
            </div>
          ) : data.projects.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">暂无项目，点击上方按钮创建</p>
          ) : (
            <div className="space-y-2">
              {data.projects.slice(0, 4).map(project => (
                <Link key={project.id} to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1e293b] transition-colors">
                  <div>
                    <p className="text-sm text-slate-200">{project.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{project.status}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                        style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-10 text-right">{project.progress}%</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 最近活动 */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-400" /> 最近活动
            </h3>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-[#1e293b] rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="text-slate-300 flex-1">{task.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    task.priority === 'high' || task.priority === 'critical'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}>{task.priority}</span>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-6">暂无活动</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI 助手提示 */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 border border-indigo-500/20 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">AI 智能助手</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              尝试使用 AI 生成项目报告、分析风险、筛选简历
            </p>
          </div>
          <Link to="/ai-agent" className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors">
            开始对话
          </Link>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Save, X, Trash2, Calendar, Users, Target, DollarSign,
  ListTodo, Briefcase, BarChart3, Clock, AlertTriangle, CheckCircle2
} from 'lucide-react';
import api from '../api/client';
import type { ProjectOverview, Task } from '../types';

const statusOptions = [
  { value: 'planning', label: '计划中' },
  { value: 'active', label: '进行中' },
  { value: 'on_hold', label: '暂停' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  on_hold: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusLabels: Record<string, string> = {
  active: '进行中', planning: '计划中', on_hold: '暂停', completed: '已完成', cancelled: '已取消',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectOverview | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks'>('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', description: '', status: '', start_date: '', end_date: '', deadline: '', budget: '',
  });
  const [saveMsg, setSaveMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project_id=${id}`),
    ]).then(([projRes, tasksRes]) => {
      setProject(projRes.data);
      setTasks(tasksRes.data);
      setEditForm({
        name: projRes.data.name || '',
        description: projRes.data.description || '',
        status: projRes.data.status || 'planning',
        start_date: projRes.data.start_date || '',
        end_date: projRes.data.end_date || '',
        deadline: projRes.data.deadline || '',
        budget: projRes.data.budget?.toString() || '',
      });
    }).catch(() => {
      navigate('/projects');
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleEdit = () => {
    setEditing(true);
    setSaveMsg('');
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await api.put(`/projects/${id}`, {
        name: editForm.name,
        description: editForm.description || null,
        status: editForm.status,
        start_date: editForm.start_date || null,
        end_date: editForm.end_date || null,
        deadline: editForm.deadline || null,
        budget: editForm.budget ? parseFloat(editForm.budget) : null,
      });
      setProject(res.data);
      setEditing(false);
      setSaveMsg('保存成功');
    } catch (err: any) {
      setSaveMsg(err?.response?.data?.detail || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      deadline: project.deadline || '',
      budget: project.budget?.toString() || '',
    });
    setEditing(false);
    setSaveMsg('');
  };

  const handleDelete = async () => {
    if (!id || !confirm('确定要删除这个项目吗？此操作不可恢复。')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const taskStatusCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-[#0f172a] rounded animate-pulse" />
        <div className="h-64 bg-[#0f172a] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
          <ArrowLeft size={16} /> 返回项目列表
        </button>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? '保存中...' : '保存'}
              </button>
              <button onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] text-slate-300 rounded-lg text-sm hover:bg-[#334155] transition-colors">
                <X size={14} /> 取消
              </button>
            </>
          ) : (
            <>
              <button onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] text-slate-300 rounded-lg text-sm hover:bg-[#334155] transition-colors">
                <Edit3 size={14} /> 编辑
              </button>
              <button onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
                <Trash2 size={14} /> 删除
              </button>
            </>
          )}
        </div>
      </div>

      {saveMsg && (
        <div className={`text-sm px-4 py-2 rounded-lg ${saveMsg === '保存成功' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {saveMsg}
        </div>
      )}

      {/* 项目头部信息 */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">项目名称</label>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">描述</label>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                rows={3} className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none resize-none" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">状态</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none">
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">预算</label>
                <input type="number" value={editForm.budget} onChange={e => setEditForm({ ...editForm, budget: e.target.value })}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">开始日期</label>
                <input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">截止日期</label>
                <input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <p className="text-slate-400 mt-1.5">{project.description || '暂无描述'}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded border ${statusColors[project.status] || ''}`}>
                {statusLabels[project.status] || project.status}
              </span>
            </div>
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#1e293b]">
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Calendar size={14} />
                {project.start_date ? project.start_date : '未设置'} ~ {project.deadline || '未设置'}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <DollarSign size={14} />
                {project.budget ? `¥${project.budget.toLocaleString()}` : '未设置'}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <Users size={14} />
                {project.owner_name ? `${project.owner_name} (负责人)` : '未知'}
              </div>
            </div>
            {/* 进度条 */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-400">项目进度</span>
                <span className="text-slate-300">{project.progress}%</span>
              </div>
              <div className="h-2 bg-[#1e293b] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all"
                  style={{ width: `${project.progress}%` }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '总任务', value: tasks.length, icon: ListTodo, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: '进行中', value: taskStatusCounts.in_progress, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: '已完成', value: taskStatusCounts.done, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: '待处理', value: taskStatusCounts.todo, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b border-[#1e293b]">
        {[
          { key: 'overview' as const, label: '概览', icon: BarChart3 },
          { key: 'tasks' as const, label: '任务列表', icon: ListTodo },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">共 {tasks.length} 个任务</p>
            <Link to={`/tasks?project_id=${id}`}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              查看全部 →
            </Link>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-[#0f172a] rounded-xl border border-[#1e293b]">
              <ListTodo size={40} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">暂无任务</p>
              <Link to="/tasks" className="text-indigo-400 text-sm mt-2 inline-block">去任务管理创建任务</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 10).map(task => (
                <div key={task.id} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'done' ? 'bg-emerald-400' :
                      task.status === 'in_progress' ? 'bg-amber-400' :
                      task.status === 'review' ? 'bg-purple-400' :
                      'bg-slate-400'
                    }`} />
                    <div>
                      <p className="text-sm text-white">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {task.priority === 'high' || task.priority === 'critical' ? '高优先级' : '普通'}
                        {task.due_date && ` · ${task.due_date}`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    task.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    task.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    task.status === 'review' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {task.status === 'todo' ? '待办' :
                     task.status === 'in_progress' ? '进行中' :
                     task.status === 'review' ? '审核中' :
                     task.status === 'done' ? '已完成' : task.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 概览 */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target size={16} className="text-indigo-400" /> 项目信息
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">状态</span><span className="text-slate-200">{statusLabels[project.status] || project.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">预算</span><span className="text-slate-200">{project.budget ? `¥${project.budget.toLocaleString()}` : '未设置'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">实际成本</span><span className="text-slate-200">{project.actual_cost ? `¥${project.actual_cost.toLocaleString()}` : '¥0'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">负责人</span><span className="text-slate-200">{project.owner_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">开始日期</span><span className="text-slate-200">{project.start_date || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">截止日期</span><span className="text-slate-200">{project.deadline || '-'}</span></div>
            </div>
          </div>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Briefcase size={16} className="text-indigo-400" /> 任务统计
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">总任务数</span><span className="text-slate-200">{tasks.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">待办</span><span className="text-slate-200">{taskStatusCounts.todo}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">进行中</span><span className="text-slate-200">{taskStatusCounts.in_progress}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">审核中</span><span className="text-slate-200">{taskStatusCounts.review}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">已完成</span><span className="text-slate-200">{taskStatusCounts.done}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">完成率</span><span className="text-slate-200">{tasks.length > 0 ? Math.round((taskStatusCounts.done / tasks.length) * 100) : 0}%</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
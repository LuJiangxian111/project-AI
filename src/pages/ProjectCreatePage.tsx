import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FolderKanban } from 'lucide-react';
import api from '../api/client';

const statusOptions = [
  { value: 'planning', label: '计划中' },
  { value: 'active', label: '进行中' },
  { value: 'on_hold', label: '暂停' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function ProjectCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    deadline: '',
    budget: '',
    team_members: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('请输入项目名称');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const teamMembers = form.team_members
        ? form.team_members.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const res = await api.post('/projects', {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        deadline: form.deadline || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        team_members: teamMembers,
      });
      navigate(`/projects/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || '创建失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
        <ArrowLeft size={16} /> 返回项目列表
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
          <FolderKanban size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">新建项目</h2>
          <p className="text-slate-400 text-sm">创建新的项目并开始管理</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="text-sm text-slate-300 mb-1.5 block">
            项目名称 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.name}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="输入项目名称"
            required
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 mb-1.5 block">项目描述</label>
          <textarea
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            rows={4}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none resize-none"
            placeholder="描述项目的目标、范围和关键信息..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">项目状态</label>
            <select
              value={form.status}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            >
              {statusOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">预算</label>
            <input
              type="number"
              value={form.budget}
              onChange={e => handleChange('budget', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">开始日期</label>
            <input
              type="date"
              value={form.start_date}
              onChange={e => handleChange('start_date', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">结束日期</label>
            <input
              type="date"
              value={form.end_date}
              onChange={e => handleChange('end_date', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">截止日期</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => handleChange('deadline', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-300 mb-1.5 block">
            团队成员 <span className="text-slate-500 text-xs">（用逗号分隔成员邮箱）</span>
          </label>
          <input
            value={form.team_members}
            onChange={e => handleChange('team_members', e.target.value)}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="user1@example.com, user2@example.com"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? '创建中...' : '创建项目'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2.5 bg-[#1e293b] text-slate-300 rounded-lg text-sm hover:bg-[#334155] transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
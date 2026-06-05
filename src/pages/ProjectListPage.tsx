import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, FolderKanban, MoreVertical } from 'lucide-react';
import api from '../api/client';
import type { Project } from '../types';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">项目管理</h2>
          <p className="text-slate-400 mt-1">管理你的所有项目</p>
        </div>
        <Link to="/projects/new" className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm">
          <Plus size={16} /> 新建项目
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="搜索项目..." />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0f172a] border border-[#1e293b] text-slate-300 rounded-lg hover:bg-[#1e293b] transition-colors text-sm">
          <Filter size={16} /> 筛选
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-[#0f172a] rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">暂无项目</p>
          <Link to="/projects/new" className="text-indigo-400 text-sm mt-2 inline-block">创建第一个项目</Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`}
              className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded border ${statusColors[project.status] || ''}`}>
                    {statusLabels[project.status] || project.status}
                  </span>
                </div>
                <button className="text-slate-600 hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description || '暂无描述'}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }} />
                </div>
                <span className="text-xs text-slate-400">{project.progress}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
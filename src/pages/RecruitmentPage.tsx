import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Briefcase, MapPin, TrendingUp } from 'lucide-react';
import api from '../api/client';
import type { JobPosition } from '../types';

export default function RecruitmentPage() {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/job-positions').then(res => setPositions(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = positions.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusLabels: Record<string, string> = {
    open: '开放中', closed: '已关闭', on_hold: '暂停', cancelled: '已取消',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">招聘管理</h2>
          <p className="text-slate-400 mt-1">管理招聘岗位和候选人</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm">
          <Plus size={16} /> 发布岗位
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#0f172a] border border-[#1e293b] rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="搜索岗位..." />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-[#0f172a] rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">暂无招聘岗位</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(pos => (
            <Link key={pos.id} to={`/recruitment/${pos.id}`}
              className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-all block">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-sm font-semibold text-white">{pos.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      pos.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                    }`}>{statusLabels[pos.status] || pos.status}</span>
                    {pos.priority === 'urgent' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">紧急</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    {pos.department && <span className="flex items-center gap-1"><Briefcase size={12} /> {pos.department}</span>}
                    {pos.location && <span className="flex items-center gap-1"><MapPin size={12} /> {pos.location}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={14} className="text-indigo-400" />
                    <span className="text-white font-semibold">{pos.hired_count}</span>
                    <span className="text-slate-500">/ {pos.target_hire_count}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">已招聘 / 目标</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
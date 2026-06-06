import { useEffect, useState } from 'react';
import { Plus, Search, X, Briefcase, MapPin, Users, TrendingUp, AlertTriangle, Building2, Filter, Clock, Phone, BarChart3, FolderKanban } from 'lucide-react';
import api from '../api/client';

interface MarketplaceItem {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  department: string | null;
  location: string | null;
  employment_type: string;
  urgency: string;
  target_hire_count: number;
  current_filled: number;
  project_id: string | null;
  project_name: string;
  creator_id: string;
  creator_name: string;
  contact_info: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface MarketplaceStats {
  total: number;
  open: number;
  urgent: number;
  total_positions: number;
  total_filled: number;
  departments: string[];
}

const urgencyLabels: Record<string, { label: string; color: string }> = {
  high: { label: '紧急', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  medium: { label: '一般', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  low: { label: '低', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const typeLabels: Record<string, string> = {
  full_time: '全职', part_time: '兼职', contract: '合同制', intern: '实习',
};

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', requirements: '', department: '', location: '', employment_type: 'full_time', urgency: 'medium', target_hire_count: 1, current_filled: 0, project_name: '', project_id: '', contact_info: '', status: 'open' });
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  const fetchData = () => {
    setLoading(true);
    return Promise.all([
      api.get('/marketplace', { params: { status: filterStatus || undefined, urgency: filterUrgency || undefined, department: filterDept || undefined, employment_type: filterType || undefined, search: search || undefined } }),
      api.get('/marketplace/stats'),
    ]).then(([resItems, resStats]) => {
      console.log('API 返回列表:', resItems.data);
      console.log('API 返回统计:', resStats.data);
      setItems(resItems.data);
      setStats(resStats.data);
    }).catch(err => {
      console.error('加载需求广场数据失败:', err);
      console.error('错误详情:', err?.response?.data);
      alert('加载失败: ' + (err?.response?.data || err.message));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterUrgency, filterDept, filterType, filterStatus]);

  const handleSearch = () => fetchData();

  const openCreate = async () => {
    setEditId(null);
    setForm({ title: '', description: '', requirements: '', department: '', location: '', employment_type: 'full_time', urgency: 'medium', target_hire_count: 1, current_filled: 0, project_name: '', project_id: '', contact_info: '', status: 'open' });
    // 加载项目列表
    try {
      const res = await api.get('/projects');
      setProjects(res.data.map((p: any) => ({ id: p.id, name: p.name })));
    } catch { setProjects([]); }
    setShowModal(true);
  };

  const openEdit = (item: MarketplaceItem) => {
    setEditId(item.id);
    setForm({ title: item.title, description: item.description || '', requirements: item.requirements || '', department: item.department || '', location: item.location || '', employment_type: item.employment_type, urgency: item.urgency, target_hire_count: item.target_hire_count, current_filled: item.current_filled, project_name: item.project_name, project_id: item.project_id || '', contact_info: item.contact_info || '', status: item.status });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let res;
      if (editId) {
        res = await api.put(`/marketplace/${editId}`, form);
      } else {
        res = await api.post('/marketplace', form);
        console.log('发布成功，返回:', res.data);
      }
      setShowModal(false);
      // 清除筛选条件
      setFilterStatus('');
      setFilterUrgency('');
      setFilterDept('');
      setFilterType('');
      setSearch('');
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      await fetchData();
    } catch (err: any) {
      console.error('操作失败:', err);
      alert(err?.response?.data?.detail || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该岗位需求？')) return;
    await api.delete(`/marketplace/${id}`);
    fetchData();
  };

  const handleStatusChange = async (item: MarketplaceItem, newStatus: string) => {
    await api.put(`/marketplace/${item.id}`, { status: newStatus });
    fetchData();
  };

  const gap = stats ? stats.total_positions - stats.total_filled : 0;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 size={24} className="text-indigo-400" /> 岗位需求广场
          </h2>
          <p className="text-slate-400 mt-1">跨项目岗位需求共享，打通信息流通</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> 发布需求
        </button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><Briefcase size={14} /> 需求总数</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-1"><Users size={14} /> 开放中</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.open}</div>
          </div>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-400 text-xs mb-1"><AlertTriangle size={14} /> 紧急需求</div>
            <div className="text-2xl font-bold text-red-400">{stats.urgent}</div>
          </div>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-2 text-indigo-400 text-xs mb-1"><TrendingUp size={14} /> 总缺口</div>
            <div className="text-2xl font-bold text-indigo-400">{gap}</div>
          </div>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
            <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1"><BarChart3 size={14} /> 已填/总数</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.total_filled}/{stats.total_positions}</div>
          </div>
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="搜索岗位名称、描述..." />
        </div>
        <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}
          className="bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-slate-300 text-sm focus:border-indigo-500 focus:outline-none">
          <option value="">紧急程度</option>
          <option value="high">紧急</option>
          <option value="medium">一般</option>
          <option value="low">低</option>
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-slate-300 text-sm focus:border-indigo-500 focus:outline-none">
          <option value="">部门</option>
          {stats?.departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-slate-300 text-sm focus:border-indigo-500 focus:outline-none">
          <option value="">工作类型</option>
          <option value="full_time">全职</option>
          <option value="part_time">兼职</option>
          <option value="contract">合同制</option>
          <option value="intern">实习</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-slate-300 text-sm focus:border-indigo-500 focus:outline-none">
          <option value="">状态</option>
          <option value="open">开放中</option>
          <option value="filled">已满</option>
          <option value="closed">已关闭</option>
        </select>
        <button onClick={handleSearch} className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm hover:bg-indigo-500/30 transition-colors flex items-center gap-1.5">
          <Filter size={14} /> 筛选
        </button>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center text-slate-500 py-12">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-slate-500 py-12 bg-[#0f172a] border border-[#1e293b] rounded-xl">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>暂无岗位需求</p>
          <p className="text-sm mt-1">点击"发布需求"添加第一个岗位</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => {
            const u = urgencyLabels[item.urgency] || urgencyLabels.medium;
            const progress = item.target_hire_count > 0 ? Math.round((item.current_filled / item.target_hire_count) * 100) : 0;
            return (
              <Link key={item.id} to={`/marketplace/${item.id}`} className={`bg-[#0f172a] border rounded-xl p-5 transition-colors block hover:border-[#334155] ${item.status === 'filled' ? 'border-emerald-500/20 opacity-70' : item.urgency === 'high' ? 'border-red-500/30' : 'border-[#1e293b]'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${u.color}`}>{u.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{typeLabels[item.employment_type] || item.employment_type}</span>
                      {item.status === 'filled' && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">已满</span>}
                      {item.status === 'closed' && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">已关闭</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1"><Building2 size={12} /> {item.project_name}</span>
                      {item.department && <span className="flex items-center gap-1"><Briefcase size={12} /> {item.department}</span>}
                      {item.location && <span className="flex items-center gap-1"><MapPin size={12} /> {item.location}</span>}
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
                      <span className="text-slate-500">发布者: {item.creator_name}</span>
                    </div>
                    {item.description && <p className="text-slate-400 text-sm mt-2 line-clamp-2">{item.description}</p>}
                    {item.requirements && <p className="text-slate-500 text-xs mt-1 line-clamp-1">要求: {item.requirements}</p>}
                    {item.contact_info && (
                      <p className="text-slate-500 text-xs mt-1 flex items-center gap-1"><Phone size={12} /> {item.contact_info}</p>
                    )}
                    {/* 进度条 */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">招聘进度</span>
                        <span className="text-slate-400">{item.current_filled}/{item.target_hire_count} ({progress}%)</span>
                      </div>
                      <div className="w-full h-2 bg-[#1e293b] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-indigo-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.status === 'open' && (
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(item, 'filled'); }} className="px-2.5 py-1.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors">标记已满</button>
                    )}
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(item); }} className="px-2.5 py-1.5 text-xs rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">编辑</button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id); }} className="px-2.5 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">删除</button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 发布/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{editId ? '编辑岗位需求' : '发布岗位需求'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">岗位名称 *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="如: 高级前端工程师" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">所属项目 *</label>
                  <select value={form.project_id} onChange={e => {
                    const selected = projects.find(p => p.id === e.target.value);
                    setForm({ ...form, project_id: e.target.value, project_name: selected?.name || '' });
                  }}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" required>
                    <option value="">-- 选择项目 --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {projects.length === 0 && (
                    <p className="text-xs text-amber-400 mt-1">暂无可选项目，请先在「项目管理」中创建项目</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">部门</label>
                  <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="如: 研发部" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">工作地点</label>
                  <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="如: 北京" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">紧急程度</label>
                  <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="high">紧急</option>
                    <option value="medium">一般</option>
                    <option value="low">低</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">工作类型</label>
                  <select value={form.employment_type} onChange={e => setForm({ ...form, employment_type: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="full_time">全职</option>
                    <option value="part_time">兼职</option>
                    <option value="contract">合同制</option>
                    <option value="intern">实习</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">需要人数</label>
                  <input type="number" value={form.target_hire_count} onChange={e => setForm({ ...form, target_hire_count: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" min={1} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">已入职人数</label>
                  <input type="number" value={form.current_filled} onChange={e => setForm({ ...form, current_filled: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" min={0} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">联系方式</label>
                  <input type="text" value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="邮箱/电话/微信" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">岗位描述</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none h-20 resize-none"
                    placeholder="描述岗位职责和工作内容..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">任职要求</label>
                  <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none h-20 resize-none"
                    placeholder="如: 3年以上前端经验，熟悉React..." />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? '提交中...' : editId ? '保存修改' : '发布需求'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
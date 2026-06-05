import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, Briefcase, Clock, Phone, Upload, UserPlus,
  FileText, Mail, AlertTriangle, TrendingUp, Users, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Calendar, Star, MessageSquare, Edit3, Trash2
} from 'lucide-react';
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
}

interface Candidate {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  file_name: string | null;
  file_size: number;
  status: string;
  rating: number | null;
  notes: string | null;
  source: string;
  skills: string[];
  tags: string[];
  interviews: Interview[];
  created_at: string;
}

interface Interview {
  id: string;
  title: string;
  status: string;
  result: string | null;
  rating: number | null;
  scheduled_start: string;
  interview_type: string;
  feedback: string | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: '新简历', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  screening: { label: '筛选中', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  interview: { label: '面试中', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  offer: { label: '已发Offer', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  hired: { label: '已入职', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: '已淘汰', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  archived: { label: '已归档', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const urgencyLabels: Record<string, { label: string; color: string }> = {
  high: { label: '紧急', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  medium: { label: '一般', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  low: { label: '低', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const typeLabels: Record<string, string> = {
  full_time: '全职', part_time: '兼职', contract: '合同制', intern: '实习',
};

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [item, setItem] = useState<MarketplaceItem | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<string | null>(null);

  // 上传表单
  const [uploadForm, setUploadForm] = useState({
    candidate_name: '', candidate_email: '', candidate_phone: '',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // 编辑表单
  const [editForm, setEditForm] = useState({ status: '', rating: '', notes: '' });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/marketplace/${id}`),
      api.get(`/marketplace/${id}/candidates`),
    ]).then(([itemRes, candRes]) => {
      setItem(itemRes.data);
      setCandidates(candRes.data.candidates || []);
    }).catch(() => navigate('/marketplace')).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.candidate_name || !uploadForm.candidate_email) {
      setUploadMsg('请填写候选人姓名和邮箱');
      return;
    }
    setUploading(true);
    setUploadMsg('');
    try {
      const formData = new FormData();
      formData.append('candidate_name', uploadForm.candidate_name);
      formData.append('candidate_email', uploadForm.candidate_email);
      if (uploadForm.candidate_phone) formData.append('candidate_phone', uploadForm.candidate_phone);
      formData.append('source', 'marketplace');
      if (uploadFile) formData.append('file', uploadFile);

      await api.post(`/marketplace/${id}/candidates`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadForm({ candidate_name: '', candidate_email: '', candidate_phone: '' });
      setUploadFile(null);
      setUploadMsg('上传成功');
      setShowUpload(false);

      // 刷新候选人列表
      const res = await api.get(`/marketplace/${id}/candidates`);
      setCandidates(res.data.candidates || []);
    } catch (err: any) {
      setUploadMsg(err?.response?.data?.detail || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateStatus = async (candidateId: string) => {
    try {
      await api.put(`/marketplace/${id}/candidates/${candidateId}`, {
        status: editForm.status,
        rating: editForm.rating ? parseInt(editForm.rating) : null,
        notes: editForm.notes || null,
      });
      setEditingCandidate(null);
      const res = await api.get(`/marketplace/${id}/candidates`);
      setCandidates(res.data.candidates || []);
    } catch {}
  };

  const openEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate.id);
    setEditForm({
      status: candidate.status,
      rating: candidate.rating?.toString() || '',
      notes: candidate.notes || '',
    });
  };

  const statusOptions = [
    { value: 'new', label: '新简历' },
    { value: 'screening', label: '筛选中' },
    { value: 'interview', label: '面试中' },
    { value: 'offer', label: '已发Offer' },
    { value: 'hired', label: '已入职' },
    { value: 'rejected', label: '已淘汰' },
    { value: 'archived', label: '已归档' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-[#0f172a] rounded animate-pulse" />
        <div className="h-64 bg-[#0f172a] rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!item) return null;

  const u = urgencyLabels[item.urgency] || urgencyLabels.medium;
  const filled = candidates.filter(c => c.status === 'hired').length;
  const progress = item.target_hire_count > 0 ? Math.round((filled / item.target_hire_count) * 100) : 0;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/marketplace')}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
        <ArrowLeft size={16} /> 返回需求广场
      </button>

      {/* 岗位详情头部 */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-white">{item.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${u.color}`}>{u.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{typeLabels[item.employment_type] || item.employment_type}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap mt-2">
              <span className="flex items-center gap-1"><Building2 size={14} /> {item.project_name}</span>
              {item.department && <span className="flex items-center gap-1"><Briefcase size={14} /> {item.department}</span>}
              {item.location && <span className="flex items-center gap-1"><MapPin size={14} /> {item.location}</span>}
              <span className="flex items-center gap-1"><Clock size={14} /> {new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
              <span className="text-slate-500">发布者: {item.creator_name}</span>
              {item.contact_info && <span className="flex items-center gap-1"><Phone size={14} /> {item.contact_info}</span>}
            </div>
          </div>
        </div>

        {item.description && (
          <div className="mt-4 p-4 bg-[#1e293b]/50 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-300 mb-1">岗位描述</h3>
            <p className="text-slate-400 text-sm">{item.description}</p>
          </div>
        )}
        {item.requirements && (
          <div className="mt-3 p-4 bg-[#1e293b]/50 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-300 mb-1">任职要求</h3>
            <p className="text-slate-400 text-sm">{item.requirements}</p>
          </div>
        )}

        {/* 招聘进度 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">招聘进度</span>
            <span className="text-slate-300">{filled}/{item.target_hire_count} 已入职 ({progress}%)</span>
          </div>
          <div className="h-2.5 bg-[#1e293b] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'}`}
              style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* 候选人列表 */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">候选人管理</h2>
            <span className="text-sm text-slate-500">({candidates.length}人)</span>
          </div>
          <button onClick={() => { setShowUpload(!showUpload); setUploadMsg(''); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <UserPlus size={14} /> 添加候选人
          </button>
        </div>

        {/* 上传表单 */}
        {showUpload && (
          <form onSubmit={handleUpload} className="mb-4 p-4 bg-[#1e293b]/50 rounded-xl border border-[#334155] space-y-3">
            <h3 className="text-sm font-semibold text-white">添加候选人</h3>
            {uploadMsg && (
              <div className={`text-xs px-3 py-2 rounded ${uploadMsg === '上传成功' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {uploadMsg}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <input
                value={uploadForm.candidate_name}
                onChange={e => setUploadForm({ ...uploadForm, candidate_name: e.target.value })}
                className="bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="姓名 *" required />
              <input
                type="email" value={uploadForm.candidate_email}
                onChange={e => setUploadForm({ ...uploadForm, candidate_email: e.target.value })}
                className="bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="邮箱 *" required />
              <input
                value={uploadForm.candidate_phone}
                onChange={e => setUploadForm({ ...uploadForm, candidate_phone: e.target.value })}
                className="bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="电话" />
            </div>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt" />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e293b] border border-[#334155] text-slate-300 rounded-lg text-sm hover:bg-[#334155] transition-colors">
                <Upload size={14} /> {uploadFile ? uploadFile.name : '上传简历 (可选)'}
              </button>
              {uploadFile && (
                <button type="button" onClick={() => setUploadFile(null)}
                  className="text-red-400 text-xs hover:text-red-300">移除</button>
              )}
              <button type="submit" disabled={uploading}
                className="ml-auto px-4 py-1.5 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50">
                {uploading ? '提交中...' : '提交'}
              </button>
            </div>
          </form>
        )}

        {/* 候选人卡片 */}
        {candidates.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
            <p>暂无候选人</p>
            <p className="text-sm mt-1">点击"添加候选人"上传简历</p>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map(candidate => {
              const s = statusLabels[candidate.status] || statusLabels.new;
              const isExpanded = expandedId === candidate.id;
              const isEditing = editingCandidate === candidate.id;

              return (
                <div key={candidate.id} className="bg-[#1e293b]/50 rounded-xl border border-[#334155] overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                          {candidate.candidate_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{candidate.candidate_name}</h4>
                            <span className={`text-xs px-1.5 py-0.5 rounded border ${s.color}`}>{s.label}</span>
                            {candidate.rating && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-400">
                                <Star size={12} /> {candidate.rating}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1"><Mail size={12} /> {candidate.candidate_email}</span>
                            {candidate.candidate_phone && <span>{candidate.candidate_phone}</span>}
                            {candidate.file_name && <span className="flex items-center gap-1"><FileText size={12} /> {candidate.file_name}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(candidate)}
                          className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => setExpandedId(isExpanded ? null : candidate.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* 编辑模式 */}
                    {isEditing && (
                      <div className="mt-3 p-3 bg-[#0f172a] rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">状态</label>
                            <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full bg-[#1e293b] border border-[#334155] rounded py-1.5 px-2 text-white text-xs focus:border-indigo-500 focus:outline-none">
                              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 mb-1 block">评分 (1-5)</label>
                            <input type="number" value={editForm.rating} onChange={e => setEditForm({ ...editForm, rating: e.target.value })}
                              min="1" max="5"
                              className="w-full bg-[#1e293b] border border-[#334155] rounded py-1.5 px-2 text-white text-xs focus:border-indigo-500 focus:outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">备注</label>
                          <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                            rows={2} className="w-full bg-[#1e293b] border border-[#334155] rounded py-1.5 px-2 text-white text-xs focus:border-indigo-500 focus:outline-none resize-none" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateStatus(candidate.id)}
                            className="px-3 py-1 bg-indigo-500 text-white rounded text-xs hover:bg-indigo-600 transition-colors">保存</button>
                          <button onClick={() => setEditingCandidate(null)}
                            className="px-3 py-1 bg-[#334155] text-slate-300 rounded text-xs hover:bg-[#475569] transition-colors">取消</button>
                        </div>
                      </div>
                    )}

                    {/* 展开详情 */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-[#334155] space-y-2">
                        {candidate.notes && (
                          <div className="flex items-start gap-2 text-xs text-slate-400">
                            <MessageSquare size={12} className="mt-0.5 shrink-0" />
                            <span>{candidate.notes}</span>
                          </div>
                        )}
                        {candidate.interviews.length > 0 ? (
                          <div>
                            <h5 className="text-xs text-slate-500 mb-1.5">面试记录</h5>
                            {candidate.interviews.map(interview => (
                              <div key={interview.id} className="flex items-center gap-2 text-xs py-1">
                                <Calendar size={12} className="text-slate-500" />
                                <span className="text-slate-300">{new Date(interview.scheduled_start).toLocaleString('zh-CN')}</span>
                                <span className="text-slate-500">- {interview.title}</span>
                                {interview.result && (
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                                    interview.result === 'passed' ? 'bg-emerald-500/10 text-emerald-400' :
                                    interview.result === 'failed' ? 'bg-red-500/10 text-red-400' :
                                    'bg-slate-500/10 text-slate-400'
                                  }`}>
                                    {interview.result === 'passed' ? '通过' : interview.result === 'failed' ? '未通过' : interview.result}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">暂无面试记录</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
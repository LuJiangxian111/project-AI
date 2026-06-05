import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, MapPin, Video, User, CheckCircle, XCircle, Clock3 } from 'lucide-react';
import api from '../api/client';
import type { Interview } from '../types';

export default function InterviewPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/interviews').then(res => setInterviews(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatIcons: Record<string, typeof MapPin> = {
    onsite: MapPin, remote: Video, phone: Video, video: Video,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">面试管理</h2>
        <p className="text-slate-400 mt-1">查看和安排面试</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-[#0f172a] rounded-xl animate-pulse" />)}
        </div>
      ) : interviews.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">暂无面试安排</p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map(iv => {
            const FormatIcon = formatIcons[iv.format] || MapPin;
            return (
              <div key={iv.id} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 hover:border-[#334155] transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      iv.status === 'completed' ? 'bg-emerald-500/10' :
                      iv.status === 'cancelled' ? 'bg-red-500/10' :
                      'bg-indigo-500/10'
                    }`}>
                      <CalendarCheck size={18} className={
                        iv.status === 'completed' ? 'text-emerald-400' :
                        iv.status === 'cancelled' ? 'text-red-400' :
                        'text-indigo-400'
                      } />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{iv.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(iv.scheduled_start).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <FormatIcon size={12} />
                          {iv.location || iv.format}
                        </span>
                        {iv.meeting_link && (
                          <a href={iv.meeting_link} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                            会议链接
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      iv.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' :
                      iv.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      iv.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      {iv.status === 'scheduled' ? '已安排' :
                       iv.status === 'completed' ? '已完成' :
                       iv.status === 'cancelled' ? '已取消' :
                       iv.status === 'no_show' ? '未出席' : iv.status}
                    </span>
                    {iv.result && (
                      <span className={`flex items-center gap-1 text-xs ${
                        iv.result === 'passed' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {iv.result === 'passed' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {iv.result === 'passed' ? '通过' : '未通过'}
                      </span>
                    )}
                    {iv.rating && (
                      <span className="text-xs text-amber-400">{'★'.repeat(iv.rating)}{'☆'.repeat(5-iv.rating)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
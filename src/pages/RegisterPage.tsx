import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('密码至少需要8个字符'); return; }
    setLoading(true);
    try {
      await register(email, fullName, password);
      navigate('/');
    } catch {
      setError('注册失败，请检查邮箱是否已被使用');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mb-4">
            <Bot size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">创建账号</h1>
          <p className="text-slate-400 mt-2">开始使用 ProjectAI</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-4">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">姓名</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="你的姓名" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">邮箱</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 pl-10 pr-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="your@email.com" required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">密码</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 pl-10 pr-10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="至少8位字符" required />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '注册中...' : '注册'}
          </button>
          <p className="text-center text-sm text-slate-400">
            已有账号？<Link to="/login" className="text-indigo-400 hover:text-indigo-300">立即登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
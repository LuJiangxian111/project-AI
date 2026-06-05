import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock, Eye, EyeOff, X, RefreshCw, Send } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetOk, setResetOk] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const startCountdown = useCallback(() => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || '登录失败，请检查网络连接';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!resetEmail || countdown > 0) return;
    setResetMsg('');
    setSendCodeLoading(true);
    try {
      const res = await api.post('/auth/send-reset-code', { email: resetEmail });
      const msg = res.data.dev_code 
        ? `邮件服务未配置，开发模式验证码：${res.data.dev_code}`
        : (res.data.message || '验证码已发送到您的邮箱');
      setResetMsg(msg);
      startCountdown();
    } catch (err: any) {
      setResetMsg(err?.response?.data?.detail || '发送失败');
    } finally {
      setSendCodeLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode) { setResetMsg('请输入验证码'); return; }
    setResetMsg('');
    setResetLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { email: resetEmail, code: resetCode, new_password: resetPassword });
      setResetMsg(res.data.message || '密码已重置');
      setResetOk(true);
      setTimeout(() => setShowReset(false), 2000);
    } catch (err: any) {
      setResetMsg(err?.response?.data?.detail || '重置失败');
    } finally {
      setResetLoading(false);
    }
  };

  const closeReset = () => {
    setShowReset(false);
    setResetCode('');
    setResetPassword('');
    setResetMsg('');
    setResetOk(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
  };

  return (
    <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mb-4">
            <Bot size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ProjectAI</h1>
          <p className="text-slate-400 mt-2">登录你的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
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
                placeholder="输入密码" required />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? '登录中...' : '登录'}
          </button>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={() => { setShowReset(true); setResetEmail(email); setResetMsg(''); }}
              className="text-slate-500 hover:text-indigo-400 transition-colors">
              忘记密码？
            </button>
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300">立即注册</Link>
          </div>
        </form>
      </div>

      {/* 密码重置弹窗 */}
      {showReset && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={closeReset}>
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <RefreshCw size={16} className="text-indigo-400" /> 重置密码
              </h3>
              <button onClick={closeReset} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReset} className="space-y-3">
              {resetMsg && (
                <div className={`text-sm px-3 py-2 rounded-lg ${resetOk ? 'bg-emerald-500/10 text-emerald-400' : resetMsg.includes('失败') || resetMsg.includes('错误') || resetMsg.includes('过期') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {resetMsg}
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">注册邮箱</label>
                <div className="flex gap-2">
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="your@email.com" required />
                  <button type="button" onClick={handleSendCode} disabled={sendCodeLoading || countdown > 0}
                    className="px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border border-indigo-500/30 flex items-center gap-1.5">
                    {sendCodeLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">验证码</label>
                <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm tracking-[0.3em] text-center focus:border-indigo-500 focus:outline-none"
                  placeholder="输入6位验证码" maxLength={6} required />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">新密码（至少8位）</label>
                <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="输入新密码" required minLength={8} />
              </div>
              <button type="submit" disabled={resetLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {resetLoading ? '重置中...' : '重置密码'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
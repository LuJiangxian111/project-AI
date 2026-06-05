import { useState, useEffect } from 'react';
import {
  User, Key, Save, Plus, Trash2, Check, Eye, EyeOff, Globe, Mail, AlertCircle, Shield
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { LLMConfig } from '../types';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'llm' | 'smtp'>('profile');

  // 个人信息
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');

  // LLM 配置
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [showNewLLM, setShowNewLLM] = useState(false);
  const [newLLM, setNewLLM] = useState({
    name: '', provider: 'openai', api_key: '', base_url: '', model: 'gpt-4',
  });

  useEffect(() => {
    api.get('/users/me/llm-configs').then(res => setConfigs(res.data)).catch(() => {});
  }, []);

  // SMTP 邮件配置
  const [smtpConfig, setSmtpConfig] = useState({
    host: '', port: 587, secure: false, user: '', pass: '',
  });
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState('');
  const [smtpOk, setSmtpOk] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  useEffect(() => {
    if (activeTab === 'smtp') {
      api.get('/system/settings/smtp').then(res => {
        if (res.data.configured) {
          setSmtpConfig({
            host: res.data.host || '',
            port: res.data.port || 587,
            secure: res.data.secure || false,
            user: res.data.user || '',
            pass: res.data.pass || '',
          });
          setSmtpConfigured(true);
        }
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleSaveProfile = async () => {
    await updateUser({ full_name: fullName });
  };

  const handleCreateLLM = async () => {
    try {
      const res = await api.post('/users/me/llm-configs', {
        ...newLLM, is_default: configs.length === 0,
      });
      setConfigs(prev => [...prev, res.data]);
      setShowNewLLM(false);
      setNewLLM({ name: '', provider: 'openai', api_key: '', base_url: '', model: 'gpt-4' });
    } catch {}
  };

  const handleDeleteLLM = async (id: string) => {
    await api.delete(`/users/me/llm-configs/${id}`);
    setConfigs(prev => prev.filter(c => c.id !== id));
  };

  const handleSetDefault = async (id: string) => {
    await api.put(`/users/me/llm-configs/${id}`, { is_default: true });
    setConfigs(prev => prev.map(c => ({ ...c, is_default: c.id === id })));
  };

  const handleSaveSmtp = async () => {
    setSmtpMsg('');
    setSmtpLoading(true);
    setSmtpOk(false);
    try {
      const res = await api.put('/system/settings/smtp', smtpConfig);
      setSmtpMsg(res.data.message || 'SMTP 配置已保存');
      setSmtpOk(true);
      setSmtpConfigured(true);
    } catch (err: any) {
      setSmtpMsg(err?.response?.data?.detail || '保存失败');
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleClearSmtp = async () => {
    setSmtpMsg('');
    setSmtpLoading(true);
    try {
      await api.delete('/system/settings/smtp');
      setSmtpConfig({ host: '', port: 587, secure: false, user: '', pass: '' });
      setSmtpConfigured(false);
      setSmtpMsg('SMTP 配置已清除');
      setSmtpOk(true);
    } catch (err: any) {
      setSmtpMsg(err?.response?.data?.detail || '清除失败');
    } finally {
      setSmtpLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">设置</h2>
        <p className="text-slate-400 mt-1">管理个人资料和 LLM 配置</p>
      </div>

      <div className="flex gap-2 border-b border-[#1e293b]">
        {[
          { key: 'profile' as const, label: '个人资料', icon: User },
          { key: 'llm' as const, label: 'LLM 配置', icon: Key },
          { key: 'smtp' as const, label: '邮件配置', icon: Mail },
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

      {activeTab === 'profile' && (
        <div className="max-w-lg bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">姓名</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">邮箱</label>
            <input value={email} disabled
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-slate-500 text-sm cursor-not-allowed" />
          </div>
          <button onClick={handleSaveProfile}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm">
            <Save size={16} /> 保存
          </button>
        </div>
      )}

      {activeTab === 'llm' && (
        <div className="max-w-2xl space-y-4">
          {configs.map(config => (
            <div key={config.id} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{config.name}</h4>
                    {config.is_default && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">默认</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {config.provider} · {config.model}
                    {config.base_url && <span className="ml-2 flex items-center gap-1"><Globe size={10} /> 自定义API</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!config.is_default && (
                    <button onClick={() => handleSetDefault(config.id)}
                      className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDeleteLLM(config.id)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {showNewLLM ? (
            <div className="bg-[#0f172a] border border-indigo-500/30 rounded-xl p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">配置名称</label>
                  <input value={newLLM.name} onChange={e => setNewLLM({ ...newLLM, name: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="GPT-4" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">提供商</label>
                  <select value={newLLM.provider} onChange={e => setNewLLM({ ...newLLM, provider: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="azure">Azure OpenAI</option>
                    <option value="local">本地模型</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">API 密钥</label>
                <div className="relative">
                  <input type="password" value={newLLM.api_key} onChange={e => setNewLLM({ ...newLLM, api_key: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 pl-3 pr-10 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="sk-..." />
                  <EyeOff size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">API 地址 <span className="text-slate-600">(可选)</span></label>
                  <input value={newLLM.base_url} onChange={e => setNewLLM({ ...newLLM, base_url: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="https://api.openai.com/v1" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">模型</label>
                  <input value={newLLM.model} onChange={e => setNewLLM({ ...newLLM, model: e.target.value })}
                    className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="gpt-4" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleCreateLLM}
                  className="flex-1 bg-indigo-500 text-white py-2 rounded-lg text-sm hover:bg-indigo-600 transition-colors">
                  添加配置
                </button>
                <button onClick={() => setShowNewLLM(false)}
                  className="px-4 py-2 bg-[#1e293b] text-slate-300 rounded-lg text-sm hover:bg-[#334155] transition-colors">
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewLLM(true)}
              className="flex items-center gap-2 px-4 py-3 bg-[#0f172a] border border-dashed border-[#334155] rounded-xl text-sm text-slate-400 hover:text-slate-300 hover:border-[#475569] transition-colors w-full">
              <Plus size={16} /> 添加 LLM 配置
            </button>
          )}
        </div>
      )}

      {activeTab === 'smtp' && (
        <div className="max-w-lg bg-[#0f172a] border border-[#1e293b] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Shield size={16} className="text-indigo-400" />
            配置 SMTP 邮件服务器，用于发送密码重置验证码等邮件
          </div>

          {!smtpConfigured && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-sm">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>邮件服务未配置，密码重置验证码将无法发送到邮箱。请配置 SMTP 服务器。</span>
            </div>
          )}

          {smtpMsg && (
            <div className={`text-sm px-3 py-2 rounded-lg ${smtpOk ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {smtpMsg}
            </div>
          )}

          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">SMTP 服务器地址</label>
            <input value={smtpConfig.host} onChange={e => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="smtp.qq.com" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">端口</label>
              <input type="number" value={smtpConfig.port} onChange={e => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) || 587 })}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">加密方式</label>
              <div className="flex items-center gap-3 mt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={smtpConfig.secure} onChange={e => setSmtpConfig({ ...smtpConfig, secure: e.target.checked })}
                    className="rounded accent-indigo-500" />
                  SSL/TLS (465端口)
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">发件邮箱 / 用户名</label>
            <input value={smtpConfig.user} onChange={e => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="your@email.com" />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">授权码 / 密码</label>
            <div className="relative">
              <input type={showSmtpPass ? 'text' : 'password'} value={smtpConfig.pass}
                onChange={e => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 pl-3 pr-10 text-white text-sm focus:border-indigo-500 focus:outline-none"
                placeholder={smtpConfigured ? '留空则不修改' : '输入 SMTP 授权码'} />
              <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              常用邮箱 SMTP 设置：QQ邮箱 smtp.qq.com:587，163邮箱 smtp.163.com:465(SSL)，需使用授权码而非登录密码
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleSaveSmtp} disabled={smtpLoading}
              className="flex-1 bg-indigo-500 text-white py-2 rounded-lg text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={16} /> {smtpLoading ? '验证中...' : '保存并验证'}
            </button>
            {smtpConfigured && (
              <button onClick={handleClearSmtp} disabled={smtpLoading}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
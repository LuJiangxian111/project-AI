import { useState, useEffect } from 'react';
import {
  User, Key, Save, Plus, Trash2, Check, Eye, EyeOff, Globe
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import type { LLMConfig } from '../types';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'llm'>('profile');

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
    </div>
  );
}
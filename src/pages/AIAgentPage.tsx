import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, FileText, AlertTriangle, Scan } from 'lucide-react';
import api from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const actions = [
  { label: '生成报告', icon: FileText, prompt: '请帮我生成最近一周的项目进度报告' },
  { label: '风险分析', icon: AlertTriangle, prompt: '请分析当前项目存在的潜在风险' },
  { label: '简历筛选', icon: Scan, prompt: '请帮我分析候选人简历的匹配度' },
];

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: '你好！我是 ProjectAI 智能助手。我可以帮你分析项目数据、生成报告、识别风险、筛选简历。请问有什么可以帮助你的？',
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    const userMsg: Message = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai-agent/chat', { message: content });
      const aiMsg: Message = { role: 'assistant', content: res.data.response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI 服务暂时不可用。请检查你的 LLM API 配置。', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      <div className="flex-1 flex flex-col bg-[#0f172a] border border-[#1e293b] rounded-xl">
        <div className="p-4 border-b border-[#1e293b] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI 智能助手</h3>
            <p className="text-xs text-slate-400">Powered by LLM</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-gradient-to-br from-indigo-500 to-cyan-400' : 'bg-[#334155]'
              }`}>
                {msg.role === 'assistant' ? <Bot size={14} className="text-white" /> : <User size={14} className="text-slate-300" />}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-[#1e293b] text-slate-200 rounded-tl-sm'
                  : 'bg-indigo-500/20 text-slate-200 rounded-tr-sm'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <p className="text-[10px] text-slate-600 mt-1.5">
                  {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-[#1e293b] rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-[#1e293b]">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg py-2.5 px-3 text-white text-sm focus:border-indigo-500 focus:outline-none"
              placeholder="输入你的问题..." />
            <button onClick={() => sendMessage(input)} disabled={loading}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-64 space-y-3">
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-indigo-400" /> 快捷操作
          </h4>
          {actions.map((action) => (
            <button key={action.label} onClick={() => sendMessage(action.prompt)}
              className="flex items-center gap-2 w-full px-3 py-2 mb-1.5 text-sm text-slate-300 hover:bg-[#1e293b] rounded-lg transition-colors text-left">
              <action.icon size={14} className="text-slate-500" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
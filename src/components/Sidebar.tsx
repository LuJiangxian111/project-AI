import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, ListTodo, Users,
  Bot, Settings, LogOut, Briefcase, CalendarCheck, Building2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/projects', icon: FolderKanban, label: '项目管理' },
  { to: '/tasks', icon: ListTodo, label: '任务管理' },
  { to: '/marketplace', icon: Building2, label: '需求广场' },
  { to: '/recruitment', icon: Briefcase, label: '招聘管理' },
  { to: '/interviews', icon: CalendarCheck, label: '面试管理' },
  { to: '/ai-agent', icon: Bot, label: 'AI 智能体' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0f172a] border-r border-[#1e293b] flex flex-col z-50">
      <div className="p-6 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">ProjectAI</h1>
            <p className="text-[10px] text-slate-400">智能项目管理</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1e293b]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-200 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          退出登录
        </button>
      </div>
    </aside>
  );
}
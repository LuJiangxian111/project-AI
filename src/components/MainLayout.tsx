import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-white">
      <Sidebar />
      <main className="ml-60 p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
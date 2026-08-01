import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-slate-950 relative">
        <Outlet />
      </main>
    </div>
  );
};

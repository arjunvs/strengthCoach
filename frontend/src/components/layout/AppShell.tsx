import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <Navbar />
      <main className="flex-1 overflow-auto pb-20 md:pb-0 px-4 py-6 md:px-8 max-w-5xl mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Home, Plus, History, BookOpen, Menu, X, ChevronRight, Database, Sparkles } from 'lucide-react';
import type { AppPage } from '../../context/AppContext';

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  dividerBefore?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: Home, description: 'Overview and quick start' },
  { id: 'new-assessment', label: 'New Assessment', icon: Plus, description: 'Start compliance evaluation' },
  { id: 'history', label: 'History', icon: History, description: 'Past evaluations' },
  { id: 'frameworks', label: 'Frameworks', icon: BookOpen, description: 'Browse all frameworks' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: Database, description: 'RAG document index', dividerBefore: true },
  { id: 'skills', label: 'AI Skills', icon: Sparkles, description: 'RAG-powered analysis' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentPage, setCurrentPage } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">ComplianceAI</h1>
            <p className="text-xs text-slate-400">Security Assessment</p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <React.Fragment key={item.id}>
                {item.dividerBefore && (
                  <div className="my-2 border-t border-slate-700 pt-2">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider px-3 mb-1">AI / RAG</p>
                  </div>
                )}
                <button
                  onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                    transition-colors text-sm
                    ${active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs truncate ${active ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {item.description}
                    </div>
                  </div>
                  {active && <ChevronRight size={14} className="text-indigo-300" />}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 text-center">
            ComplianceAI v1.0 &bull; All data stored locally
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {NAV_ITEMS.find(n => n.id === currentPage)?.label ?? 'ComplianceAI'}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-xs font-medium text-emerald-700">Secure &bull; Local Only</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

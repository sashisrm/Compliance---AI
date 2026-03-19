import React, { createContext, useContext, useState } from 'react';
import type { AssessmentResult } from '../types/assessment';

export type AppPage = 'home' | 'new-assessment' | 'report' | 'history' | 'frameworks' | 'knowledge-base' | 'skills';

interface AppContextValue {
  currentPage: AppPage;
  setCurrentPage: (page: AppPage) => void;
  viewingResult: AssessmentResult | null;
  setViewingResult: (result: AssessmentResult | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<AppPage>('home');
  const [viewingResult, setViewingResult] = useState<AssessmentResult | null>(null);

  return (
    <AppContext.Provider value={{ currentPage, setCurrentPage, viewingResult, setViewingResult }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

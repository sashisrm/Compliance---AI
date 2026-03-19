import React, { createContext, useContext } from 'react';
import type { AssessmentResult } from '../types/assessment';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface HistoryContextValue {
  history: AssessmentResult[];
  saveAssessment: (result: AssessmentResult) => void;
  deleteAssessment: (id: string) => void;
  clearAll: () => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useLocalStorage<AssessmentResult[]>('compliance-ai-history', []);

  const saveAssessment = (result: AssessmentResult) => {
    setHistory(prev => {
      const filtered = prev.filter(r => r.id !== result.id);
      const updated = [result, ...filtered];
      // Keep max 50 assessments
      return updated.slice(0, 50);
    });
  };

  const deleteAssessment = (id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
  };

  const clearAll = () => setHistory([]);

  return (
    <HistoryContext.Provider value={{ history, saveAssessment, deleteAssessment, clearAll }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within HistoryProvider');
  return ctx;
}

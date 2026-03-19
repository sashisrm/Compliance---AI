import { AppProvider, useApp } from './context/AppContext';
import { HistoryProvider } from './context/HistoryContext';
import { RAGProvider } from './context/RAGContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { AssessmentWizard } from './components/wizard/AssessmentWizard';
import { ReportPage } from './pages/ReportPage';
import { HistoryPage } from './pages/HistoryPage';
import { FrameworksPage } from './pages/FrameworksPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { SkillsPage } from './pages/SkillsPage';

function AppContent() {
  const { currentPage } = useApp();

  return (
    <AppShell>
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'new-assessment' && <AssessmentWizard />}
      {currentPage === 'report' && <ReportPage />}
      {currentPage === 'history' && <HistoryPage />}
      {currentPage === 'frameworks' && <FrameworksPage />}
      {currentPage === 'knowledge-base' && <KnowledgeBasePage />}
      {currentPage === 'skills' && <SkillsPage />}
    </AppShell>
  );
}

function App() {
  return (
    <HistoryProvider>
      <RAGProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </RAGProvider>
    </HistoryProvider>
  );
}

export default App;

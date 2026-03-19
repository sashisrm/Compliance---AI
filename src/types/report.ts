import type { AssessmentResult } from './assessment';

export type ExportFormat = 'pdf' | 'csv' | 'json';

export interface ReportConfig {
  title: string;
  includeExecutiveSummary: boolean;
  includeFrameworkScores: boolean;
  includeGapAnalysis: boolean;
  includeRemediationPlan: boolean;
  includeControlDetails: boolean;
}

export interface ReportData {
  assessment: AssessmentResult;
  config: ReportConfig;
  generatedAt: string;
}

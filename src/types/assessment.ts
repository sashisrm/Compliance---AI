import type { AnswerValue, ControlSeverity, ControlStatus } from './frameworks';
import type { BusinessRegion, BusinessType, CloudProvider, FrameworkId, ITOTScope } from './filters';

export interface AssessmentProfile {
  organizationName: string;
  assessorName: string;
  businessType: BusinessType;
  businessRegion: BusinessRegion;
  itotScope: ITOTScope;
  cloudProviders: CloudProvider[];
  selectedFrameworks: FrameworkId[];
}

export interface ControlAnswer {
  controlId: string;
  frameworkId: FrameworkId;
  answer: AnswerValue;
  notes?: string;
  evidence?: string;
  answeredAt: string;
}

export interface FrameworkScore {
  frameworkId: FrameworkId;
  totalControls: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  naCount: number;
  notAssessedCount: number;
  scorePercent: number;
  maturityLevel: 1 | 2 | 3 | 4 | 5;
}

export type GapPriority = 'immediate' | 'short-term' | 'medium-term' | 'long-term';

export interface AssessmentGap {
  controlId: string;
  frameworkId: FrameworkId;
  controlTitle: string;
  category: string;
  severity: ControlSeverity;
  status: ControlStatus;
  answer: AnswerValue;
  remediationSteps: string[];
  priority: GapPriority;
}

export interface AssessmentResult {
  id: string;
  profile: AssessmentProfile;
  answers: ControlAnswer[];
  frameworkScores: FrameworkScore[];
  gaps: AssessmentGap[];
  overallScore: number;
  completedAt: string;
  durationMinutes: number;
}

export interface AssessmentSession {
  id: string;
  profile: Partial<AssessmentProfile>;
  currentStep: number;
  answers: ControlAnswer[];
  startedAt: string;
}

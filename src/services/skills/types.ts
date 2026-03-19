import type { RetrievalResult } from '../rag/types';

// ─── Skill IDs ────────────────────────────────────────────────────────────────

export type SkillId =
  | 'framework-analysis'
  | 'gap-enrichment'
  | 'cross-framework'
  | 'remediation-guide'
  | 'control-search';

// ─── Skill result ─────────────────────────────────────────────────────────────

export interface SkillResult {
  skillId: SkillId;
  skillName: string;
  query: string;
  /** Structured markdown analysis (template-based or LLM-generated). */
  analysis: string;
  /** Retrieved evidence chunks from the knowledge base. */
  sources: RetrievalResult[];
  /** Unique source document titles. */
  sourceDocuments: string[];
  executedAt: string;
  /** True if LLM was used for synthesis, false if template-based. */
  llmAssisted: boolean;
}

// ─── Skill parameter shapes ───────────────────────────────────────────────────

export interface FrameworkAnalysisParams {
  frameworkId: string;
}

export interface GapEnrichmentParams {
  frameworkId: string;
  gaps: Array<{
    controlId: string;
    controlTitle: string;
    category: string;
    severity: string;
    priority: string;
    remediationSteps: string[];
  }>;
}

export interface CrossFrameworkParams {
  frameworkIdA: string;
  frameworkIdB: string;
}

export interface RemediationGuideParams {
  controlTitle: string;
  description: string;
  frameworkId: string;
  severity: string;
}

export interface ControlSearchParams {
  query: string;
  frameworkId?: string;
}

export type SkillParams =
  | FrameworkAnalysisParams
  | GapEnrichmentParams
  | CrossFrameworkParams
  | RemediationGuideParams
  | ControlSearchParams;

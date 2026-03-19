import type { ControlAnswer, AssessmentGap, FrameworkScore, AssessmentResult, AssessmentProfile } from '../types/assessment';
import type { Control } from '../types/frameworks';
import type { FrameworkId } from '../types/filters';
import type { FrameworkApplicability } from '../data/business-profiles';
import { FRAMEWORK_MAP } from '../data/frameworks';

export function computeFrameworkScore(
  frameworkId: FrameworkId,
  controls: Control[],
  answers: ControlAnswer[]
): FrameworkScore {
  const applicableControls = controls.filter(c => c.frameworkId === frameworkId);
  const totalControls = applicableControls.length;

  let compliantCount = 0;
  let partialCount = 0;
  let nonCompliantCount = 0;
  let naCount = 0;
  let notAssessedCount = 0;

  for (const control of applicableControls) {
    const answer = answers.find(a => a.controlId === control.id);
    if (!answer) {
      notAssessedCount++;
    } else {
      switch (answer.answer) {
        case 'yes': compliantCount++; break;
        case 'partial': partialCount++; break;
        case 'no': nonCompliantCount++; break;
        case 'na': naCount++; break;
      }
    }
  }

  const applicable = totalControls - naCount;
  const scorePercent = applicable > 0
    ? Math.round(((compliantCount + 0.5 * partialCount) / applicable) * 100)
    : 0;

  const maturityLevel = scoreToMaturity(scorePercent);

  return {
    frameworkId,
    totalControls,
    compliantCount,
    partialCount,
    nonCompliantCount,
    naCount,
    notAssessedCount,
    scorePercent,
    maturityLevel,
  };
}

export function scoreToMaturity(score: number): 1 | 2 | 3 | 4 | 5 {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 55) return 3;
  if (score >= 35) return 2;
  return 1;
}

export const MATURITY_LABELS: Record<number, string> = {
  1: 'Initial',
  2: 'Developing',
  3: 'Defined',
  4: 'Managed',
  5: 'Optimized',
};

export function computeOverallScore(
  frameworkScores: FrameworkScore[],
  applicability: FrameworkApplicability[]
): number {
  if (frameworkScores.length === 0) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const score of frameworkScores) {
    const app = applicability.find(a => a.frameworkId === score.frameworkId);
    const weight = app?.weight ?? 0.5;
    weightedSum += score.scorePercent * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

export type GapPriorityType = 'immediate' | 'short-term' | 'medium-term' | 'long-term';

export function computeGapPriority(severity: string, answer: string): GapPriorityType {
  if (severity === 'critical' && answer === 'no') {
    return 'immediate';
  }
  if (severity === 'critical' && answer === 'partial') return 'short-term';
  if (severity === 'high' && answer === 'no') return 'short-term';
  if (severity === 'high' && answer === 'partial') return 'medium-term';
  if (severity === 'medium') return 'medium-term';
  return 'long-term';
}

export function computeGaps(
  controls: Control[],
  answers: ControlAnswer[]
): AssessmentGap[] {
  const gaps: AssessmentGap[] = [];

  for (const control of controls) {
    const answer = answers.find(a => a.controlId === control.id);
    if (!answer || answer.answer === 'yes' || answer.answer === 'na') continue;

    const priority = computeGapPriority(control.severity, answer.answer);

    gaps.push({
      controlId: control.id,
      frameworkId: control.frameworkId,
      controlTitle: control.title,
      category: control.category,
      severity: control.severity,
      status: answer.answer === 'partial' ? 'partial' : 'non-compliant',
      answer: answer.answer,
      remediationSteps: control.remediationSteps,
      priority,
    });
  }

  // Sort by priority then severity
  const priorityOrder: Record<string, number> = { 'immediate': 0, 'short-term': 1, 'medium-term': 2, 'long-term': 3 };
  const severityOrder: Record<string, number> = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'informational': 4 };

  return gaps.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 3;
    const pb = priorityOrder[b.priority] ?? 3;
    if (pa !== pb) return pa - pb;
    return (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
  });
}

export function buildAssessmentResult(
  sessionId: string,
  profile: AssessmentProfile,
  answers: ControlAnswer[],
  applicability: FrameworkApplicability[],
  startedAt: string
): AssessmentResult {
  const allControls: Control[] = [];
  for (const fwId of profile.selectedFrameworks) {
    const fw = FRAMEWORK_MAP[fwId];
    if (fw) {
      for (const domain of fw.domains) {
        allControls.push(...domain.controls);
      }
    }
  }

  const frameworkScores = profile.selectedFrameworks.map(fwId =>
    computeFrameworkScore(fwId, allControls, answers)
  );

  const gaps = computeGaps(allControls, answers);
  const overallScore = computeOverallScore(frameworkScores, applicability);

  const durationMs = new Date().getTime() - new Date(startedAt).getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  return {
    id: sessionId,
    profile,
    answers,
    frameworkScores,
    gaps,
    overallScore,
    completedAt: new Date().toISOString(),
    durationMinutes,
  };
}

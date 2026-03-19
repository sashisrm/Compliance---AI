import { ragEngine, synthesiseWithLLM } from '../rag/RAGEngine';
import { FRAMEWORK_MAP, ALL_FRAMEWORKS } from '../../data/frameworks';
import type { LLMConfig } from '../rag/types';
import type {
  SkillResult,
  FrameworkAnalysisParams,
  GapEnrichmentParams,
  CrossFrameworkParams,
  RemediationGuideParams,
  ControlSearchParams,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString();
}

function uniqueSources(results: ReturnType<typeof ragEngine.search>): string[] {
  return [...new Set(results.map(r => r.chunk.metadata.source))];
}

// ─── SKILL 1: Framework Analysis ─────────────────────────────────────────────

export async function runFrameworkAnalysis(
  params: FrameworkAnalysisParams,
  llmConfig: LLMConfig
): Promise<SkillResult> {
  const fw = FRAMEWORK_MAP[params.frameworkId as keyof typeof FRAMEWORK_MAP];
  if (!fw) throw new Error(`Unknown framework: ${params.frameworkId}`);

  const query = `${fw.name} ${fw.shortName} requirements controls obligations key provisions`;
  const sources = ragEngine.search(query, { frameworkFilter: params.frameworkId, topK: 10 });

  // Build domain summary from TypeScript control data
  const domainSummary = fw.domains
    .map(d => {
      const critical = d.controls.filter(c => c.severity === 'critical').length;
      const high = d.controls.filter(c => c.severity === 'high').length;
      return `### ${d.name}\n${d.description}\n- Controls: ${d.controls.length} | Critical: ${critical} | High: ${high}`;
    })
    .join('\n\n');

  let analysis: string;
  let llmAssisted = false;

  if (llmConfig.provider !== 'none' && llmConfig.apiKey) {
    const context = ragEngine.formatContext(sources);
    const systemPrompt = `You are a GRC compliance expert. Analyse the given regulatory framework and provide a structured, actionable summary for a compliance officer. Be concise and precise. Format using markdown headings.`;
    const userPrompt = `Framework: ${fw.name} (${fw.shortName}) v${fw.version} — issued by ${fw.issuer}\n\nKnowledge base context:\n${context || '(no additional documents indexed)'}\n\nProvide:\n1. Executive summary (2-3 sentences)\n2. Key obligations by domain\n3. Highest-risk controls\n4. Applicability (regions/industries)\n5. Key compliance actions`;
    try {
      analysis = await synthesiseWithLLM(systemPrompt, userPrompt, llmConfig);
      llmAssisted = true;
    } catch {
      analysis = buildFrameworkAnalysisTemplate(fw, domainSummary, sources);
    }
  } else {
    analysis = buildFrameworkAnalysisTemplate(fw, domainSummary, sources);
  }

  return {
    skillId: 'framework-analysis',
    skillName: 'Framework Analysis',
    query,
    analysis,
    sources,
    sourceDocuments: uniqueSources(sources),
    executedAt: now(),
    llmAssisted,
  };
}

function buildFrameworkAnalysisTemplate(
  fw: ReturnType<typeof FRAMEWORK_MAP[string]>,
  domainSummary: string,
  sources: ReturnType<typeof ragEngine.search>
): string {
  const totalControls = fw.domains.reduce((s, d) => s + d.controls.length, 0);
  const criticalCount = fw.domains.flatMap(d => d.controls).filter(c => c.severity === 'critical').length;
  const highCount = fw.domains.flatMap(d => d.controls).filter(c => c.severity === 'high').length;

  const kbSection = sources.length > 0
    ? `\n\n## Knowledge Base References\n${sources.map((r, i) => `**[${i + 1}]** ${r.chunk.metadata.source} — page ${r.chunk.pageNumber}\n> ${r.highlights[0] ?? r.chunk.text.slice(0, 150)}...`).join('\n\n')}`
    : '\n\n## Knowledge Base References\n*No additional documents indexed for this framework. Upload regulatory PDFs or guidance documents in the Knowledge Base to enrich this analysis.*';

  return `# ${fw.shortName} — Framework Analysis

**Version:** ${fw.version} | **Issuer:** ${fw.issuer}

## Overview
${fw.description}

## Control Coverage
| Metric | Count |
|--------|-------|
| Total Domains | ${fw.domains.length} |
| Total Controls | ${totalControls} |
| Critical Controls | ${criticalCount} |
| High Controls | ${highCount} |

## Domain Breakdown
${domainSummary}

## Applicability
- **Regions:** ${fw.applicableRegions.join(', ')}
- **Business Types:** ${fw.applicableBusinessTypes.join(', ')}
- **Scope:** ${fw.applicableScopes.join(', ')}
${kbSection}`;
}

// ─── SKILL 2: Gap Enrichment ──────────────────────────────────────────────────

export async function runGapEnrichment(
  params: GapEnrichmentParams,
  llmConfig: LLMConfig
): Promise<SkillResult> {
  const fw = FRAMEWORK_MAP[params.frameworkId as keyof typeof FRAMEWORK_MAP];
  const fwName = fw?.shortName ?? params.frameworkId;

  const query = `${fwName} gap remediation implementation steps compliance`;
  const sources = ragEngine.search(query, { frameworkFilter: params.frameworkId, topK: 10 });

  const immediateGaps = params.gaps.filter(g => g.priority === 'immediate');
  const shortTermGaps = params.gaps.filter(g => g.priority === 'short-term');
  const mediumTermGaps = params.gaps.filter(g => g.priority === 'medium-term');
  const longTermGaps = params.gaps.filter(g => g.priority === 'long-term');

  let analysis: string;
  let llmAssisted = false;

  if (llmConfig.provider !== 'none' && llmConfig.apiKey && params.gaps.length > 0) {
    const context = ragEngine.formatContext(sources);
    const gapList = params.gaps.slice(0, 10).map(g =>
      `- [${g.severity.toUpperCase()}] ${g.controlTitle} (${g.category}): ${g.remediationSteps[0] ?? ''}`
    ).join('\n');
    const systemPrompt = `You are a GRC remediation specialist. Based on the identified compliance gaps and knowledge base context, produce a prioritised remediation plan. Be specific and actionable.`;
    const userPrompt = `Framework: ${fwName}\n\nTop compliance gaps:\n${gapList}\n\nKnowledge base context:\n${context || '(none)'}\n\nProvide a concise remediation roadmap with:\n1. Immediate actions (0-30 days)\n2. Short-term actions (30-90 days)\n3. Medium-term actions (90-180 days)\n4. Resources and references from the knowledge base`;
    try {
      analysis = await synthesiseWithLLM(systemPrompt, userPrompt, llmConfig);
      llmAssisted = true;
    } catch {
      analysis = buildGapTemplate(fwName, immediateGaps, shortTermGaps, mediumTermGaps, longTermGaps, sources);
    }
  } else {
    analysis = buildGapTemplate(fwName, immediateGaps, shortTermGaps, mediumTermGaps, longTermGaps, sources);
  }

  return {
    skillId: 'gap-enrichment',
    skillName: 'Gap Analysis & Enrichment',
    query,
    analysis,
    sources,
    sourceDocuments: uniqueSources(sources),
    executedAt: now(),
    llmAssisted,
  };
}

type GapItem = GapEnrichmentParams['gaps'][0];

function buildGapTemplate(
  fwName: string,
  immediate: GapItem[],
  shortTerm: GapItem[],
  mediumTerm: GapItem[],
  longTerm: GapItem[],
  sources: ReturnType<typeof ragEngine.search>
): string {
  const total = immediate.length + shortTerm.length + mediumTerm.length + longTerm.length;

  const renderGaps = (gaps: GapItem[]) =>
    gaps.length === 0
      ? '*None*'
      : gaps.map(g => `- **[${g.severity}]** ${g.controlTitle}\n  - ${g.remediationSteps[0] ?? 'Review control requirements'}`).join('\n');

  const kbSection = sources.length > 0
    ? sources.map((r, i) => `**[${i + 1}]** ${r.chunk.metadata.source} — page ${r.chunk.pageNumber}\n> ${r.highlights[0] ?? r.chunk.text.slice(0, 150)}...`).join('\n\n')
    : '*No additional knowledge base documents found. Upload framework guidance to get enriched remediation advice.*';

  return `# ${fwName} — Gap Enrichment Report

**Total Gaps Identified:** ${total}

## Immediate Actions (0–30 days)
${renderGaps(immediate)}

## Short-Term Actions (30–90 days)
${renderGaps(shortTerm)}

## Medium-Term Actions (90–180 days)
${renderGaps(mediumTerm)}

## Long-Term Actions (180+ days)
${renderGaps(longTerm)}

## Knowledge Base References
${kbSection}`;
}

// ─── SKILL 3: Cross-Framework Comparison ─────────────────────────────────────

export async function runCrossFramework(
  params: CrossFrameworkParams,
  llmConfig: LLMConfig
): Promise<SkillResult> {
  const fwA = FRAMEWORK_MAP[params.frameworkIdA as keyof typeof FRAMEWORK_MAP];
  const fwB = FRAMEWORK_MAP[params.frameworkIdB as keyof typeof FRAMEWORK_MAP];
  if (!fwA || !fwB) throw new Error('One or both frameworks not found');

  const query = `${fwA.shortName} ${fwB.shortName} comparison overlap mapping controls`;
  const sourcesA = ragEngine.search(`${fwA.name} requirements`, { frameworkFilter: params.frameworkIdA, topK: 5 });
  const sourcesB = ragEngine.search(`${fwB.name} requirements`, { frameworkFilter: params.frameworkIdB, topK: 5 });
  const sources = [...sourcesA, ...sourcesB];

  // Find overlapping tags between the two frameworks
  const tagsA = new Set(fwA.domains.flatMap(d => d.controls.flatMap(c => c.tags)));
  const tagsB = new Set(fwB.domains.flatMap(d => d.controls.flatMap(c => c.tags)));
  const overlap = [...tagsA].filter(t => tagsB.has(t));

  let analysis: string;
  let llmAssisted = false;

  if (llmConfig.provider !== 'none' && llmConfig.apiKey) {
    const context = ragEngine.formatContext(sources);
    const systemPrompt = `You are a GRC expert specialising in multi-framework compliance. Provide a comparative analysis of two frameworks, highlighting overlaps, unique requirements, and dual-compliance opportunities.`;
    const userPrompt = `Compare these two frameworks:\n\nFramework A: ${fwA.name} (${fwA.shortName}) — ${fwA.issuer}\nFramework B: ${fwB.name} (${fwB.shortName}) — ${fwB.issuer}\n\nKnowledge base context:\n${context || '(none)'}\n\nProvide:\n1. Key similarities and shared control areas\n2. Unique requirements of each framework\n3. Dual-compliance strategy (controls that satisfy both)\n4. Recommended implementation order`;
    try {
      analysis = await synthesiseWithLLM(systemPrompt, userPrompt, llmConfig);
      llmAssisted = true;
    } catch {
      analysis = buildCrossFrameworkTemplate(fwA, fwB, overlap, sources);
    }
  } else {
    analysis = buildCrossFrameworkTemplate(fwA, fwB, overlap, sources);
  }

  return {
    skillId: 'cross-framework',
    skillName: 'Cross-Framework Comparison',
    query,
    analysis,
    sources,
    sourceDocuments: uniqueSources(sources),
    executedAt: now(),
    llmAssisted,
  };
}

function buildCrossFrameworkTemplate(
  fwA: (typeof ALL_FRAMEWORKS)[0],
  fwB: (typeof ALL_FRAMEWORKS)[0],
  overlap: string[],
  sources: ReturnType<typeof ragEngine.search>
): string {
  const domainsA = fwA.domains.map(d => d.name).join(', ');
  const domainsB = fwB.domains.map(d => d.name).join(', ');

  const kbSection = sources.length > 0
    ? sources.map((r, i) => `**[${i + 1}]** ${r.chunk.metadata.source} — page ${r.chunk.pageNumber}`).join('\n')
    : '*No additional documents indexed.*';

  return `# Cross-Framework Comparison: ${fwA.shortName} vs ${fwB.shortName}

## ${fwA.shortName} — ${fwA.name}
- **Issuer:** ${fwA.issuer} | **Version:** ${fwA.version}
- **Controls:** ${fwA.totalControls} | **Domains:** ${fwA.domains.length}
- **Domains:** ${domainsA}
- **Regions:** ${fwA.applicableRegions.join(', ')}

## ${fwB.shortName} — ${fwB.name}
- **Issuer:** ${fwB.issuer} | **Version:** ${fwB.version}
- **Controls:** ${fwB.totalControls} | **Domains:** ${fwB.domains.length}
- **Domains:** ${domainsB}
- **Regions:** ${fwB.applicableRegions.join(', ')}

## Shared Control Areas
${overlap.length > 0 ? overlap.map(t => `- ${t}`).join('\n') : '*No direct tag overlap detected — frameworks likely cover distinct domains.*'}

## Dual-Compliance Opportunity
Controls addressing **${overlap.slice(0, 5).join(', ')}** can be implemented once to satisfy requirements across both frameworks, reducing duplication effort.

## Recommended Approach
1. Start with ${fwA.shortName} as the primary framework
2. Map ${fwB.shortName} controls to existing ${fwA.shortName} implementations
3. Implement gap controls from ${fwB.shortName} that have no equivalent
4. Maintain a cross-reference register for audit evidence reuse

## Knowledge Base References
${kbSection}`;
}

// ─── SKILL 4: Remediation Guide ───────────────────────────────────────────────

export async function runRemediationGuide(
  params: RemediationGuideParams,
  llmConfig: LLMConfig
): Promise<SkillResult> {
  const fw = FRAMEWORK_MAP[params.frameworkId as keyof typeof FRAMEWORK_MAP];
  const query = `${params.controlTitle} ${params.frameworkId} remediation implementation how to`;
  const sources = ragEngine.search(query, { topK: 8 });

  let analysis: string;
  let llmAssisted = false;

  if (llmConfig.provider !== 'none' && llmConfig.apiKey) {
    const context = ragEngine.formatContext(sources);
    const systemPrompt = `You are a cybersecurity and compliance implementation expert. Provide a detailed, practical remediation guide for the given compliance control. Include technical steps, tooling suggestions, and timelines.`;
    const userPrompt = `Framework: ${fw?.shortName ?? params.frameworkId}\nControl: ${params.controlTitle}\nSeverity: ${params.severity}\nDescription: ${params.description}\n\nKnowledge base context:\n${context || '(none)'}\n\nProvide:\n1. Why this control matters (risk if not addressed)\n2. Step-by-step implementation guide\n3. Tooling and technology recommendations\n4. Evidence to collect for audit\n5. Timeline estimate`;
    try {
      analysis = await synthesiseWithLLM(systemPrompt, userPrompt, llmConfig);
      llmAssisted = true;
    } catch {
      analysis = buildRemediationTemplate(params, sources);
    }
  } else {
    analysis = buildRemediationTemplate(params, sources);
  }

  return {
    skillId: 'remediation-guide',
    skillName: 'Remediation Guide',
    query,
    analysis,
    sources,
    sourceDocuments: uniqueSources(sources),
    executedAt: now(),
    llmAssisted,
  };
}

function buildRemediationTemplate(
  params: RemediationGuideParams,
  sources: ReturnType<typeof ragEngine.search>
): string {
  const kbSection = sources.length > 0
    ? sources.map((r, i) => `**[${i + 1}]** ${r.chunk.metadata.source} — page ${r.chunk.pageNumber}\n> ${r.highlights[0] ?? r.chunk.text.slice(0, 150)}...`).join('\n\n')
    : '*Upload relevant guidance documents to the Knowledge Base for enriched remediation advice.*';

  return `# Remediation Guide: ${params.controlTitle}

**Framework:** ${params.frameworkId} | **Severity:** ${params.severity.toUpperCase()}

## Control Description
${params.description}

## Risk if Not Addressed
A **${params.severity}** severity gap in this control exposes the organisation to regulatory penalties, audit findings, and potential data or operational incidents.

## Implementation Steps
1. Review the current state of this control against the requirement
2. Identify and assign a control owner with accountability
3. Define the target state and acceptance criteria
4. Implement required technical or organisational measures
5. Collect and retain evidence of compliance
6. Schedule regular review to maintain ongoing compliance

## Evidence to Collect for Audit
- Policy documentation referencing the control
- Technical configuration screenshots or exports
- Test results demonstrating effectiveness
- Training records if a human process is involved
- Review logs showing periodic reassessment

## Knowledge Base References
${kbSection}`;
}

// ─── SKILL 5: Control Search ──────────────────────────────────────────────────

export async function runControlSearch(
  params: ControlSearchParams,
  llmConfig: LLMConfig
): Promise<SkillResult> {
  const sources = ragEngine.search(params.query, {
    frameworkFilter: params.frameworkId,
    topK: 10,
  });

  let analysis: string;
  let llmAssisted = false;

  if (llmConfig.provider !== 'none' && llmConfig.apiKey && sources.length > 0) {
    const context = ragEngine.formatContext(sources);
    const systemPrompt = `You are a GRC compliance search assistant. Summarise the most relevant controls and requirements found for the user's query. Cite sources.`;
    const userPrompt = `Search query: "${params.query}"\n${params.frameworkId ? `Framework filter: ${params.frameworkId}` : ''}\n\nRetrieved knowledge:\n${context}\n\nSummarise the most relevant controls and requirements, citing sources by number.`;
    try {
      analysis = await synthesiseWithLLM(systemPrompt, userPrompt, llmConfig);
      llmAssisted = true;
    } catch {
      analysis = buildSearchTemplate(params.query, sources);
    }
  } else {
    analysis = buildSearchTemplate(params.query, sources);
  }

  return {
    skillId: 'control-search',
    skillName: 'Control Search',
    query: params.query,
    analysis,
    sources,
    sourceDocuments: uniqueSources(sources),
    executedAt: now(),
    llmAssisted,
  };
}

function buildSearchTemplate(
  query: string,
  sources: ReturnType<typeof ragEngine.search>
): string {
  if (sources.length === 0) {
    return `# Search Results\n\nNo results found for: **"${query}"**\n\nTry:\n- Using different keywords\n- Removing framework filters\n- Uploading additional documents to the Knowledge Base`;
  }

  const resultList = sources.map((r, i) =>
    `### [${i + 1}] ${r.chunk.metadata.title}\n**Source:** ${r.chunk.metadata.source} | **Score:** ${r.score}\n\n${r.chunk.text.slice(0, 400)}...`
  ).join('\n\n---\n\n');

  return `# Search Results for: "${query}"

**${sources.length} result(s) found** across ${[...new Set(sources.map(r => r.chunk.metadata.source))].length} source(s)

${resultList}`;
}

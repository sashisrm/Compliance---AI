import { useState } from 'react';
import { useRAG } from '../context/RAGContext';
import { useHistory } from '../context/HistoryContext';
import { ALL_FRAMEWORKS } from '../data/frameworks';
import {
  Sparkles, BookOpen, GitCompare, Wrench, Search,
  Loader, ChevronDown, ChevronRight, ExternalLink, Cpu,
  AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import type { SkillResult } from '../services/skills/types';

// ─── Simple markdown renderer ─────────────────────────────────────────────────

function MarkdownBlock({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-bold text-slate-800 mt-4 mb-1">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-bold text-slate-900 mt-5 mb-2 border-b border-slate-200 pb-1">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold text-slate-900 mt-0 mb-3">{line.slice(2)}</h1>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="border-l-3 border-amber-400 bg-amber-50 pl-3 py-1 text-sm text-slate-700 my-1">{line.slice(2)}</blockquote>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={i} className="text-sm text-slate-700 ml-4 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<li key={i} className="text-sm text-slate-700 ml-4 list-decimal">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>);
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} className="my-3 border-slate-200" />);
    } else if (line.startsWith('|')) {
      // Table row — simplified
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      const isHeader = lines[i + 1]?.includes('---');
      if (!lines[i - 1]?.includes('---')) {
        elements.push(
          <div key={i} className={`grid text-xs py-1 border-b border-slate-100 ${isHeader ? 'font-semibold text-slate-700 bg-slate-50' : 'text-slate-600'}`}
            style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
            {cells.map((c, j) => <span key={j} className="px-2 py-0.5">{c}</span>)}
          </div>
        );
      }
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(<p key={i} className="text-sm text-slate-700 leading-relaxed">{renderInline(line)}</p>);
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>
      : part
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: SkillResult }) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <Sparkles size={15} className="text-indigo-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">{result.skillName}</p>
          <p className="text-xs text-slate-500">{new Date(result.executedAt).toLocaleString()} · {result.sources.length} sources</p>
        </div>
        <div className="flex items-center gap-2">
          {result.llmAssisted
            ? <span className="text-xs flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full"><Cpu size={11} /> AI Synthesis</span>
            : <span className="text-xs flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"><CheckCircle size={11} /> Template</span>}
        </div>
      </div>

      {/* Analysis */}
      <div className="px-5 py-4">
        <MarkdownBlock text={result.analysis} />
      </div>

      {/* Sources toggle */}
      {result.sources.length > 0 && (
        <div className="border-t border-slate-100">
          <button
            onClick={() => setShowSources(s => !s)}
            className="w-full flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {showSources ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {result.sources.length} knowledge base source(s) retrieved
          </button>
          {showSources && (
            <div className="px-5 pb-4 space-y-2">
              {result.sources.map((r, i) => (
                <div key={r.chunk.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-medium text-slate-700">[{i + 1}] {r.chunk.metadata.title}</p>
                    <span className="text-xs font-mono text-slate-400 flex-shrink-0">score: {r.score}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{r.chunk.metadata.source} · page {r.chunk.pageNumber}</p>
                  {r.highlights.map((h, j) => (
                    <p key={j} className="text-xs text-slate-700 bg-amber-50 border-l-2 border-amber-400 px-2 py-0.5 mt-1">{h}</p>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Individual skill panels ──────────────────────────────────────────────────

function FrameworkAnalysisSkill({ onResult }: { onResult: (r: SkillResult) => void }) {
  const { runSkill } = useRAG();
  const [frameworkId, setFrameworkId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!frameworkId) { setError('Select a framework'); return; }
    setError(''); setLoading(true);
    try { onResult(await runSkill('framework-analysis', { frameworkId })); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Get a comprehensive analysis of a framework — domain breakdown, control counts, applicability, and knowledge base references.</p>
      <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={frameworkId} onChange={e => setFrameworkId(e.target.value)}>
        <option value="">— Select Framework —</option>
        {ALL_FRAMEWORKS.map(fw => <option key={fw.id} value={fw.id}>{fw.shortName} — {fw.name}</option>)}
      </select>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      <button onClick={run} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
        {loading ? <><Loader size={14} className="animate-spin" /> Analysing...</> : <><BookOpen size={14} /> Analyse Framework</>}
      </button>
    </div>
  );
}

function GapEnrichmentSkill({ onResult }: { onResult: (r: SkillResult) => void }) {
  const { runSkill } = useRAG();
  const { history } = useHistory();
  const [assessmentId, setAssessmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!assessmentId) { setError('Select an assessment'); return; }
    const assessment = history.find(h => h.id === assessmentId);
    if (!assessment) { setError('Assessment not found'); return; }

    const allGaps = assessment.gaps.slice(0, 20).map(g => ({
      controlId: g.controlId,
      controlTitle: g.controlTitle,
      category: g.category,
      severity: g.severity,
      priority: g.priority,
      remediationSteps: g.remediationSteps,
    }));

    const frameworkId = assessment.profile.selectedFrameworks[0] ?? '';
    setError(''); setLoading(true);
    try { onResult(await runSkill('gap-enrichment', { frameworkId, gaps: allGaps })); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Select a completed assessment to get a prioritised remediation roadmap enriched with knowledge base references.</p>
      {history.length === 0 ? (
        <p className="text-sm text-amber-600 flex items-center gap-1"><AlertCircle size={14} /> No completed assessments found. Complete an assessment first.</p>
      ) : (
        <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={assessmentId} onChange={e => setAssessmentId(e.target.value)}>
          <option value="">— Select Assessment —</option>
          {history.map(h => (
            <option key={h.id} value={h.id}>
              {h.profile.organizationName} · {h.profile.selectedFrameworks.join(', ')} · {new Date(h.completedAt).toLocaleDateString()} · Score: {h.overallScore}%
            </option>
          ))}
        </select>
      )}
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      <button onClick={run} disabled={loading || history.length === 0} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
        {loading ? <><Loader size={14} className="animate-spin" /> Enriching...</> : <><Sparkles size={14} /> Enrich Gap Analysis</>}
      </button>
    </div>
  );
}

function CrossFrameworkSkill({ onResult }: { onResult: (r: SkillResult) => void }) {
  const { runSkill } = useRAG();
  const [fwA, setFwA] = useState('');
  const [fwB, setFwB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!fwA || !fwB) { setError('Select both frameworks'); return; }
    if (fwA === fwB) { setError('Select two different frameworks'); return; }
    setError(''); setLoading(true);
    try { onResult(await runSkill('cross-framework', { frameworkIdA: fwA, frameworkIdB: fwB })); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Compare two frameworks to identify overlaps, unique requirements, and dual-compliance opportunities.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Framework A</label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={fwA} onChange={e => setFwA(e.target.value)}>
            <option value="">— Select —</option>
            {ALL_FRAMEWORKS.map(fw => <option key={fw.id} value={fw.id}>{fw.shortName}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Framework B</label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={fwB} onChange={e => setFwB(e.target.value)}>
            <option value="">— Select —</option>
            {ALL_FRAMEWORKS.map(fw => <option key={fw.id} value={fw.id}>{fw.shortName}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      <button onClick={run} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
        {loading ? <><Loader size={14} className="animate-spin" /> Comparing...</> : <><GitCompare size={14} /> Compare Frameworks</>}
      </button>
    </div>
  );
}

function ControlSearchSkill({ onResult }: { onResult: (r: SkillResult) => void }) {
  const { runSkill } = useRAG();
  const [query, setQuery] = useState('');
  const [frameworkId, setFrameworkId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!query.trim()) { setError('Enter a search query'); return; }
    setError(''); setLoading(true);
    try { onResult(await runSkill('control-search', { query, frameworkId: frameworkId || undefined })); }
    catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Search across all indexed controls and documents for specific requirements, topics, or obligations.</p>
      <input
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
        placeholder="e.g. 'SBOM requirements', 'bias testing', 'human oversight', 'data retention'"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && run()}
      />
      <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={frameworkId} onChange={e => setFrameworkId(e.target.value)}>
        <option value="">All frameworks</option>
        {ALL_FRAMEWORKS.map(fw => <option key={fw.id} value={fw.id}>{fw.shortName}</option>)}
      </select>
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      <button onClick={run} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
        {loading ? <><Loader size={14} className="animate-spin" /> Searching...</> : <><Search size={14} /> Search Controls</>}
      </button>
    </div>
  );
}

function RemediationGuideSkill({ onResult }: { onResult: (r: SkillResult) => void }) {
  const { runSkill } = useRAG();
  const { history } = useHistory();
  const [assessmentId, setAssessmentId] = useState('');
  const [gapIdx, setGapIdx] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedAssessment = history.find(h => h.id === assessmentId);
  const gaps = selectedAssessment?.gaps ?? [];

  const run = async () => {
    if (!assessmentId || gapIdx === '') { setError('Select an assessment and gap'); return; }
    const gap = gaps[Number(gapIdx)];
    if (!gap) { setError('Gap not found'); return; }
    setError(''); setLoading(true);
    try {
      const fw = selectedAssessment?.profile.selectedFrameworks[0] ?? gap.frameworkId;
      onResult(await runSkill('remediation-guide', {
        controlTitle: gap.controlTitle,
        description: `${gap.category} — ${gap.severity} severity gap`,
        frameworkId: fw,
        severity: gap.severity,
      }));
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Generate a detailed remediation guide for a specific compliance gap, enriched with knowledge base references.</p>
      {history.length === 0 ? (
        <p className="text-sm text-amber-600 flex items-center gap-1"><AlertCircle size={14} /> Complete an assessment to access gap-specific guidance.</p>
      ) : (
        <>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={assessmentId} onChange={e => { setAssessmentId(e.target.value); setGapIdx(''); }}>
            <option value="">— Select Assessment —</option>
            {history.map(h => <option key={h.id} value={h.id}>{h.profile.organizationName} · {new Date(h.completedAt).toLocaleDateString()}</option>)}
          </select>
          {gaps.length > 0 && (
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" value={gapIdx} onChange={e => setGapIdx(e.target.value)}>
              <option value="">— Select Gap —</option>
              {gaps.slice(0, 30).map((g, i) => (
                <option key={g.controlId} value={i}>[{g.severity.toUpperCase()}] {g.controlTitle} ({g.priority})</option>
              ))}
            </select>
          )}
        </>
      )}
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      <button onClick={run} disabled={loading || history.length === 0} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
        {loading ? <><Loader size={14} className="animate-spin" /> Generating...</> : <><Wrench size={14} /> Generate Remediation Guide</>}
      </button>
    </div>
  );
}

// ─── Main Skills Page ─────────────────────────────────────────────────────────

type ActiveSkill = 'framework-analysis' | 'gap-enrichment' | 'cross-framework' | 'control-search' | 'remediation-guide';

const SKILL_META: { id: ActiveSkill; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  { id: 'framework-analysis', label: 'Framework Analysis', description: 'Deep-dive into any compliance framework', icon: <BookOpen size={18} />, color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'gap-enrichment', label: 'Gap Enrichment', description: 'Enrich assessment gaps with KB references', icon: <Sparkles size={18} />, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { id: 'cross-framework', label: 'Cross-Framework', description: 'Compare and map between frameworks', icon: <GitCompare size={18} />, color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { id: 'control-search', label: 'Control Search', description: 'Search controls and documents by topic', icon: <Search size={18} />, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { id: 'remediation-guide', label: 'Remediation Guide', description: 'Step-by-step fix for a specific gap', icon: <Wrench size={18} />, color: 'bg-amber-50 border-amber-200 text-amber-700' },
];

export function SkillsPage() {
  const { isReady, totalChunks, llmConfig } = useRAG();
  const [activeSkill, setActiveSkill] = useState<ActiveSkill>('framework-analysis');
  const [results, setResults] = useState<SkillResult[]>([]);

  const addResult = (r: SkillResult) => setResults(prev => [r, ...prev]);

  const active = SKILL_META.find(s => s.id === activeSkill)!;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-indigo-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">AI Skills</h1>
          <p className="text-sm text-slate-500">RAG-powered compliance analysis — {totalChunks.toLocaleString()} chunks indexed</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {llmConfig.provider !== 'none' && llmConfig.apiKey
            ? <span className="text-xs flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"><Cpu size={11} /> {llmConfig.provider} enabled</span>
            : <span className="text-xs flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-1 rounded-full"><Clock size={11} /> Template mode</span>
          }
          {!isReady && <span className="text-xs flex items-center gap-1 text-amber-600"><Loader size={11} className="animate-spin" /> Indexing...</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Skill selector + active skill panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <p className="text-xs font-semibold text-slate-500 px-4 py-2.5 border-b border-slate-100 uppercase tracking-wide">Available Skills</p>
            {SKILL_META.map(skill => (
              <button
                key={skill.id}
                onClick={() => setActiveSkill(skill.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-slate-50 transition-colors ${activeSkill === skill.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${activeSkill === skill.id ? skill.color : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                  {skill.icon}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${activeSkill === skill.id ? 'text-indigo-700' : 'text-slate-700'}`}>{skill.label}</p>
                  <p className="text-xs text-slate-500 truncate">{skill.description}</p>
                </div>
                {activeSkill === skill.id && <ChevronRight size={14} className="text-indigo-400 ml-auto mt-1 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Active skill inputs */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg border ${active.color}`}>
              {active.icon}
              <p className="text-sm font-semibold">{active.label}</p>
            </div>
            {activeSkill === 'framework-analysis' && <FrameworkAnalysisSkill onResult={addResult} />}
            {activeSkill === 'gap-enrichment' && <GapEnrichmentSkill onResult={addResult} />}
            {activeSkill === 'cross-framework' && <CrossFrameworkSkill onResult={addResult} />}
            {activeSkill === 'control-search' && <ControlSearchSkill onResult={addResult} />}
            {activeSkill === 'remediation-guide' && <RemediationGuideSkill onResult={addResult} />}
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
              <Sparkles size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No results yet</p>
              <p className="text-slate-400 text-sm mt-1">Select a skill on the left and run it to see RAG-powered analysis here.</p>
              <div className="mt-4 text-xs text-slate-400 space-y-1">
                <p>{totalChunks.toLocaleString()} page chunks indexed and ready</p>
                <p>Upload additional documents in <strong>Knowledge Base → Add Document</strong></p>
                {llmConfig.provider === 'none' && <p className="text-amber-600">Configure an LLM in <strong>Knowledge Base → AI Settings</strong> for richer synthesis</p>}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{results.length} result(s)</p>
                <button onClick={() => setResults([])} className="text-xs text-red-500 hover:text-red-700">Clear all</button>
              </div>
              {results.map((r, i) => <ResultCard key={`${r.skillId}-${i}`} result={r} />)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

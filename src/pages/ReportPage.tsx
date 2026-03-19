import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FRAMEWORK_MAP } from '../data/frameworks';
import { MATURITY_LABELS } from '../utils/scoring';
import { exportJSON, exportCSV, exportPDF } from '../utils/exportUtils';
import { BUSINESS_TYPE_LABELS, REGION_LABELS, ITOT_LABELS, CLOUD_PROVIDER_LABELS } from '../types/filters';
import type { AssessmentResult } from '../types/assessment';
import {
  ArrowLeft, FileJson, FileSpreadsheet, FileText,
  Shield, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronRight
} from 'lucide-react';

const PRIORITY_COLORS = {
  'immediate': 'bg-red-100 text-red-700 border-red-300',
  'short-term': 'bg-orange-100 text-orange-700 border-orange-300',
  'medium-term': 'bg-amber-100 text-amber-700 border-amber-300',
  'long-term': 'bg-slate-100 text-slate-600 border-slate-300',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
  informational: 'bg-slate-100 text-slate-600',
};

function ScoreGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const r = size === 'lg' ? 52 : size === 'md' ? 38 : 28;
  const cx = size === 'lg' ? 60 : size === 'md' ? 44 : 32;
  const strokeW = size === 'lg' ? 8 : 6;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const svgSize = cx * 2;
  const fontSize = size === 'lg' ? 20 : size === 'md' ? 14 : 10;

  return (
    <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeW}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx + fontSize * 0.4} textAnchor="middle" fill={color} fontSize={fontSize} fontWeight="bold">
        {score}%
      </text>
    </svg>
  );
}

function FrameworkScoreCard({ score }: { score: ReturnType<typeof useApp>['viewingResult'] extends null ? never : NonNullable<ReturnType<typeof useApp>['viewingResult']>['frameworkScores'][0] }) {
  const fw = FRAMEWORK_MAP[score.frameworkId];
  const pct = score.scorePercent;
  const color = pct >= 80 ? 'border-emerald-300 bg-emerald-50' : pct >= 60 ? 'border-amber-300 bg-amber-50' : 'border-red-300 bg-red-50';
  const textColor = pct >= 80 ? 'text-emerald-700' : pct >= 60 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`font-bold text-sm ${textColor}`}>{fw?.shortName ?? score.frameworkId}</h3>
          <p className="text-xs text-slate-500">{fw?.issuer} &bull; v{fw?.version}</p>
        </div>
        <ScoreGauge score={pct} size="sm" />
      </div>

      <div className="text-xs font-semibold mb-2">
        Level {score.maturityLevel}: {MATURITY_LABELS[score.maturityLevel]}
      </div>

      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'OK', value: score.compliantCount, color: 'text-emerald-600' },
          { label: 'Part.', value: score.partialCount, color: 'text-amber-600' },
          { label: 'Gap', value: score.nonCompliantCount, color: 'text-red-600' },
          { label: 'N/A', value: score.naCount, color: 'text-slate-400' },
        ].map(item => (
          <div key={item.label}>
            <div className={`text-sm font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportPage() {
  const { viewingResult, setCurrentPage } = useApp();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [expandedGapFw, setExpandedGapFw] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'summary' | 'scores' | 'gaps' | 'remediation'>('summary');

  if (!viewingResult) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">No report to display. Start a new assessment.</p>
        <button onClick={() => setCurrentPage('new-assessment')} className="mt-4 text-indigo-600 underline text-sm">
          Start Assessment
        </button>
      </div>
    );
  }

  const r: AssessmentResult = viewingResult;
  const immediateGaps = r.gaps.filter(g => g.priority === 'immediate');

  const handlePDF = async () => {
    setExportingPdf(true);
    await exportPDF(r);
    setExportingPdf(false);
  };

  const toggleGapFw = (fwId: string) => {
    setExpandedGapFw(prev => {
      const n = new Set(prev);
      if (n.has(fwId)) n.delete(fwId); else n.add(fwId);
      return n;
    });
  };

  // Group gaps by framework
  const gapsByFramework = r.gaps.reduce((acc, gap) => {
    if (!acc[gap.frameworkId]) acc[gap.frameworkId] = [];
    acc[gap.frameworkId].push(gap);
    return acc;
  }, {} as Record<string, typeof r.gaps>);

  const TABS = [
    { id: 'summary', label: 'Executive Summary' },
    { id: 'scores', label: 'Framework Scores' },
    { id: 'gaps', label: `Gaps (${r.gaps.length})` },
    { id: 'remediation', label: 'Remediation Plan' },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <button
          onClick={() => setCurrentPage('home')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-bold text-slate-900 flex-1">Compliance Report</h1>

        {/* Export buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handlePDF}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50"
          >
            <FileText size={14} />
            {exportingPdf ? 'Generating...' : 'Export PDF'}
          </button>
          <button
            onClick={() => exportCSV(r)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
          <button
            onClick={() => exportJSON(r)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors"
          >
            <FileJson size={14} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Cover card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">{r.profile.organizationName}</h2>
            <p className="text-indigo-200 text-sm">{BUSINESS_TYPE_LABELS[r.profile.businessType]} &bull; {REGION_LABELS[r.profile.businessRegion]}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-300 flex-wrap">
              <span className="flex items-center gap-1"><Clock size={12} />{new Date(r.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>Assessor: {r.profile.assessorName}</span>
              <span>{ITOT_LABELS[r.profile.itotScope]}</span>
            </div>
          </div>
          <div className="text-center">
            <ScoreGauge score={r.overallScore} size="lg" />
            <div className="text-xs text-indigo-200 mt-1">Overall Score</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { label: 'Frameworks', value: r.frameworkScores.length },
            { label: 'Total Gaps', value: r.gaps.length, warn: r.gaps.length > 0 },
            { label: 'Critical', value: immediateGaps.length, critical: immediateGaps.length > 0 },
            { label: 'Duration', value: `${r.durationMinutes}m` },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
              <div className={`text-xl font-bold ${stat.critical ? 'text-red-400' : stat.warn ? 'text-amber-400' : 'text-white'}`}>
                {stat.value}
              </div>
              <div className="text-xs text-indigo-200">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Shield size={16} className="text-indigo-600" /> Executive Summary
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              This compliance assessment was conducted for <strong>{r.profile.organizationName}</strong> on{' '}
              {new Date(r.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} by{' '}
              <strong>{r.profile.assessorName}</strong>. The organization operates as a{' '}
              <strong>{BUSINESS_TYPE_LABELS[r.profile.businessType]}</strong> business in the{' '}
              <strong>{REGION_LABELS[r.profile.businessRegion]}</strong> region.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">
              The assessment covered <strong>{r.profile.selectedFrameworks.length} compliance framework(s)</strong>:{' '}
              {r.profile.selectedFrameworks.map(id => FRAMEWORK_MAP[id]?.shortName ?? id).join(', ')}.
              A total of <strong>{r.answers.length} controls</strong> were evaluated across{' '}
              <strong>{r.frameworkScores.reduce((s, f) => s + f.totalControls, 0)} control requirements</strong>.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">
              The overall compliance score is <strong>{r.overallScore}%</strong>.{' '}
              {r.overallScore >= 80 ? 'The organization demonstrates a strong compliance posture.' :
               r.overallScore >= 60 ? 'The organization has a developing compliance posture with room for improvement.' :
               'Significant compliance gaps exist and immediate remediation action is recommended.'}
            </p>
          </div>

          {/* Top risks */}
          {immediateGaps.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                Immediate Actions Required ({immediateGaps.length})
              </h3>
              <div className="space-y-2">
                {immediateGaps.slice(0, 5).map(gap => (
                  <div key={gap.controlId} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-red-800">{gap.controlTitle}</span>
                      <span className="text-xs text-red-600 ml-2">({FRAMEWORK_MAP[gap.frameworkId]?.shortName})</span>
                    </div>
                  </div>
                ))}
                {immediateGaps.length > 5 && (
                  <p className="text-xs text-red-600">... and {immediateGaps.length - 5} more critical gaps. See Gap Analysis tab.</p>
                )}
              </div>
            </div>
          )}

          {/* Profile summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Assessment Profile</h4>
              <dl className="space-y-2">
                {[
                  { label: 'Scope', value: ITOT_LABELS[r.profile.itotScope] },
                  { label: 'Cloud', value: r.profile.cloudProviders.map(p => CLOUD_PROVIDER_LABELS[p]?.split(' (')[0]).join(', ') || 'None' },
                  { label: 'Frameworks', value: r.frameworkScores.length.toString() },
                  { label: 'Controls', value: r.answers.length.toString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-2">
                    <dt className="text-xs text-slate-500 w-20">{label}:</dt>
                    <dd className="text-xs font-medium text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Compliance Status</h4>
              <dl className="space-y-2">
                {[
                  { label: 'Compliant', value: r.answers.filter(a => a.answer === 'yes').length, color: 'text-emerald-600' },
                  { label: 'Partial', value: r.answers.filter(a => a.answer === 'partial').length, color: 'text-amber-600' },
                  { label: 'Non-Compliant', value: r.answers.filter(a => a.answer === 'no').length, color: 'text-red-600' },
                  { label: 'Not Applicable', value: r.answers.filter(a => a.answer === 'na').length, color: 'text-slate-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <dt className="text-xs text-slate-500 w-24">{label}:</dt>
                    <dd className={`text-xs font-bold ${color}`}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scores' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {r.frameworkScores.map(score => (
              <FrameworkScoreCard key={score.frameworkId} score={score} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'gaps' && (
        <div className="space-y-4">
          {r.gaps.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900">No gaps identified!</h3>
              <p className="text-slate-500 text-sm mt-1">All assessed controls are compliant.</p>
            </div>
          ) : (
            Object.entries(gapsByFramework).map(([fwId, gaps]) => {
              const fw = FRAMEWORK_MAP[fwId as keyof typeof FRAMEWORK_MAP];
              const isExpanded = expandedGapFw.has(fwId);
              return (
                <div key={fwId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => toggleGapFw(fwId)}
                    className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div className="flex-1">
                      <span className="font-semibold text-sm">{fw?.shortName ?? fwId}</span>
                      <span className="text-xs text-slate-500 ml-2">{gaps.length} gap{gaps.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex gap-2">
                      {(['immediate', 'short-term', 'medium-term', 'long-term'] as const).map(p => {
                        const count = gaps.filter(g => g.priority === p).length;
                        return count > 0 ? (
                          <span key={p} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[p]}`}>
                            {count} {p.split('-')[0]}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {gaps.map(gap => (
                        <div key={gap.controlId} className="border border-slate-100 rounded-xl p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[gap.severity] ?? ''}`}>{gap.severity}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[gap.priority]}`}>{gap.priority}</span>
                                <span className="text-xs text-slate-500 font-mono">{gap.controlId}</span>
                              </div>
                              <h4 className="text-sm font-semibold text-slate-900">{gap.controlTitle}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{gap.category}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-medium text-slate-700 mb-1">Remediation:</p>
                            <ul className="space-y-1">
                              {gap.remediationSteps.map((step, i) => (
                                <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                  <span className="text-indigo-500 font-bold">{i + 1}.</span>{step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'remediation' && (
        <div className="space-y-6">
          {(['immediate', 'short-term', 'medium-term', 'long-term'] as const).map(priority => {
            const gaps = r.gaps.filter(g => g.priority === priority);
            if (gaps.length === 0) return null;
            const labels = {
              'immediate': { title: 'Immediate Actions', desc: 'Critical gaps requiring urgent attention', color: 'bg-red-50 border-red-200', titleColor: 'text-red-800' },
              'short-term': { title: 'Short-term Actions', desc: 'High priority gaps (within 30 days)', color: 'bg-orange-50 border-orange-200', titleColor: 'text-orange-800' },
              'medium-term': { title: 'Medium-term Actions', desc: 'Medium priority gaps (within 90 days)', color: 'bg-amber-50 border-amber-200', titleColor: 'text-amber-800' },
              'long-term': { title: 'Long-term Actions', desc: 'Low priority gaps (within 12 months)', color: 'bg-slate-50 border-slate-200', titleColor: 'text-slate-700' },
            };
            const meta = labels[priority];
            return (
              <div key={priority} className={`rounded-xl border p-4 ${meta.color}`}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-bold text-sm ${meta.titleColor}`}>{meta.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[priority]}`}>{gaps.length}</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{meta.desc}</p>
                <div className="space-y-3">
                  {gaps.map((gap, idx) => (
                    <div key={gap.controlId} className="bg-white rounded-xl p-3 border border-white/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{idx + 1}</span>
                        <div>
                          <span className="text-sm font-semibold text-slate-900">{gap.controlTitle}</span>
                          <span className="text-xs text-slate-500 ml-2">{FRAMEWORK_MAP[gap.frameworkId]?.shortName} / {gap.controlId}</span>
                        </div>
                      </div>
                      <ul className="space-y-1 ml-7">
                        {gap.remediationSteps.map((step, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                            <CheckCircle size={11} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useHistory } from '../context/HistoryContext';
import { useApp } from '../context/AppContext';
import { FRAMEWORK_MAP } from '../data/frameworks';
import { BUSINESS_TYPE_LABELS, REGION_LABELS } from '../types/filters';
import { Clock, Trash2, Eye, Plus, Download } from 'lucide-react';
import { exportJSON } from '../utils/exportUtils';

export function HistoryPage() {
  const { history, deleteAssessment, clearAll } = useHistory();
  const { setCurrentPage, setViewingResult } = useApp();
  const [confirmClear, setConfirmClear] = useState(false);

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';

  const scoreBg = (score: number) =>
    score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  if (history.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No assessment history</h3>
          <p className="text-slate-500 text-sm mb-6">Completed assessments will appear here. All data is stored locally in your browser.</p>
          <button
            onClick={() => setCurrentPage('new-assessment')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus size={18} />
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assessment History</h2>
          <p className="text-slate-500 text-sm">{history.length} assessment{history.length !== 1 ? 's' : ''} stored locally</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage('new-assessment')}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Assessment
          </button>
          {confirmClear ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Clear all?</span>
              <button
                onClick={() => { clearAll(); setConfirmClear(false); }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium"
              >
                Yes, clear
              </button>
              <button onClick={() => setConfirmClear(false)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {history.map(result => (
          <div
            key={result.id}
            className={`bg-white rounded-xl border ${scoreBg(result.overallScore)} p-5 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h3 className="font-bold text-slate-900">{result.profile.organizationName}</h3>
                  <span className={`text-lg font-bold ${scoreColor(result.overallScore)}`}>{result.overallScore}%</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {result.profile.selectedFrameworks.map(fwId => (
                    <span key={fwId} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {FRAMEWORK_MAP[fwId]?.shortName ?? fwId}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span>{BUSINESS_TYPE_LABELS[result.profile.businessType]}</span>
                  <span>&bull;</span>
                  <span>{REGION_LABELS[result.profile.businessRegion]}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(result.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                  <span>&bull;</span>
                  <span>Assessor: {result.profile.assessorName}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-sm font-bold text-amber-600">{result.gaps.length}</div>
                  <div className="text-xs text-slate-500">Gaps</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-red-600">{result.gaps.filter(g => g.priority === 'immediate').length}</div>
                  <div className="text-xs text-slate-500">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-600">{result.profile.selectedFrameworks.length}</div>
                  <div className="text-xs text-slate-500">Frameworks</div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setViewingResult(result); setCurrentPage('report'); }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View Report"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => exportJSON(result)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Export JSON"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => deleteAssessment(result.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Score bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Compliance Score</span>
                <span>{result.overallScore}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${result.overallScore >= 80 ? 'bg-emerald-500' : result.overallScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${result.overallScore}%` }}
                />
              </div>
            </div>

            {/* Per-framework mini scores */}
            <div className="flex flex-wrap gap-2 mt-3">
              {result.frameworkScores.map(score => {
                const fw = FRAMEWORK_MAP[score.frameworkId];
                const c = score.scorePercent >= 80 ? 'text-emerald-600 bg-emerald-50' : score.scorePercent >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                return (
                  <div key={score.frameworkId} className={`text-xs px-2 py-1 rounded-lg ${c} font-medium`}>
                    {fw?.shortName}: {score.scorePercent}%
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

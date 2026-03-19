import { Shield, Plus, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHistory } from '../context/HistoryContext';
import { FRAMEWORK_MAP } from '../data/frameworks';
import { BUSINESS_TYPE_LABELS, REGION_LABELS } from '../types/filters';

export function HomePage() {
  const { setCurrentPage, setViewingResult } = useApp();
  const { history } = useHistory();

  const totalAssessments = history.length;
  const avgScore = history.length > 0
    ? Math.round(history.reduce((s, r) => s + r.overallScore, 0) / history.length)
    : 0;
  const totalGaps = history.reduce((s, r) => s + r.gaps.length, 0);
  const criticalGaps = history.reduce((s, r) => s + r.gaps.filter(g => g.priority === 'immediate').length, 0);

  const recentHistory = history.slice(0, 5);

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = (score: number) =>
    score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Hero */}
      <div className="mb-8 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-8 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ComplianceAI</h1>
              <p className="text-indigo-200 text-sm">Security & Compliance Assessment Platform</p>
            </div>
          </div>
          <p className="text-slate-300 mb-6 max-w-2xl text-sm leading-relaxed">
            Assess compliance against NIST CSF, ISO 27001, GDPR, PCI DSS, IEC 62443, HIPAA, SOC 2, and more.
            Generate detailed reports with gap analysis and remediation roadmaps.
          </p>
          <button
            onClick={() => setCurrentPage('new-assessment')}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus size={18} />
            Start New Assessment
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Assessments', value: totalAssessments, icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Average Score', value: `${avgScore}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Gaps Found', value: totalGaps, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Critical/Immediate', value: criticalGaps, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={18} className={stat.color} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Frameworks grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Supported Frameworks</h2>
          <button
            onClick={() => setCurrentPage('frameworks')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.values(FRAMEWORK_MAP).slice(0, 12).map((fw) => {
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-50 border-blue-200 text-blue-800',
              green: 'bg-green-50 border-green-200 text-green-800',
              purple: 'bg-purple-50 border-purple-200 text-purple-800',
              orange: 'bg-orange-50 border-orange-200 text-orange-800',
              red: 'bg-red-50 border-red-200 text-red-800',
              teal: 'bg-teal-50 border-teal-200 text-teal-800',
              indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
              cyan: 'bg-cyan-50 border-cyan-200 text-cyan-800',
              yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
              emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
              violet: 'bg-violet-50 border-violet-200 text-violet-800',
              rose: 'bg-rose-50 border-rose-200 text-rose-800',
            };
            const cls = colorMap[fw.colorClass] ?? 'bg-slate-50 border-slate-200 text-slate-800';
            return (
              <div key={fw.id} className={`rounded-xl border px-3 py-2.5 text-center ${cls}`}>
                <div className="font-bold text-sm">{fw.shortName}</div>
                <div className="text-xs opacity-70 mt-0.5">{fw.version}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent history */}
      {recentHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Assessments</h2>
            <button
              onClick={() => setCurrentPage('history')}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {recentHistory.map(result => (
              <div
                key={result.id}
                className={`bg-white rounded-xl border ${scoreBg(result.overallScore)} p-4 cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => { setViewingResult(result); setCurrentPage('report'); }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 truncate">{result.profile.organizationName}</span>
                      <span className={`text-sm font-bold ${scoreColor(result.overallScore)}`}>{result.overallScore}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {result.profile.selectedFrameworks.map(fwId => (
                        <span key={fwId} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {FRAMEWORK_MAP[fwId]?.shortName ?? fwId}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{BUSINESS_TYPE_LABELS[result.profile.businessType]}</span>
                      <span>&bull;</span>
                      <span>{REGION_LABELS[result.profile.businessRegion]}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(result.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Gaps</div>
                      <div className="text-lg font-bold text-amber-600">{result.gaps.length}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Critical</div>
                      <div className="text-lg font-bold text-red-600">{result.gaps.filter(g => g.priority === 'immediate').length}</div>
                    </div>
                    <ArrowRight size={16} className="text-slate-400" />
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-3">
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${result.overallScore >= 80 ? 'bg-emerald-500' : result.overallScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${result.overallScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No assessments yet</h3>
          <p className="text-slate-500 text-sm mb-6">Start your first compliance assessment to generate a detailed security report.</p>
          <button
            onClick={() => setCurrentPage('new-assessment')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus size={18} />
            Start Your First Assessment
          </button>
        </div>
      )}
    </div>
  );
}

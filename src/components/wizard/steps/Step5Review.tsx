import { useMemo, useState } from 'react';
import type { AssessmentSession } from '../../../types/assessment';
import { FRAMEWORK_MAP } from '../../../data/frameworks';
import { getApplicableFrameworks } from '../../../data/business-profiles';
import { buildAssessmentResult } from '../../../utils/scoring';
import { useHistory } from '../../../context/HistoryContext';
import { useApp } from '../../../context/AppContext';
import { BUSINESS_TYPE_LABELS, REGION_LABELS, CLOUD_PROVIDER_LABELS, ITOT_LABELS } from '../../../types/filters';
import { Shield, CheckCircle, AlertTriangle, FileText, Loader } from 'lucide-react';

interface Props {
  session: AssessmentSession;
  onBack: () => void;
}

export function Step5Review({ session, onBack }: Props) {
  const { saveAssessment } = useHistory();
  const { setCurrentPage, setViewingResult } = useApp();
  const [generating, setGenerating] = useState(false);

  const profile = session.profile;
  const selectedFrameworks = profile.selectedFrameworks ?? [];

  const stats = useMemo(() => {
    let total = 0;
    for (const fwId of selectedFrameworks) {
      const fw = FRAMEWORK_MAP[fwId];
      if (fw) total += fw.domains.reduce((s, d) => s + d.controls.length, 0);
    }
    const answered = session.answers.length;
    const gaps = session.answers.filter(a => a.answer === 'no' || a.answer === 'partial').length;
    return { total, answered, gaps, unanswered: total - answered };
  }, [session]);

  const applicability = useMemo(() => {
    if (!profile.businessType || !profile.businessRegion) return [];
    return getApplicableFrameworks(profile.businessType, profile.businessRegion);
  }, [profile.businessType, profile.businessRegion]);

  const handleGenerate = async () => {
    if (!profile.businessType || !profile.businessRegion || !profile.itotScope || !profile.organizationName || !profile.assessorName) return;

    setGenerating(true);
    await new Promise(r => setTimeout(r, 800)); // brief UX delay

    const result = buildAssessmentResult(
      session.id,
      {
        organizationName: profile.organizationName,
        assessorName: profile.assessorName,
        businessType: profile.businessType,
        businessRegion: profile.businessRegion,
        itotScope: profile.itotScope,
        cloudProviders: profile.cloudProviders ?? [],
        selectedFrameworks: profile.selectedFrameworks ?? [],
      },
      session.answers,
      applicability,
      session.startedAt
    );

    saveAssessment(result);
    setViewingResult(result);
    setCurrentPage('report');
    setGenerating(false);
  };

  const isComplete = profile.organizationName && profile.businessType && profile.businessRegion && selectedFrameworks.length > 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Review & Generate Report</h2>
        <p className="text-slate-500 text-sm mt-1">Review your assessment configuration before generating the compliance report.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Profile summary */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Shield size={16} className="text-indigo-600" />
            Assessment Profile
          </h3>
          <dl className="space-y-2">
            {[
              { label: 'Organization', value: profile.organizationName || '—' },
              { label: 'Assessor', value: profile.assessorName || '—' },
              { label: 'Business Type', value: profile.businessType ? BUSINESS_TYPE_LABELS[profile.businessType] : '—' },
              { label: 'Region', value: profile.businessRegion ? REGION_LABELS[profile.businessRegion] : '—' },
              { label: 'Scope', value: profile.itotScope ? ITOT_LABELS[profile.itotScope] : '—' },
              { label: 'Cloud', value: (profile.cloudProviders ?? []).map(p => CLOUD_PROVIDER_LABELS[p]?.split(' (')[0]).join(', ') || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <dt className="text-xs text-slate-500 w-28 flex-shrink-0">{label}:</dt>
                <dd className="text-xs font-medium text-slate-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Framework + stats */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-indigo-600" />
            Selected Frameworks
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedFrameworks.map(fwId => {
              const fw = FRAMEWORK_MAP[fwId];
              return fw ? (
                <span key={fwId} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                  {fw.shortName}
                </span>
              ) : null;
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-lg font-bold text-slate-900">{stats.total}</div>
              <div className="text-xs text-slate-500">Total Controls</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-lg font-bold text-emerald-600">{stats.answered}</div>
              <div className="text-xs text-slate-500">Answered</div>
            </div>
            <div className="text-center p-2 bg-white rounded-lg border border-slate-200">
              <div className="text-lg font-bold text-amber-600">{stats.gaps}</div>
              <div className="text-xs text-slate-500">Gaps Found</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {stats.unanswered > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {stats.unanswered} controls not yet answered
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Unanswered controls will be marked as "Not Assessed" and excluded from scoring.
              You can still generate the report — go back to complete more if desired.
            </p>
          </div>
        </div>
      )}

      {stats.answered > 0 && stats.unanswered === 0 && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-800">
            All {stats.total} controls answered. Ready to generate your compliance report.
          </p>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-sm">
          ← Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={!isComplete || generating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
        >
          {generating ? (
            <>
              <Loader size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText size={16} />
              Generate Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}

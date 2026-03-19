import React, { useMemo } from 'react';
import type { AssessmentSession } from '../../../types/assessment';
import type { FrameworkId } from '../../../types/filters';
import { ALL_FRAMEWORKS } from '../../../data/frameworks';
import { getApplicableFrameworks } from '../../../data/business-profiles';
import { Shield, Lock } from 'lucide-react';

interface Props {
  profile: Partial<AssessmentSession['profile']>;
  onUpdate: (updates: Partial<AssessmentSession['profile']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  green: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-100 text-green-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-100 text-orange-700' },
  red: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-100 text-red-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-800', badge: 'bg-teal-100 text-teal-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-800', badge: 'bg-indigo-100 text-indigo-700' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-700' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-300', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700' },
};

export function Step3FrameworkSelect({ profile, onUpdate, onNext, onBack }: Props) {
  const applicability = useMemo(() => {
    if (!profile.businessType || !profile.businessRegion) return [];
    return getApplicableFrameworks(profile.businessType, profile.businessRegion);
  }, [profile.businessType, profile.businessRegion]);

  const recommendedIds = new Set(applicability.map(a => a.frameworkId));
  const mandatoryIds = new Set(applicability.filter(a => a.mandatory).map(a => a.frameworkId));

  const selected = new Set<FrameworkId>(profile.selectedFrameworks ?? []);

  // Auto-select mandatory + recommended on first visit
  React.useEffect(() => {
    if (!profile.selectedFrameworks) {
      const autoSelected = applicability.map(a => a.frameworkId);
      onUpdate({ selectedFrameworks: autoSelected });
    }
  }, []);

  const toggle = (id: FrameworkId) => {
    if (mandatoryIds.has(id)) return; // can't deselect mandatory
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onUpdate({ selectedFrameworks: Array.from(next) });
  };

  // Filter frameworks by IT/OT scope
  const filteredFrameworks = ALL_FRAMEWORKS.filter(fw => {
    if (!profile.itotScope) return true;
    return fw.applicableScopes.includes(profile.itotScope);
  });

  const recommendedFirst = [...filteredFrameworks].sort((a, b) => {
    const aRec = recommendedIds.has(a.id) ? 0 : 1;
    const bRec = recommendedIds.has(b.id) ? 0 : 1;
    if (aRec !== bRec) return aRec - bRec;
    const aMan = mandatoryIds.has(a.id) ? 0 : 1;
    const bMan = mandatoryIds.has(b.id) ? 0 : 1;
    return aMan - bMan;
  });

  const totalControls = filteredFrameworks
    .filter(fw => selected.has(fw.id))
    .reduce((s, fw) => s + fw.totalControls, 0);

  const canProceed = selected.size > 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Select Compliance Frameworks</h2>
        <p className="text-slate-500 text-sm mt-1">
          Recommended frameworks are pre-selected based on your business profile. Mandatory regulatory frameworks cannot be deselected.
        </p>
      </div>

      {applicability.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-xs text-indigo-800">
            <span className="font-semibold">{applicability.length} frameworks recommended</span> for {profile.businessType?.replace('-', ' ')} in {profile.businessRegion?.replace('-', ' ')}.
            {mandatoryIds.size > 0 && <span className="ml-1 font-medium text-red-700">({mandatoryIds.size} mandatory regulatory requirement{mandatoryIds.size > 1 ? 's' : ''})</span>}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {recommendedFirst.map(fw => {
          const isSelected = selected.has(fw.id);
          const isRecommended = recommendedIds.has(fw.id);
          const isMandatory = mandatoryIds.has(fw.id);
          const app = applicability.find(a => a.frameworkId === fw.id);
          const colors = COLOR_MAP[fw.colorClass] ?? COLOR_MAP.blue;

          return (
            <button
              key={fw.id}
              onClick={() => toggle(fw.id)}
              className={`relative flex flex-col items-start p-4 rounded-xl border-2 text-left transition-all
                ${isSelected
                  ? `${colors.bg} ${colors.border}`
                  : 'bg-white border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'}
                ${isMandatory ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {/* Mandatory lock */}
              {isMandatory && (
                <div className="absolute top-2 right-2">
                  <Lock size={12} className="text-red-500" />
                </div>
              )}

              {/* Checkbox */}
              <div className="flex items-start gap-3 w-full">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                  ${isSelected ? `${colors.border} bg-current` : 'border-slate-300'}`}
                  style={isSelected ? { backgroundColor: undefined } : {}}
                >
                  {isSelected && <span className="text-white text-xs font-bold" style={{ color: 'white' }}>✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm ${isSelected ? colors.text : 'text-slate-700'}`}>
                      {fw.shortName}
                    </span>
                    {isMandatory && (
                      <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Mandatory</span>
                    )}
                    {isRecommended && !isMandatory && (
                      <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">Recommended</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{fw.issuer} &bull; v{fw.version}</div>
                  {app && (
                    <div className="text-xs text-slate-500 mt-1 line-clamp-2">{app.rationale}</div>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Shield size={11} className="text-slate-400" />
                    <span className="text-xs text-slate-500">{fw.totalControls} controls</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 -mx-6 lg:-mx-8 -mb-6 lg:-mb-8 rounded-b-2xl">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold text-slate-900">{selected.size} framework{selected.size !== 1 ? 's' : ''} selected</span>
            <span className="text-slate-500 ml-2">({totalControls} total controls to assess)</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-sm">
              ← Back
            </button>
            <button
              onClick={onNext}
              disabled={!canProceed}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-medium transition-colors text-sm"
            >
              Start Assessment →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import type { AssessmentSession } from '../../../types/assessment';
import { CLOUD_PROVIDER_LABELS, ITOT_LABELS } from '../../../types/filters';
import type { CloudProvider, ITOTScope } from '../../../types/filters';
import { Server, Cpu, Layers } from 'lucide-react';

const ITOT_ICONS: Record<ITOTScope, React.ComponentType<{ size?: number; className?: string }>> = {
  'it-only': Server,
  'ot-only': Cpu,
  'it-ot-both': Layers,
};

const CLOUD_ICONS: Partial<Record<string, string>> = {
  'aws': '☁️',
  'azure': '🔷',
  'gcp': '🌐',
  'hybrid': '🔗',
  'on-premise': '🏢',
  'none': '🚫',
};

interface Props {
  profile: Partial<AssessmentSession['profile']>;
  onUpdate: (updates: Partial<AssessmentSession['profile']>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2ITOTScope({ profile, onUpdate, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cloudProviders = profile.cloudProviders ?? [];

  const toggleCloud = (provider: CloudProvider) => {
    const current = cloudProviders;
    if (current.includes(provider)) {
      onUpdate({ cloudProviders: current.filter(p => p !== provider) });
    } else {
      onUpdate({ cloudProviders: [...current, provider] });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!profile.itotScope) e.itot = 'Please select the infrastructure scope';
    if (cloudProviders.length === 0) e.cloud = 'Please select at least one cloud/infrastructure option';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Infrastructure Scope</h2>
        <p className="text-slate-500 text-sm mt-1">Define the technology scope for this compliance assessment.</p>
      </div>

      {/* IT/OT Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Infrastructure Type *</label>
        {errors.itot && <p className="text-xs text-red-500 mb-2">{errors.itot}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(ITOT_LABELS) as [ITOTScope, string][]).map(([scope, label]) => {
            const Icon = ITOT_ICONS[scope];
            const selected = profile.itotScope === scope;
            return (
              <button
                key={scope}
                onClick={() => onUpdate({ itotScope: scope })}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left
                  ${selected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <Icon size={24} className={selected ? 'text-indigo-600 mt-0.5' : 'text-slate-400 mt-0.5'} />
                <div>
                  <div className={`font-medium text-sm ${selected ? 'text-indigo-700' : 'text-slate-700'}`}>{label.split(' (')[0]}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label.match(/\(([^)]+)\)/)?.[1] ?? ''}</div>
                </div>
              </button>
            );
          })}
        </div>

        {profile.itotScope === 'ot-only' && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-800 font-medium">
              OT-only scope: IEC 62443 will be automatically recommended as the primary framework.
            </p>
          </div>
        )}
        {profile.itotScope === 'it-ot-both' && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-800 font-medium">
              IT+OT scope: Both IEC 62443 (OT) and IT frameworks will be available for selection.
            </p>
          </div>
        )}
      </div>

      {/* Cloud Providers */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-2">Cloud / Infrastructure Providers *</label>
        <p className="text-xs text-slate-500 mb-3">Select all that apply. This enables cloud-specific security requirements.</p>
        {errors.cloud && <p className="text-xs text-red-500 mb-2">{errors.cloud}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(CLOUD_PROVIDER_LABELS) as [CloudProvider, string][]).map(([provider, label]) => {
            const selected = cloudProviders.includes(provider);
            const emoji = CLOUD_ICONS[provider] ?? '☁️';
            return (
              <button
                key={provider}
                onClick={() => toggleCloud(provider)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 transition-all text-left
                  ${selected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <span className="text-xl">{emoji}</span>
                <div>
                  <div className={`text-xs font-medium ${selected ? 'text-indigo-700' : 'text-slate-700'}`}>
                    {label.replace(' (Information Technology)', '').replace(' (Operational Technology / ICS)', '').replace(' (Converged Environment)', '')}
                  </div>
                </div>
                {selected && (
                  <div className="ml-auto w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-sm">
          ← Back
        </button>
        <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
          Continue →
        </button>
      </div>
    </div>
  );
}

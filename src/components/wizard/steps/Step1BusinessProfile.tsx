import React, { useState } from 'react';
import type { AssessmentSession } from '../../../types/assessment';
import {
  BUSINESS_TYPE_LABELS, REGION_LABELS,
} from '../../../types/filters';
import type { BusinessType, BusinessRegion } from '../../../types/filters';
import { Building2, Globe, Cpu, ShieldCheck, HeartPulse, Tv, ShoppingCart, Landmark, Coins } from 'lucide-react';

const BUSINESS_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'insurance': ShieldCheck,
  'bfsi': Coins,
  'telecom': Cpu,
  'industrial-automation': Building2,
  'healthcare': HeartPulse,
  'digital-media': Tv,
  'retail': ShoppingCart,
  'government': Landmark,
};

interface Props {
  profile: Partial<AssessmentSession['profile']>;
  onUpdate: (updates: Partial<AssessmentSession['profile']>) => void;
  onNext: () => void;
}

export function Step1BusinessProfile({ profile, onUpdate, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!profile.organizationName?.trim()) e.org = 'Organization name is required';
    if (!profile.assessorName?.trim()) e.assessor = 'Assessor name is required';
    if (!profile.businessType) e.businessType = 'Please select a business type';
    if (!profile.businessRegion) e.region = 'Please select a region';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Business Profile</h2>
        <p className="text-slate-500 text-sm mt-1">Tell us about your organization to get personalized compliance recommendations.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Organization Name *</label>
          <input
            type="text"
            value={profile.organizationName ?? ''}
            onChange={e => onUpdate({ organizationName: e.target.value })}
            placeholder="Acme Corporation"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors
              ${errors.org ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'}`}
          />
          {errors.org && <p className="text-xs text-red-500 mt-1">{errors.org}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Assessor Name *</label>
          <input
            type="text"
            value={profile.assessorName ?? ''}
            onChange={e => onUpdate({ assessorName: e.target.value })}
            placeholder="Jane Smith (CISO)"
            className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors
              ${errors.assessor ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'}`}
          />
          {errors.assessor && <p className="text-xs text-red-500 mt-1">{errors.assessor}</p>}
        </div>
      </div>

      {/* Business type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Business Type *</label>
        {errors.businessType && <p className="text-xs text-red-500 mb-2">{errors.businessType}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(BUSINESS_TYPE_LABELS) as [BusinessType, string][]).map(([type, label]) => {
            const Icon = BUSINESS_ICONS[type] ?? Building2;
            const selected = profile.businessType === type;
            return (
              <button
                key={type}
                onClick={() => onUpdate({ businessType: type })}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center
                  ${selected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={22} className={selected ? 'text-indigo-600' : 'text-slate-400'} />
                <span className="text-xs font-medium leading-tight">{label.replace(' (Banking, Financial Services)', '').replace(' / E-Commerce', '').replace(' / Public Sector', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Region */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-700 mb-2">Business Region *</label>
        {errors.region && <p className="text-xs text-red-500 mb-2">{errors.region}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {(Object.entries(REGION_LABELS) as [BusinessRegion, string][]).map(([region, label]) => {
            const selected = profile.businessRegion === region;
            return (
              <button
                key={region}
                onClick={() => onUpdate({ businessRegion: region })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-sm
                  ${selected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'}`}
              >
                <Globe size={14} className={selected ? 'text-indigo-500' : 'text-slate-400'} />
                <span className="text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

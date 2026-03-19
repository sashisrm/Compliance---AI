import { useState } from 'react';
import { ALL_FRAMEWORKS } from '../data/frameworks';
import { REGION_LABELS, BUSINESS_TYPE_LABELS } from '../types/filters';
import { ChevronDown, ChevronRight, Shield, Search } from 'lucide-react';
import type { Framework } from '../types/frameworks';

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', badge: 'bg-green-100 text-green-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-100 text-orange-700' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', badge: 'bg-red-100 text-red-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', badge: 'bg-teal-100 text-teal-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-700' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', badge: 'bg-cyan-100 text-cyan-700' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', badge: 'bg-yellow-100 text-yellow-700' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-700' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', badge: 'bg-violet-100 text-violet-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', badge: 'bg-rose-100 text-rose-700' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
  informational: 'bg-slate-100 text-slate-600',
};

function FrameworkCard({ fw }: { fw: Framework }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const colors = COLOR_MAP[fw.colorClass] ?? COLOR_MAP.blue;

  const toggleDomain = (id: string) => {
    setExpandedDomains(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className={`rounded-xl border ${colors.border} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-start gap-4 p-5 ${colors.bg} text-left hover:opacity-90 transition-opacity`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`font-bold text-base ${colors.text}`}>{fw.shortName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>v{fw.version}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>{fw.issuer}</span>
          </div>
          <p className="text-sm text-slate-600">{fw.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Shield size={11} />
              {fw.totalControls} controls
            </span>
            <span>{fw.domains.length} domains</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 bg-white space-y-2">
          {/* Applicability */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div>
              <p className="text-xs font-medium text-slate-700 mb-1">Applicable Regions:</p>
              <div className="flex flex-wrap gap-1">
                {fw.applicableRegions.map(r => (
                  <span key={r} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {REGION_LABELS[r]}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-700 mb-1">Applicable Business Types:</p>
            <div className="flex flex-wrap gap-1">
              {fw.applicableBusinessTypes.map(b => (
                <span key={b} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  {BUSINESS_TYPE_LABELS[b]}
                </span>
              ))}
            </div>
          </div>

          {/* Domains and controls */}
          <div className="space-y-2">
            {fw.domains.map(domain => (
              <div key={domain.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleDomain(domain.id)}
                  className="w-full flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  {expandedDomains.has(domain.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="font-medium text-sm text-slate-800">{domain.name}</span>
                  <span className="text-xs text-slate-500 ml-auto">{domain.controls.length} controls</span>
                </button>
                {expandedDomains.has(domain.id) && (
                  <div className="p-3 space-y-2">
                    {domain.controls.map(ctrl => (
                      <div key={ctrl.id} className="p-3 bg-white border border-slate-100 rounded-lg">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-slate-500">{ctrl.controlNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[ctrl.severity] ?? ''}`}>
                            {ctrl.severity}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{ctrl.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{ctrl.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FrameworksPage() {
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'it' | 'ot'>('all');

  const filtered = ALL_FRAMEWORKS.filter(fw => {
    const matchSearch = !search ||
      fw.name.toLowerCase().includes(search.toLowerCase()) ||
      fw.shortName.toLowerCase().includes(search.toLowerCase()) ||
      fw.issuer.toLowerCase().includes(search.toLowerCase());
    const matchScope = filterScope === 'all' ||
      (filterScope === 'ot' && fw.applicableScopes.some(s => s.includes('ot'))) ||
      (filterScope === 'it' && fw.applicableScopes.some(s => s.includes('it')));
    return matchSearch && matchScope;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Compliance Frameworks</h2>
        <p className="text-slate-500 text-sm">Browse all {ALL_FRAMEWORKS.length} supported compliance frameworks and their controls.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search frameworks..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {([['all', 'All'], ['it', 'IT'], ['ot', 'OT']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterScope(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filterScope === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{ALL_FRAMEWORKS.length}</div>
          <div className="text-xs text-slate-500">Frameworks</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{ALL_FRAMEWORKS.reduce((s, f) => s + f.totalControls, 0)}</div>
          <div className="text-xs text-slate-500">Total Controls</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{ALL_FRAMEWORKS.reduce((s, f) => s + f.domains.length, 0)}</div>
          <div className="text-xs text-slate-500">Control Domains</div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map(fw => <FrameworkCard key={fw.id} fw={fw} />)}
      </div>
    </div>
  );
}

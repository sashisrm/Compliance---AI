import { useState, useMemo } from 'react';
import type { AssessmentSession, ControlAnswer } from '../../../types/assessment';
import type { AnswerValue, Control } from '../../../types/frameworks';
import type { FrameworkId } from '../../../types/filters';
import { FRAMEWORK_MAP } from '../../../data/frameworks';
import { getCloudRequirements } from '../../../data/cloud-requirements';
import {
  ChevronDown, ChevronRight, CheckCircle2, XCircle, MinusCircle,
  Circle, HelpCircle, BookOpen, Lightbulb, ListChecks, FileText,
} from 'lucide-react';

interface Props {
  session: AssessmentSession;
  onSetAnswers: (answers: ControlAnswer[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// ─── Answer options ────────────────────────────────────────────────────────────

const ANSWER_OPTIONS: {
  value: AnswerValue;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    value: 'yes',
    label: 'Compliant',
    sublabel: 'Control fully met',
    icon: CheckCircle2,
    activeClass: 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-100 shadow-md',
    inactiveClass: 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
  },
  {
    value: 'partial',
    label: 'Partial',
    sublabel: 'Partially implemented',
    icon: MinusCircle,
    activeClass: 'bg-amber-500 border-amber-500 text-white shadow-amber-100 shadow-md',
    inactiveClass: 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700',
  },
  {
    value: 'no',
    label: 'Non-Compliant',
    sublabel: 'Gap identified',
    icon: XCircle,
    activeClass: 'bg-red-500 border-red-500 text-white shadow-red-100 shadow-md',
    inactiveClass: 'bg-white border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700',
  },
  {
    value: 'na',
    label: 'N/A',
    sublabel: 'Not applicable',
    icon: Circle,
    activeClass: 'bg-slate-500 border-slate-500 text-white shadow-slate-100 shadow-md',
    inactiveClass: 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
  },
];

const SEVERITY_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  critical: { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
  high:     { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200', label: 'High' },
  medium:   { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Medium' },
  low:      { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 border-green-200', label: 'Low' },
  informational: { dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Info' },
};

// ─── ControlCard ───────────────────────────────────────────────────────────────

function ControlCard({
  control,
  answer,
  onAnswer,
}: {
  control: Control;
  answer: ControlAnswer | undefined;
  onAnswer: (controlId: string, frameworkId: FrameworkId, value: AnswerValue, notes?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(answer?.notes ?? '');
  const sev = SEVERITY_CONFIG[control.severity] ?? SEVERITY_CONFIG.informational;
  const selectedOpt = ANSWER_OPTIONS.find(o => o.value === answer?.answer);

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      answer
        ? 'border-slate-200 bg-white'
        : 'border-amber-200 bg-amber-50/40 shadow-sm'
    }`}>
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Status indicator */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            selectedOpt
              ? selectedOpt.value === 'yes' ? 'bg-emerald-100' :
                selectedOpt.value === 'partial' ? 'bg-amber-100' :
                selectedOpt.value === 'no' ? 'bg-red-100' : 'bg-slate-100'
              : 'bg-slate-100'
          }`}>
            {selectedOpt
              ? <selectedOpt.icon size={20} className={
                  selectedOpt.value === 'yes' ? 'text-emerald-600' :
                  selectedOpt.value === 'partial' ? 'text-amber-600' :
                  selectedOpt.value === 'no' ? 'text-red-600' : 'text-slate-500'
                } />
              : <HelpCircle size={20} className="text-amber-400" />
            }
          </div>

          {/* Control info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                {control.controlNumber}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${sev.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                {sev.label}
              </span>
              {answer && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  answer.answer === 'yes' ? 'bg-emerald-100 text-emerald-700' :
                  answer.answer === 'partial' ? 'bg-amber-100 text-amber-700' :
                  answer.answer === 'no' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedOpt?.label}
                </span>
              )}
            </div>
            <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-1">{control.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{control.description}</p>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            {expanded ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-600" />}
          </button>
        </div>

        {/* Answer buttons */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ANSWER_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = answer?.answer === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onAnswer(control.id, control.frameworkId, opt.value, notes)}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 font-medium transition-all duration-150 ${
                  isSelected ? opt.activeClass : opt.inactiveClass
                }`}
              >
                <Icon size={16} />
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className={`text-xs leading-none ${isSelected ? 'opacity-80' : 'text-slate-400'}`}>
                  {opt.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded guidance */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/70 divide-y divide-slate-100">
          {/* Implementation Guidance */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-indigo-500" />
              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Implementation Guidance</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{control.implementationGuidance}</p>
          </div>

          {/* Remediation steps */}
          {control.remediationSteps.length > 0 && (
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks size={14} className="text-indigo-500" />
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Remediation Steps</h5>
              </div>
              <ol className="space-y-2">
                {control.remediationSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-slate-600">
                    <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Notes */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-indigo-500" />
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Notes / Evidence</label>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => {
                if (answer) onAnswer(control.id, control.frameworkId, answer.answer, notes);
              }}
              placeholder="Add notes, evidence references, or exceptions..."
              rows={2}
              className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl resize-none outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mini circular progress ────────────────────────────────────────────────────

function CircularProgress({ value, size = 32 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={3} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#6366f1" strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
}

// ─── Step4Requirements ─────────────────────────────────────────────────────────

export function Step4Requirements({ session, onSetAnswers, onNext, onBack }: Props) {
  const [selectedFramework, setSelectedFramework] = useState<FrameworkId | null>(
    session.profile.selectedFrameworks?.[0] ?? null
  );
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['domain-0']));

  const answers = session.answers;

  const handleAnswer = (controlId: string, frameworkId: FrameworkId, value: AnswerValue, notes?: string) => {
    const now = new Date().toISOString();
    const newAnswer: ControlAnswer = { controlId, frameworkId, answer: value, notes, answeredAt: now };
    const filtered = answers.filter(a => a.controlId !== controlId);
    onSetAnswers([...filtered, newAnswer]);
  };

  const currentFramework = selectedFramework ? FRAMEWORK_MAP[selectedFramework] : null;

  const stats = useMemo(() => {
    const allControls: Control[] = [];
    for (const fwId of session.profile.selectedFrameworks ?? []) {
      const fw = FRAMEWORK_MAP[fwId];
      if (fw) for (const d of fw.domains) allControls.push(...d.controls);
    }
    const answered = answers.length;
    const total = allControls.length;
    const compliant = answers.filter(a => a.answer === 'yes').length;
    const partial = answers.filter(a => a.answer === 'partial').length;
    const gaps = answers.filter(a => a.answer === 'no').length;
    return { answered, total, compliant, partial, gaps, percent: total > 0 ? Math.round((answered / total) * 100) : 0 };
  }, [answers, session.profile.selectedFrameworks]);

  const toggleDomain = (domainId: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  const cloudReqs = useMemo(() => {
    if (!session.profile.cloudProviders?.length) return [];
    return getCloudRequirements(session.profile.cloudProviders);
  }, [session.profile.cloudProviders]);

  const cloudAnswers = answers.filter(a =>
    a.controlId.startsWith('AWS-') || a.controlId.startsWith('AZ-') ||
    a.controlId.startsWith('GCP-') || a.controlId.startsWith('HYBRID-')
  );

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar */}
      <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Overall progress card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <CircularProgress value={stats.percent} size={40} />
              <div>
                <div className="text-xl font-bold text-slate-900">{stats.percent}%</div>
                <div className="text-xs text-slate-500">{stats.answered} / {stats.total} answered</div>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 rounded-xl p-2">
                <div className="text-sm font-bold text-emerald-600">{stats.compliant}</div>
                <div className="text-xs text-emerald-700">Compliant</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-2">
                <div className="text-sm font-bold text-amber-600">{stats.partial}</div>
                <div className="text-xs text-amber-700">Partial</div>
              </div>
              <div className="bg-red-50 rounded-xl p-2">
                <div className="text-sm font-bold text-red-500">{stats.gaps}</div>
                <div className="text-xs text-red-700">Gaps</div>
              </div>
            </div>
          </div>

          {/* Framework tabs */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">Frameworks</p>
            <div className="space-y-1">
              {(session.profile.selectedFrameworks ?? []).map(fwId => {
                const fw = FRAMEWORK_MAP[fwId];
                if (!fw) return null;
                const fwAnswers = answers.filter(a => a.frameworkId === fwId).length;
                const fwTotal = fw.domains.reduce((s, d) => s + d.controls.length, 0);
                const fwPercent = fwTotal > 0 ? Math.round((fwAnswers / fwTotal) * 100) : 0;
                const active = selectedFramework === fwId;
                return (
                  <button
                    key={fwId}
                    onClick={() => setSelectedFramework(fwId)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm">{fw.shortName}</span>
                      <span className={`text-xs font-bold ${active ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {fwPercent}%
                      </span>
                    </div>
                    <div className={`h-1 rounded-full ${active ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all ${active ? 'bg-white' : 'bg-indigo-400'}`}
                        style={{ width: `${fwPercent}%` }}
                      />
                    </div>
                    <div className={`text-xs mt-1 ${active ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {fwAnswers}/{fwTotal} answered
                    </div>
                  </button>
                );
              })}

              {cloudReqs.length > 0 && (
                <button
                  onClick={() => setSelectedFramework('cloud' as FrameworkId)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                    selectedFramework === ('cloud' as FrameworkId)
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="font-semibold text-sm">Cloud Requirements</div>
                  <div className="text-xs opacity-70 mt-0.5">{cloudAnswers.length}/{cloudReqs.length} answered</div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {currentFramework && selectedFramework !== ('cloud' as FrameworkId) ? (
          <div className="p-6">
            {/* Framework header */}
            <div className="mb-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={22} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{currentFramework.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{currentFramework.description}</p>
              </div>
            </div>

            {/* Domain sections */}
            {currentFramework.domains.map((domain, di) => {
              const domKey = `domain-${di}`;
              const isExpanded = expandedDomains.has(domKey);
              const domainAnswered = domain.controls.filter(c => answers.some(a => a.controlId === c.id)).length;
              const domainTotal = domain.controls.length;
              const domainPercent = domainTotal > 0 ? Math.round((domainAnswered / domainTotal) * 100) : 0;
              const domainComplete = domainAnswered === domainTotal;

              return (
                <div key={domain.id} className="mb-4 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => toggleDomain(domKey)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      domainComplete ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
                      {domainComplete
                        ? <CheckCircle2 size={18} className="text-emerald-600" />
                        : isExpanded
                          ? <ChevronDown size={18} className="text-slate-500" />
                          : <ChevronRight size={18} className="text-slate-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900">{domain.name}</div>
                      <div className="text-xs text-slate-500 truncate">{domain.description}</div>
                      <div className="mt-1.5 h-1 bg-slate-100 rounded-full w-48">
                        <div
                          className={`h-full rounded-full transition-all ${domainComplete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${domainPercent}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-bold ${domainComplete ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {domainAnswered}/{domainTotal}
                      </div>
                      <div className="text-xs text-slate-400">{domainPercent}%</div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/50">
                      {domain.controls.map(control => (
                        <ControlCard
                          key={control.id}
                          control={control}
                          answer={answers.find(a => a.controlId === control.id)}
                          onAnswer={handleAnswer}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : selectedFramework === ('cloud' as FrameworkId) && cloudReqs.length > 0 ? (
          <div className="p-6">
            <div className="mb-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen size={22} className="text-sky-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Cloud-Specific Requirements</h3>
                <p className="text-sm text-slate-500 mt-0.5">Security requirements specific to your selected cloud providers.</p>
              </div>
            </div>
            <div className="space-y-3">
              {cloudReqs.map(req => {
                const ans = answers.find(a => a.controlId === req.id);
                const sev = SEVERITY_CONFIG[req.severity] ?? SEVERITY_CONFIG.informational;
                const selectedOpt = ANSWER_OPTIONS.find(o => o.value === ans?.answer);
                return (
                  <div key={req.id} className={`border rounded-2xl bg-white overflow-hidden shadow-sm ${ans ? 'border-slate-200' : 'border-amber-200'}`}>
                    <div className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          selectedOpt?.value === 'yes' ? 'bg-emerald-100' :
                          selectedOpt?.value === 'partial' ? 'bg-amber-100' :
                          selectedOpt?.value === 'no' ? 'bg-red-100' : 'bg-slate-100'
                        }`}>
                          {selectedOpt
                            ? <selectedOpt.icon size={20} className={
                                selectedOpt.value === 'yes' ? 'text-emerald-600' :
                                selectedOpt.value === 'partial' ? 'text-amber-600' :
                                selectedOpt.value === 'no' ? 'text-red-600' : 'text-slate-500'
                              } />
                            : <HelpCircle size={20} className="text-amber-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md font-mono">
                              {req.provider.toUpperCase()} / {req.service}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${sev.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                              {sev.label}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900">{req.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{req.description}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ANSWER_OPTIONS.map(opt => {
                          const Icon = opt.icon;
                          const isSelected = ans?.answer === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleAnswer(req.id, 'nist-csf', opt.value)}
                              className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border-2 font-medium transition-all duration-150 ${
                                isSelected ? opt.activeClass : opt.inactiveClass
                              }`}
                            >
                              <Icon size={16} />
                              <span className="text-xs font-semibold">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4">
              <HelpCircle size={36} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">Select a framework from the left panel</p>
            <p className="text-sm text-slate-400 mt-1">to begin answering controls</p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-between flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 px-5 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all text-sm font-medium"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            {stats.answered} of {stats.total} answered
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-slate-700">{stats.percent}%</span>
          </div>
        </div>
        <button
          onClick={onNext}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all text-sm shadow-md shadow-indigo-100"
        >
          Review & Generate
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

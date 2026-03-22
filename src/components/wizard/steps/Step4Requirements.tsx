import { useState, useMemo } from 'react';
import type { AssessmentSession, ControlAnswer } from '../../../types/assessment';
import type { AnswerValue, Control } from '../../../types/frameworks';
import type { FrameworkId } from '../../../types/filters';
import { FRAMEWORK_MAP } from '../../../data/frameworks';
import { getCloudRequirements } from '../../../data/cloud-requirements';
import {
  ChevronDown, ChevronRight, CheckCircle2, XCircle, MinusCircle,
  Circle, HelpCircle, Lightbulb, ListChecks, FileText,
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    value: 'yes',
    label: 'Compliant',
    icon: CheckCircle2,
    activeClass: 'bg-emerald-500 border-emerald-500 text-white',
    inactiveClass: 'bg-white border-slate-200 text-slate-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700',
  },
  {
    value: 'partial',
    label: 'Partial',
    icon: MinusCircle,
    activeClass: 'bg-amber-500 border-amber-500 text-white',
    inactiveClass: 'bg-white border-slate-200 text-slate-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700',
  },
  {
    value: 'no',
    label: 'Non-Compliant',
    icon: XCircle,
    activeClass: 'bg-red-500 border-red-500 text-white',
    inactiveClass: 'bg-white border-slate-200 text-slate-500 hover:border-red-400 hover:bg-red-50 hover:text-red-700',
  },
  {
    value: 'na',
    label: 'N/A',
    icon: Circle,
    activeClass: 'bg-slate-500 border-slate-500 text-white',
    inactiveClass: 'bg-white border-slate-200 text-slate-500 hover:border-slate-400 hover:bg-slate-50',
  },
];

const SEVERITY_CONFIG: Record<string, { dot: string; badge: string; label: string }> = {
  critical:      { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',       label: 'Critical' },
  high:          { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'High' },
  medium:        { dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  label: 'Medium' },
  low:           { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200',  label: 'Low' },
  informational: { dot: 'bg-slate-400',  badge: 'bg-slate-50 text-slate-600 border-slate-200',  label: 'Info' },
};

// ─── Control card ──────────────────────────────────────────────────────────────

function ControlCard({
  control,
  answer,
  onAnswer,
}: {
  control: Control;
  answer: ControlAnswer | undefined;
  onAnswer: (id: string, fwId: FrameworkId, val: AnswerValue, notes?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(answer?.notes ?? '');
  const sev = SEVERITY_CONFIG[control.severity] ?? SEVERITY_CONFIG.informational;
  const currentOpt = ANSWER_OPTIONS.find(o => o.value === answer?.answer);

  return (
    <div className={`rounded-xl border transition-colors ${
      answer ? 'border-slate-200 bg-white' : 'border-amber-200 bg-amber-50/30'
    }`}>
      {/* Header row */}
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Status icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            currentOpt?.value === 'yes'     ? 'bg-emerald-100' :
            currentOpt?.value === 'partial' ? 'bg-amber-100' :
            currentOpt?.value === 'no'      ? 'bg-red-100' :
            currentOpt?.value === 'na'      ? 'bg-slate-100' : 'bg-amber-50'
          }`}>
            {currentOpt
              ? <currentOpt.icon size={16} className={
                  currentOpt.value === 'yes'     ? 'text-emerald-600' :
                  currentOpt.value === 'partial' ? 'text-amber-600' :
                  currentOpt.value === 'no'      ? 'text-red-600' : 'text-slate-500'
                } />
              : <HelpCircle size={16} className="text-amber-400" />
            }
          </div>

          {/* Control metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <code className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                {control.controlNumber}
              </code>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${sev.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                {sev.label}
              </span>
              {answer && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                  answer.answer === 'yes'     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  answer.answer === 'partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  answer.answer === 'no'      ? 'bg-red-50 text-red-700 border-red-200' :
                                               'bg-slate-50 text-slate-600 border-slate-200'
                }`}>{currentOpt?.label}</span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 leading-snug">{control.title}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{control.description}</p>
          </div>

          {/* Expand */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            {expanded
              ? <ChevronDown size={13} className="text-slate-500" />
              : <ChevronRight size={13} className="text-slate-500" />
            }
          </button>
        </div>

        {/* Answer buttons — 4 columns always */}
        <div className="grid grid-cols-4 gap-2">
          {ANSWER_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = answer?.answer === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onAnswer(control.id, control.frameworkId, opt.value, notes)}
                className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg border-2 text-xs font-semibold transition-all ${
                  isActive ? opt.activeClass : opt.inactiveClass
                }`}
              >
                <Icon size={13} />
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 divide-y divide-slate-100 text-xs">
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb size={12} className="text-indigo-500 flex-shrink-0" />
              <span className="font-semibold text-slate-700 uppercase tracking-wide text-xs">Guidance</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{control.implementationGuidance}</p>
          </div>

          {control.remediationSteps.length > 0 && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ListChecks size={12} className="text-indigo-500 flex-shrink-0" />
                <span className="font-semibold text-slate-700 uppercase tracking-wide text-xs">Remediation Steps</span>
              </div>
              <ol className="space-y-1.5">
                {control.remediationSteps.map((step, i) => (
                  <li key={i} className="flex gap-2.5 text-slate-600 leading-relaxed">
                    <span className="w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText size={12} className="text-indigo-500 flex-shrink-0" />
              <label className="font-semibold text-slate-700 uppercase tracking-wide text-xs">Notes / Evidence</label>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => { if (answer) onAnswer(control.id, control.frameworkId, answer.answer, notes); }}
              placeholder="Add notes, evidence references, or exceptions..."
              rows={2}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all bg-white text-xs"
            />
          </div>
        </div>
      )}
    </div>
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
    const updated: ControlAnswer = { controlId, frameworkId, answer: value, notes, answeredAt: now };
    onSetAnswers([...answers.filter(a => a.controlId !== controlId), updated]);
  };

  const currentFramework = selectedFramework ? FRAMEWORK_MAP[selectedFramework] : null;

  const stats = useMemo(() => {
    const allControls: Control[] = [];
    for (const fwId of session.profile.selectedFrameworks ?? []) {
      const fw = FRAMEWORK_MAP[fwId];
      if (fw) fw.domains.forEach(d => allControls.push(...d.controls));
    }
    const total = allControls.length;
    const answered = answers.length;
    const compliant = answers.filter(a => a.answer === 'yes').length;
    const partial = answers.filter(a => a.answer === 'partial').length;
    const gaps = answers.filter(a => a.answer === 'no').length;
    return { total, answered, compliant, partial, gaps, pct: total > 0 ? Math.round((answered / total) * 100) : 0 };
  }, [answers, session.profile.selectedFrameworks]);

  const cloudReqs = useMemo(() =>
    session.profile.cloudProviders?.length ? getCloudRequirements(session.profile.cloudProviders) : [],
    [session.profile.cloudProviders]
  );

  const cloudAnswers = answers.filter(a =>
    ['AWS-', 'AZ-', 'GCP-', 'HYBRID-'].some(p => a.controlId.startsWith(p))
  );

  const toggleDomain = (key: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const isCloud = selectedFramework === ('cloud' as FrameworkId);

  return (
    <div className="flex flex-col">

      {/* ── Top: progress bar + stats ── */}
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Progress bar */}
          <div className="flex-1 min-w-[160px]">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span className="font-medium">Overall Progress</span>
              <span className="font-semibold text-slate-700">{stats.answered} / {stats.total} &nbsp;·&nbsp; {stats.pct}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={11} /> {stats.compliant} Compliant
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              <MinusCircle size={11} /> {stats.partial} Partial
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
              <XCircle size={11} /> {stats.gaps} Gaps
            </span>
          </div>
        </div>
      </div>

      {/* ── Middle: sidebar + content ── */}
      <div className="flex min-h-[520px]">

        {/* Left sidebar — framework tabs */}
        <div className="w-48 flex-shrink-0 border-r border-slate-100 bg-slate-50 overflow-y-auto">
          <div className="p-3 space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 pb-1">Frameworks</p>

            {(session.profile.selectedFrameworks ?? []).map(fwId => {
              const fw = FRAMEWORK_MAP[fwId];
              if (!fw) return null;
              const fwAnswered = answers.filter(a => a.frameworkId === fwId).length;
              const fwTotal = fw.domains.reduce((s, d) => s + d.controls.length, 0);
              const fwPct = fwTotal > 0 ? Math.round((fwAnswered / fwTotal) * 100) : 0;
              const active = selectedFramework === fwId;

              return (
                <button
                  key={fwId}
                  onClick={() => setSelectedFramework(fwId)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate">{fw.shortName}</span>
                    <span className={`text-xs font-bold ml-1 flex-shrink-0 ${active ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {fwPct}%
                    </span>
                  </div>
                  <div className={`h-1 rounded-full ${active ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full rounded-full transition-all ${fwPct === 100 ? 'bg-emerald-400' : active ? 'bg-indigo-200' : 'bg-indigo-400'}`}
                      style={{ width: `${fwPct}%` }}
                    />
                  </div>
                  <div className={`text-xs mt-0.5 ${active ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {fwAnswered}/{fwTotal}
                  </div>
                </button>
              );
            })}

            {cloudReqs.length > 0 && (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 pb-1 pt-2">Cloud</p>
                <button
                  onClick={() => setSelectedFramework('cloud' as FrameworkId)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                    isCloud
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Cloud Reqs</span>
                    <span className={`text-xs font-bold ${isCloud ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {cloudAnswers.length}/{cloudReqs.length}
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-auto p-4">

          {/* ── Framework domains ── */}
          {currentFramework && !isCloud ? (
            <div>
              {/* Framework title */}
              <div className="mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">{currentFramework.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{currentFramework.description}</p>
              </div>

              {/* Domains */}
              <div className="space-y-3">
                {currentFramework.domains.map((domain, di) => {
                  const domKey = `domain-${di}`;
                  const isOpen = expandedDomains.has(domKey);
                  const dAnswered = domain.controls.filter(c => answers.some(a => a.controlId === c.id)).length;
                  const dTotal = domain.controls.length;
                  const dPct = dTotal > 0 ? Math.round((dAnswered / dTotal) * 100) : 0;
                  const dDone = dAnswered === dTotal;

                  return (
                    <div key={domain.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => toggleDomain(domKey)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${dDone ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                          {dDone
                            ? <CheckCircle2 size={15} className="text-emerald-600" />
                            : isOpen
                              ? <ChevronDown size={15} className="text-slate-500" />
                              : <ChevronRight size={15} className="text-slate-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{domain.name}</p>
                          <p className="text-xs text-slate-500 truncate">{domain.description}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="hidden sm:flex items-center gap-1.5">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${dDone ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${dPct}%` }}
                              />
                            </div>
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${dDone ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {dAnswered}/{dTotal}
                          </span>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/60 p-3 space-y-2.5">
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
            </div>

          /* ── Cloud requirements ── */
          ) : isCloud && cloudReqs.length > 0 ? (
            <div>
              <div className="mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Cloud-Specific Requirements</h3>
                <p className="text-xs text-slate-500 mt-0.5">Security controls for your selected cloud providers.</p>
              </div>

              <div className="space-y-3">
                {cloudReqs.map(req => {
                  const ans = answers.find(a => a.controlId === req.id);
                  const sev = SEVERITY_CONFIG[req.severity] ?? SEVERITY_CONFIG.informational;
                  const currentOpt = ANSWER_OPTIONS.find(o => o.value === ans?.answer);

                  return (
                    <div key={req.id} className={`border rounded-xl bg-white p-4 ${ans ? 'border-slate-200' : 'border-amber-200'}`}>
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          currentOpt?.value === 'yes' ? 'bg-emerald-100' :
                          currentOpt?.value === 'partial' ? 'bg-amber-100' :
                          currentOpt?.value === 'no' ? 'bg-red-100' : 'bg-slate-100'
                        }`}>
                          {currentOpt
                            ? <currentOpt.icon size={15} className={
                                currentOpt.value === 'yes' ? 'text-emerald-600' :
                                currentOpt.value === 'partial' ? 'text-amber-600' :
                                currentOpt.value === 'no' ? 'text-red-600' : 'text-slate-500'
                              } />
                            : <HelpCircle size={15} className="text-amber-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <code className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-mono">
                              {req.provider.toUpperCase()} / {req.service}
                            </code>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${sev.badge}`}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sev.dot}`} />
                              {sev.label}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 leading-snug">{req.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{req.description}</p>
                        </div>
                      </div>

                      {/* Answers */}
                      <div className="grid grid-cols-4 gap-2">
                        {ANSWER_OPTIONS.map(opt => {
                          const Icon = opt.icon;
                          const isActive = ans?.answer === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleAnswer(req.id, 'nist-csf', opt.value)}
                              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg border-2 text-xs font-semibold transition-all ${
                                isActive ? opt.activeClass : opt.inactiveClass
                              }`}
                            >
                              <Icon size={13} />
                              <span className="truncate">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          /* ── Empty state ── */
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                <HelpCircle size={30} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Select a framework from the sidebar</p>
              <p className="text-xs text-slate-400 mt-1">to begin answering controls</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom nav ── */}
      <div className="border-t border-slate-200 bg-white px-5 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors font-medium"
        >
          ← Back
        </button>
        <span className="text-xs text-slate-400">{stats.answered} of {stats.total} answered</span>
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-sm shadow-sm shadow-indigo-100"
        >
          Review & Generate <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

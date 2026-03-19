import { useState, useMemo } from 'react';
import type { AssessmentSession, ControlAnswer } from '../../../types/assessment';
import type { AnswerValue, Control } from '../../../types/frameworks';
import type { FrameworkId } from '../../../types/filters';
import { FRAMEWORK_MAP } from '../../../data/frameworks';
import { getCloudRequirements } from '../../../data/cloud-requirements';
import { ChevronDown, ChevronRight, MessageSquare, CheckCircle, HelpCircle } from 'lucide-react';

interface Props {
  session: AssessmentSession;
  onSetAnswers: (answers: ControlAnswer[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const ANSWER_OPTIONS: { value: AnswerValue; label: string; color: string; bg: string }[] = [
  { value: 'yes', label: 'Compliant', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-400' },
  { value: 'partial', label: 'Partial', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-400' },
  { value: 'no', label: 'Non-Compliant', color: 'text-red-700', bg: 'bg-red-50 border-red-400' },
  { value: 'na', label: 'N/A', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300' },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-green-100 text-green-700 border-green-200',
  informational: 'bg-slate-100 text-slate-600 border-slate-200',
};

function ControlRow({
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

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      answer ? 'border-slate-200' : 'border-amber-200 bg-amber-50/30'
    }`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-slate-500">{control.controlNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_COLORS[control.severity] ?? ''}`}>
                {control.severity}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-900">{control.title}</h4>
            <p className="text-xs text-slate-600 mt-1">{control.description}</p>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 mt-1"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Answer buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {ANSWER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onAnswer(control.id, control.frameworkId, opt.value, notes)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                ${answer?.answer === opt.value
                  ? `${opt.bg} ${opt.color} border-2`
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
          >
            <MessageSquare size={12} />
            Notes
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
          <div>
            <h5 className="text-xs font-semibold text-slate-700 mb-1">Implementation Guidance</h5>
            <p className="text-xs text-slate-600">{control.implementationGuidance}</p>
          </div>
          {control.remediationSteps.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-slate-700 mb-1">Remediation Steps</h5>
              <ul className="space-y-1">
                {control.remediationSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">Notes / Evidence</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => {
                if (answer) onAnswer(control.id, control.frameworkId, answer.answer, notes);
              }}
              placeholder="Add notes, evidence references, or exceptions..."
              rows={2}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg resize-none outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Count stats
  const stats = useMemo(() => {
    const allControls: Control[] = [];
    for (const fwId of session.profile.selectedFrameworks ?? []) {
      const fw = FRAMEWORK_MAP[fwId];
      if (fw) for (const d of fw.domains) allControls.push(...d.controls);
    }
    const answered = answers.length;
    const total = allControls.length;
    const compliant = answers.filter(a => a.answer === 'yes').length;
    const gaps = answers.filter(a => a.answer === 'no' || a.answer === 'partial').length;
    return { answered, total, compliant, gaps, percent: total > 0 ? Math.round((answered / total) * 100) : 0 };
  }, [answers, session.profile.selectedFrameworks]);

  const toggleDomain = (domainId: string) => {
    setExpandedDomains(prev => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  };

  // Cloud requirements injection
  const cloudReqs = useMemo(() => {
    if (!session.profile.cloudProviders?.length) return [];
    return getCloudRequirements(session.profile.cloudProviders);
  }, [session.profile.cloudProviders]);

  const cloudAnswers = answers.filter(a => a.controlId.startsWith('AWS-') || a.controlId.startsWith('AZ-') || a.controlId.startsWith('GCP-') || a.controlId.startsWith('HYBRID-'));

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Sidebar - framework navigation */}
      <div className="lg:w-56 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50 p-4">
        {/* Progress */}
        <div className="mb-4 p-3 bg-white rounded-xl border border-slate-200">
          <div className="flex justify-between text-xs text-slate-600 mb-1.5">
            <span>Progress</span>
            <span className="font-semibold">{stats.answered}/{stats.total}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            <div>
              <div className="text-xs font-bold text-emerald-600">{stats.compliant}</div>
              <div className="text-xs text-slate-500">OK</div>
            </div>
            <div>
              <div className="text-xs font-bold text-red-500">{stats.gaps}</div>
              <div className="text-xs text-slate-500">Gaps</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400">{stats.total - stats.answered}</div>
              <div className="text-xs text-slate-500">Pending</div>
            </div>
          </div>
        </div>

        {/* Framework tabs */}
        <div className="space-y-1">
          {(session.profile.selectedFrameworks ?? []).map(fwId => {
            const fw = FRAMEWORK_MAP[fwId];
            if (!fw) return null;
            const fwAnswers = answers.filter(a => a.frameworkId === fwId).length;
            const fwTotal = fw.domains.reduce((s, d) => s + d.controls.length, 0);
            const active = selectedFramework === fwId;
            return (
              <button
                key={fwId}
                onClick={() => setSelectedFramework(fwId)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors
                  ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
              >
                <div className="font-semibold">{fw.shortName}</div>
                <div className={`${active ? 'text-indigo-200' : 'text-slate-400'} mt-0.5`}>
                  {fwAnswers}/{fwTotal} answered
                </div>
              </button>
            );
          })}

          {cloudReqs.length > 0 && (
            <button
              onClick={() => setSelectedFramework('cloud' as FrameworkId)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors
                ${selectedFramework === ('cloud' as FrameworkId) ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
            >
              <div className="font-semibold">Cloud Requirements</div>
              <div className="text-xs opacity-70 mt-0.5">{cloudAnswers.length}/{cloudReqs.length} answered</div>
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        {currentFramework && selectedFramework !== ('cloud' as FrameworkId) ? (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">{currentFramework.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{currentFramework.description}</p>
            </div>

            {currentFramework.domains.map((domain, di) => {
              const domKey = `domain-${di}`;
              const isExpanded = expandedDomains.has(domKey);
              const domainAnswers = domain.controls.filter(c => answers.some(a => a.controlId === c.id)).length;

              return (
                <div key={domain.id} className="mb-4 border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleDomain(domKey)}
                    className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900">{domain.name}</div>
                      <div className="text-xs text-slate-500">{domain.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{domainAnswers}/{domain.controls.length}</span>
                      {domainAnswers === domain.controls.length && (
                        <CheckCircle size={14} className="text-emerald-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {domain.controls.map(control => (
                        <ControlRow
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
          </>
        ) : selectedFramework === ('cloud' as FrameworkId) && cloudReqs.length > 0 ? (
          <>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Cloud-Specific Requirements</h3>
              <p className="text-xs text-slate-500 mt-0.5">Security requirements specific to your selected cloud providers.</p>
            </div>
            <div className="space-y-3">
              {cloudReqs.map(req => {
                const ans = answers.find(a => a.controlId === req.id);
                return (
                  <div key={req.id} className={`border rounded-xl p-4 ${ans ? 'border-slate-200' : 'border-amber-200 bg-amber-50/30'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">{req.provider.toUpperCase()} / {req.service}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEVERITY_COLORS[req.severity] ?? ''}`}>{req.severity}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900">{req.title}</h4>
                        <p className="text-xs text-slate-600 mt-1">{req.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ANSWER_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleAnswer(req.id, 'nist-csf', opt.value)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                            ${ans?.answer === opt.value
                              ? `${opt.bg} ${opt.color} border-2`
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a framework from the left to start answering controls.</p>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-slate-200 bg-white p-4 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors text-sm">
          ← Back
        </button>
        <div className="text-xs text-slate-500">{stats.answered} of {stats.total} answered ({stats.percent}%)</div>
        <button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-medium transition-colors text-sm"
        >
          Review & Generate →
        </button>
      </div>
    </div>
  );
}

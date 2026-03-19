import React, { useState } from 'react';
import { Step1BusinessProfile } from './steps/Step1BusinessProfile';
import { Step2ITOTScope } from './steps/Step2ITOTScope';
import { Step3FrameworkSelect } from './steps/Step3FrameworkSelect';
import { Step4Requirements } from './steps/Step4Requirements';
import { Step5Review } from './steps/Step5Review';
import type { AssessmentSession } from '../../types/assessment';
import type { ControlAnswer } from '../../types/assessment';
import { v4 as uuidv4 } from 'uuid';

const STEPS = [
  { id: 1, title: 'Business Profile', desc: 'Organization details' },
  { id: 2, title: 'IT/OT Scope', desc: 'Infrastructure type' },
  { id: 3, title: 'Frameworks', desc: 'Select standards' },
  { id: 4, title: 'Assessment', desc: 'Answer controls' },
  { id: 5, title: 'Review', desc: 'Generate report' },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
      {STEPS.map((step, idx) => {
        const state = step.id < currentStep ? 'done' : step.id === currentStep ? 'active' : 'pending';
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-0 flex-shrink-0">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                ${state === 'done' ? 'bg-indigo-600 border-indigo-600 text-white' :
                  state === 'active' ? 'bg-white border-indigo-600 text-indigo-600' :
                  'bg-white border-slate-300 text-slate-400'}
              `}>
                {state === 'done' ? '✓' : step.id}
              </div>
              <div className={`text-xs mt-1 font-medium ${state === 'active' ? 'text-indigo-600' : state === 'done' ? 'text-indigo-500' : 'text-slate-400'}`}>
                {step.title}
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">{step.desc}</div>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${step.id < currentStep ? 'bg-indigo-600' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function AssessmentWizard() {
  const [session, setSession] = useState<AssessmentSession>({
    id: uuidv4(),
    profile: {},
    currentStep: 1,
    answers: [],
    startedAt: new Date().toISOString(),
  });

  const updateProfile = (updates: Partial<AssessmentSession['profile']>) => {
    setSession(prev => ({ ...prev, profile: { ...prev.profile, ...updates } }));
  };

  const setAnswers = (answers: ControlAnswer[]) => {
    setSession(prev => ({ ...prev, answers }));
  };

  const goToStep = (step: number) => {
    setSession(prev => ({ ...prev, currentStep: step }));
  };

  const next = () => goToStep(session.currentStep + 1);
  const back = () => goToStep(session.currentStep - 1);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <StepIndicator currentStep={session.currentStep} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {session.currentStep === 1 && (
          <Step1BusinessProfile
            profile={session.profile}
            onUpdate={updateProfile}
            onNext={next}
          />
        )}
        {session.currentStep === 2 && (
          <Step2ITOTScope
            profile={session.profile}
            onUpdate={updateProfile}
            onNext={next}
            onBack={back}
          />
        )}
        {session.currentStep === 3 && (
          <Step3FrameworkSelect
            profile={session.profile}
            onUpdate={updateProfile}
            onNext={next}
            onBack={back}
          />
        )}
        {session.currentStep === 4 && (
          <Step4Requirements
            session={session}
            onSetAnswers={setAnswers}
            onNext={next}
            onBack={back}
          />
        )}
        {session.currentStep === 5 && (
          <Step5Review
            session={session}
            onBack={back}
          />
        )}
      </div>
    </div>
  );
}

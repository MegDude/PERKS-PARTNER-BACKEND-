import React from 'react';
import { Button } from '@/components/ui/Button';

export default function SurveyResults({ survey, onBack }: any) {
  const questions = Array.isArray(survey.questions) ? survey.questions : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5 rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6 shadow-none">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Survey results</p>
        <h2 className="mt-2 text-xl font-bold text-[#11182B]">{survey.title}</h2>
        <p className="mt-2 text-sm leading-6 text-textSecondary">{survey.description}</p>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-t border-[rgba(11,31,51,0.08)] pt-3">
          <p className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Responses</p>
          <strong className="mt-2 block text-2xl text-[#11182B]">{survey.responses_count || 0}</strong>
        </div>
        <div className="border-t border-[rgba(11,31,51,0.08)] pt-3">
          <p className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Status</p>
          <strong className="mt-2 block text-sm text-[#11182B]">{survey.status || 'draft'}</strong>
        </div>
        <div className="border-t border-[rgba(11,31,51,0.08)] pt-3">
          <p className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">Reporting</p>
          <strong className="mt-2 block text-sm text-[#11182B]">{survey.reporting_export_enabled ? 'Included' : 'Not enabled'}</strong>
        </div>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#11182B]">Questions</h3>
          {questions.map((question: string, index: number) => (
            <div key={question} className="grid gap-1 border-t border-[rgba(11,31,51,0.08)] pt-3 sm:grid-cols-[90px_1fr]">
              <span className="text-[11px] font-bold uppercase text-[#C8A96A]">Question {index + 1}</span>
              <p className="text-sm leading-6 text-[#11182B]">{question}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex justify-start">
        <Button onClick={onBack}>Back to Surveys</Button>
      </div>
    </div>
  );
}

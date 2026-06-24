import React from 'react';
import { Button } from '@/components/ui/Button';

export default function SurveyResults({ survey, onBack }: any) {
  return (
    <div className="space-y-4 max-w-xl mx-auto p-4 border rounded shadow-none">
      <h2 className="text-xl font-bold text-[#11182B]">{survey.title} - Results</h2>
      <p className="text-textSecondary">{survey.description}</p>
      
      <div className="p-4 bg-muted text-center rounded-none mt-4">
        <p className="text-muted-foreground">Responses Count: {survey.responses_count || 0}</p>
      </div>

      <div className="flex justify-start">
        <Button onClick={onBack}>Back to Surveys</Button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SurveyForm({ survey, onSave, onCancel }: any) {
  const isTemplateDraft = survey?.template_key && !survey?.id;
  const [formData, setFormData] = useState({
    title: survey?.title || '',
    description: survey?.description || '',
    use_case: survey?.use_case || 'resident_feedback',
    questions: Array.isArray(survey?.questions) ? survey.questions.join('\n') : survey?.questions || '',
    status: survey?.status || 'draft',
    reporting_export_enabled: survey?.reporting_export_enabled ?? true,
  });

  const saveSurvey = () => {
    onSave({
      ...formData,
      questions: String(formData.questions || '')
        .split('\n')
        .map((question) => question.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-[#11182B]">{isTemplateDraft ? 'Create from template' : survey ? 'Edit survey' : 'Create survey'}</h2>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input 
          value={formData.title} 
          onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
          placeholder="Resident satisfaction pulse" 
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input 
          value={formData.description} 
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
          placeholder="Tell residents why their feedback matters." 
        />
      </div>
      <div className="space-y-2">
        <Label>Use case</Label>
        <select
          className="dp-admin-select w-full"
          value={formData.use_case}
          onChange={(e) => setFormData({ ...formData, use_case: e.target.value })}
        >
          <option value="resident_onboarding">Resident onboarding</option>
          <option value="perk_redemption_feedback">Perk redemption feedback</option>
          <option value="partner_application">Partner application</option>
          <option value="resident_intelligence">Resident intelligence</option>
          <option value="resident_feedback">Resident feedback</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>Questions</Label>
        <textarea
          className="dp-admin-input min-h-[150px] w-full"
          value={formData.questions}
          onChange={(e) => setFormData({ ...formData, questions: e.target.value })}
          placeholder="Add one question per line."
        />
        <p className="text-xs leading-5 text-[rgba(11,31,51,0.52)]">Add one question per line. These questions are saved with the survey record.</p>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#11182B]">
        <input
          type="checkbox"
          checked={Boolean(formData.reporting_export_enabled)}
          onChange={(e) => setFormData({ ...formData, reporting_export_enabled: e.target.checked })}
        />
        Include this survey in reporting exports
      </label>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={saveSurvey}>Save</Button>
      </div>
    </div>
  );
}

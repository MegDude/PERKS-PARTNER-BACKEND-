import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SurveyForm({ survey, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    title: survey?.title || '',
    description: survey?.description || '',
    status: survey?.status || 'draft'
  });

  return (
    <div className="space-y-4 max-w-xl mx-auto p-4 border rounded shadow-none">
      <h2 className="text-xl font-bold">{survey ? 'Edit Survey' : 'New Survey'}</h2>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input 
          value={formData.title} 
          onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
          placeholder="Survey Title" 
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input 
          value={formData.description} 
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
          placeholder="Survey Description" 
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(formData)}>Save</Button>
      </div>
    </div>
  );
}

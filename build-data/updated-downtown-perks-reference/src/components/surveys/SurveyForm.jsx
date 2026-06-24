import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
];

export default function SurveyForm({ survey = null, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: survey?.title || '',
    description: survey?.description || '',
    target_residents: survey?.target_residents || '',
    questions: survey?.questions || [],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'text',
    text: '',
    options: [],
  });

  const handleAddQuestion = () => {
    if (!currentQuestion.text.trim()) return;

    const newQuestions = [
      ...formData.questions,
      { ...currentQuestion, id: Date.now() },
    ];

    setFormData({ ...formData, questions: newQuestions });
    setCurrentQuestion({ type: 'text', text: '', options: [] });
  };

  const handleRemoveQuestion = (id) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter(q => q.id !== id),
    });
  };

  const handleSaveForm = () => {
    if (!formData.title.trim() || formData.questions.length === 0) {
      alert('Please provide a title and at least one question.');
      return;
    }

    onSave({
      title: formData.title,
      description: formData.description,
      target_residents: parseInt(formData.target_residents) || null,
      questions: formData.questions,
    });
  };

  return (
    <div className="space-y-6">
      {/* Survey Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Survey Title</label>
          <Input
            placeholder="e.g., 'Event Satisfaction Feedback'"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Description</label>
          <Textarea
            placeholder="Optional context or instructions for residents"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy mb-2">Target Residents (Optional)</label>
          <Input
            type="number"
            placeholder="Number of residents to send this survey to"
            value={formData.target_residents}
            onChange={(e) => setFormData({ ...formData, target_residents: e.target.value })}
          />
        </div>
      </div>

      {/* Questions Editor */}
      <div>
        <h3 className="text-lg font-bold text-navy mb-4">Questions ({formData.questions.length})</h3>

        {formData.questions.length > 0 && (
          <div className="space-y-3 mb-6">
            {formData.questions.map((q, idx) => (
              <Card key={q.id} className="bg-bgAlt border-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gold bg-navy px-2 py-1 rounded">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-textMuted uppercase font-semibold">
                          {QUESTION_TYPES.find(t => t.value === q.type)?.label}
                        </span>
                      </div>
                      <p className="text-navy font-medium">{q.text}</p>
                      {q.options?.length > 0 && (
                        <ul className="text-xs text-textSecondary mt-2 ml-4 list-disc">
                          {q.options.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveQuestion(q.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Question */}
        <Card className="bg-bgAlt border-dashed">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Question Type</label>
              <select
                value={currentQuestion.type}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value, options: [] })}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                {QUESTION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Question Text</label>
              <Textarea
                placeholder="Enter your question"
                value={currentQuestion.text}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                rows={2}
              />
            </div>

            {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'checkbox') && (
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Options</label>
                <div className="space-y-2 mb-3">
                  {currentQuestion.options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input value={opt} disabled className="bg-white" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const opts = currentQuestion.options.filter((_, i) => i !== idx);
                          setCurrentQuestion({ ...currentQuestion, options: opts });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id={`option-input-${Date.now()}`}
                    placeholder="Add option"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setCurrentQuestion({
                          ...currentQuestion,
                          options: [...currentQuestion.options, e.target.value],
                        });
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById(`option-input-${Date.now()}`);
                      if (input && input.value.trim()) {
                        setCurrentQuestion({
                          ...currentQuestion,
                          options: [...currentQuestion.options, input.value],
                        });
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddQuestion}
              className="w-full gap-2 bg-navy hover:bg-navySoft"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          onClick={handleSaveForm}
          className="flex-1 bg-navy hover:bg-navySoft"
        >
          Save Survey
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
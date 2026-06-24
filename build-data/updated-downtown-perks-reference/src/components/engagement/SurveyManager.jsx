import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function SurveyManager({ building }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: []
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys', building.id],
    queryFn: () => base44.entities.Survey.filter({ building_id: building.id })
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Survey.create({
      ...data,
      building_id: building.id,
      status: 'active',
      starts_at: new Date().toISOString().split('T')[0],
      responses_count: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys', building.id] });
      setFormData({ title: '', description: '', questions: [] });
      setShowForm(false);
      toast.success('Survey created successfully!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Survey title is required');
      return;
    }
    mutation.mutate(formData);
  };

  const activeSurveys = surveys.filter(s => s.status === 'active');

  return (
    <div className="space-y-6">
      {/* Current Surveys */}
      {activeSurveys.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSurveys.map((survey) => (
            <Card key={survey.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-start justify-between">
                  <span>{survey.title}</span>
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">{survey.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Responses</p>
                    <p className="text-2xl font-bold text-slate-800">{survey.responses_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Target</p>
                    <p className="text-2xl font-bold text-slate-800">{survey.target_residents || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Survey */}
      {!showForm ? (
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={() => setShowForm(true)}
              className="w-full bg-gold text-navy hover:bg-goldSoft"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Survey
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Create Survey</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Survey Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Downtown Perks Satisfaction Survey"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the survey..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-gold text-navy hover:bg-goldSoft"
                  >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create & Launch'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({ title: '', description: '', questions: [] });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
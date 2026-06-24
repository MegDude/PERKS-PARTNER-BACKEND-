import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
// Assume SurveyForm and SurveyResults components exist
import SurveyForm from '@/components/surveys/SurveyForm';
import SurveyResults from '@/components/surveys/SurveyResults';

const statusConfig: any = {
  draft: { icon: Clock, color: 'text-[#11182B] ', bg: 'bg-slate-50', label: 'Draft' },
  active: { icon: AlertCircle, color: 'text-[#11182B] ', bg: 'bg-slate-50', label: 'Active' },
  closed: { icon: CheckCircle, color: 'text-[#11182B] ', bg: 'bg-slate-50', label: 'Closed' },
};

export default function Surveys() {
  const { buildingId: ctxBuildingId } = useOutletContext<any>() || {};
  const { buildingId: paramBuildingId } = useParams();
  const buildingId = ctxBuildingId || paramBuildingId;
  const [showForm, setShowForm] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [editingSurvey, setEditingSurvey] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch surveys
  const { data: surveys = [], isLoading, refetch } = useQuery({
    queryKey: ['surveys', buildingId],
    queryFn: async () => {
      const all: any[] = await base44.entities.Survey.list();
      return all.filter((s: any) => s.building_id === buildingId);
    },
    enabled: !!buildingId,
  });

  const handleCreateSurvey = async (data: any) => {
    await base44.entities.Survey.create({
      ...data,
      building_id: buildingId,
      status: 'draft',
      responses_count: 0,
    });
    setShowForm(false);
    refetch();
  };

  const handleUpdateSurvey = async (id: string, data: any) => {
    await base44.entities.Survey.update(id, data);
    setEditingSurvey(null);
    refetch();
  };

  const handleDeleteSurvey = async (id: string) => {
    if (window.confirm('Delete this survey?')) {
      await base44.entities.Survey.delete(id);
      refetch();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await base44.entities.Survey.update(id, { status: newStatus });
    refetch();
  };

  if (selectedSurvey) {
    return (
      <SurveyResults
        survey={selectedSurvey}
        onBack={() => setSelectedSurvey(null)}
      />
    );
  }

  if (editingSurvey) {
    return (
      <SurveyForm
        survey={editingSurvey}
        onSave={(data: any) => handleUpdateSurvey(editingSurvey.id, data)}
        onCancel={() => setEditingSurvey(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bgMain p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#11182B] mb-2">Surveys</h1>
            <p className="text-textSecondary">Gather feedback and insights from residents</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 bg-navy hover:bg-navySoft text-white "
            >
              <Plus className="w-4 h-4" />
              New Survey
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-8 ">
            <CardContent className="p-8">
              <SurveyForm
                onSave={handleCreateSurvey}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Surveys List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-navy border-t-gold rounded-none animate-spin mx-auto"></div>
          </div>
        ) : (surveys as any[]).length === 0 ? (
          <Card className="">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-textMuted mx-auto mb-4 opacity-50" />
              <p className="text-textMuted text-lg">No surveys yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {(surveys as any[]).map((survey: any, idx: number) => {
              const statusCfg = statusConfig[survey.status] || statusConfig.draft;
              const StatusIcon = statusCfg.icon;

              return (
                <motion.div
                  key={survey.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className=" hover: transition-">
                    <CardContent className="pt-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-none ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-navy">{survey.title || 'Untitled Survey'}</h3>
                            <p className="text-textSecondary text-sm">
                              {survey.responses_count || 0} responses
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-none ${statusCfg.bg} ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setEditingSurvey(survey)} className="border-[#EFEFEF] text-slate-500 hover:bg-slate-50">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteSurvey(survey.id)} className="text-rose-500 hover:text-rose-600 border-[#EFEFEF]">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

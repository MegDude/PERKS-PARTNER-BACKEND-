import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import SurveyForm from '@/components/surveys/SurveyForm';
import SurveyResults from '@/components/surveys/SurveyResults';
import SurveyTaker from '@/components/surveys/SurveyTaker';

const statusConfig = {
  draft: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Draft' },
  active: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Active' },
  closed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Closed' },
};

export default function Surveys() {
  const navigate = useNavigate();
  const { buildingId: ctxBuildingId, building: ctxBuilding } = useOutletContext() || {};
  const { buildingId: paramBuildingId } = useParams();
  const buildingId = ctxBuildingId || paramBuildingId;
  const buildingName = ctxBuilding?.name;
  const [showForm, setShowForm] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [user, setUser] = useState(null);
  const [takingSurvey, setTakingSurvey] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch surveys
  const { data: surveys = [], isLoading, refetch } = useQuery({
    queryKey: ['surveys', buildingId],
    queryFn: async () => {
      const all = await base44.entities.Survey.list();
      return all.filter(s => s.building_id === buildingId);
    },
    enabled: !!buildingId,
  });

  const handleCreateSurvey = async (data) => {
    await base44.entities.Survey.create({
      ...data,
      building_id: buildingId,
      status: 'draft',
      responses_count: 0,
    });
    setShowForm(false);
    refetch();
  };

  const handleUpdateSurvey = async (id, data) => {
    await base44.entities.Survey.update(id, data);
    setEditingSurvey(null);
    refetch();
  };

  const handleDeleteSurvey = async (id) => {
    if (window.confirm('Delete this survey?')) {
      await base44.entities.Survey.delete(id);
      refetch();
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    await base44.entities.Survey.update(id, { status: newStatus });
    refetch();
  };

  if (takingSurvey) {
    return (
      <div className="min-h-screen bg-bgMain">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <SurveyTaker
            survey={takingSurvey}
            buildingId={buildingId}
            buildingName={buildingName}
            onClose={() => setTakingSurvey(null)}
          />
        </div>
      </div>
    );
  }

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
        onSave={(data) => handleUpdateSurvey(editingSurvey.id, data)}
        onCancel={() => setEditingSurvey(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-navy -ml-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy tracking-tight mb-0.5">Surveys</h1>
            <p className="text-sm text-textSecondary">Gather feedback and insights from residents</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-2 bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="w-4 h-4" />
              New Survey
            </Button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-8 shadow-soft">
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
            <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
          </div>
        ) : surveys.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-50" />
              <p className="text-textMuted text-lg">No surveys yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {surveys.map((survey, idx) => {
              const statusCfg = statusConfig[survey.status] || statusConfig.draft;
              const StatusIcon = statusCfg.icon;

              return (
                <motion.div
                  key={survey.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="shadow-soft hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => setSelectedSurvey(survey)}>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-navy">{survey.title}</h3>
                            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusCfg.label}
                            </div>
                          </div>
                          <p className="text-textSecondary text-sm mb-4">{survey.description}</p>
                          <div className="flex gap-6 text-xs text-textMuted">
                            <div>
                              <span className="font-semibold text-navy">{survey.questions?.length || 0}</span> questions
                            </div>
                            <div>
                              <span className="font-semibold text-navy">{survey.responses_count || 0}</span> responses
                            </div>
                            {survey.target_residents && (
                              <div>
                                Target: <span className="font-semibold text-navy">{survey.target_residents}</span> residents
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 ml-4">
                          {survey.status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-navy hover:bg-navySoft text-white gap-1"
                                  onClick={() => setTakingSurvey(survey)}
                                >
                                  Take Survey
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(survey.id, 'closed')}
                                >
                                  Close
                                </Button>
                              </>
                            )}
                          {survey.status === 'draft' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingSurvey(survey)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(survey.id, 'active')}
                              >
                                Launch
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSurvey(survey.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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
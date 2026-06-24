import React, { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle, MessageSquare, Workflow, Database, Brain, FileSpreadsheet, Send, Eye, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import SurveyForm from '@/components/surveys/SurveyForm';
import SurveyResults from '@/components/surveys/SurveyResults';

const statusConfig: any = {
  draft: { icon: Clock, color: 'text-[#11182B] ', bg: 'bg-white', label: 'Draft' },
  active: { icon: AlertCircle, color: 'text-[#11182B] ', bg: 'bg-white', label: 'Active' },
  closed: { icon: CheckCircle, color: 'text-[#11182B] ', bg: 'bg-white', label: 'Closed' },
};

const architectureLayers = [
  { icon: MessageSquare, layer: 'Resident feedback', platform: 'Collect resident input', purpose: 'Create surveys for onboarding, building feedback, event follow-up, perk feedback, and partner requests.' },
  { icon: MessageSquare, layer: 'Follow-up messages', platform: 'Reach the right audience', purpose: 'Send reminders, progress updates, and response follow-ups when residents need a next step.' },
  { icon: Database, layer: 'Resident records', platform: 'Keep responses connected', purpose: 'Attach feedback to resident, building, event, perk, partner, and campaign records.' },
  { icon: FileSpreadsheet, layer: 'Exports and reports', platform: 'Turn responses into evidence', purpose: 'Prepare clean summaries for property teams, partners, civic programs, and monthly reports.' },
  { icon: Brain, layer: 'Insights', platform: 'Find the signal', purpose: 'Summarize themes, sentiment, risks, opportunities, and recommended next actions.' },
  { icon: Workflow, layer: 'Follow-through', platform: 'Move from feedback to action', purpose: 'Route low scores, urgent comments, event feedback, and support requests to the right workflow.' },
];

const launchPhases = [
  ['Step 1', 'Collect', 'Ask clear questions at the right moment: onboarding, after an event, after a perk redemption, or when a building needs feedback.'],
  ['Step 2', 'Understand', 'Review participation, response themes, resident sentiment, and the actions that need attention.'],
  ['Step 3', 'Act', 'Send follow-ups, update campaigns, adjust perks, share reports, and close the loop with residents or partners.'],
];

const surveyTemplates = [
  {
    key: 'resident-onboarding',
    title: 'Resident Onboarding',
    badge: 'Recommended',
    use_case: 'resident_onboarding',
    description: 'Collect resident feedback and keep it connected to the right building, program, or campaign.',
    exportCopy: 'Included in reporting exports',
    reporting_export_enabled: true,
    questions: [
      'Which building do you live in?',
      'What floor or unit should we connect to your profile?',
      'What local categories are most useful to you: dining, fitness, coffee, events, nightlife, retail, services, or wellness?',
      'How often do you want to hear about nearby perks or events?',
      'What would make Downtown Perks more useful for your daily routine?',
    ],
  },
  {
    key: 'perk-redemption-feedback',
    title: 'Perk Redemption Feedback',
    badge: 'Recommended',
    use_case: 'perk_redemption_feedback',
    description: 'Learn whether residents used the offer, would return, and what could improve.',
    exportCopy: 'Included in reporting exports',
    reporting_export_enabled: true,
    questions: [
      'Which perk did you use?',
      'How easy was it to redeem the perk?',
      'Would you visit this partner again?',
      'What could make the offer clearer or more useful?',
      'Would you like to see more offers like this?',
    ],
  },
  {
    key: 'partner-application',
    title: 'Partner Application',
    badge: 'Available',
    use_case: 'partner_application',
    description: 'Collect the details needed to route partner requests into the right workspace path.',
    exportCopy: 'Included in reporting exports',
    reporting_export_enabled: true,
    questions: [
      'What organization should we connect to Downtown Perks?',
      'What partner type best describes the organization?',
      'Which location, district, or service area should appear in the workspace?',
      'What are you trying to promote first?',
      'Who should own workspace access for this organization?',
    ],
  },
  {
    key: 'resident-intelligence-platform',
    title: 'Resident Intelligence Platform',
    badge: 'Future phase',
    use_case: 'resident_intelligence',
    description: 'Collect resident feedback and keep it connected to the right building, program, or campaign.',
    exportCopy: 'Report export not enabled yet',
    reporting_export_enabled: false,
    questions: [
      'What themes are residents bringing up most often?',
      'Which building, event, perk, or partner does this feedback connect to?',
      'What sentiment best describes the response?',
      'What action should the operator take next?',
      'Should this response be included in monthly intelligence reporting?',
    ],
  },
];

export default function Surveys() {
  const { buildingId: ctxBuildingId } = useOutletContext<any>() || {};
  const { buildingId: paramBuildingId } = useParams();
  const buildingId = ctxBuildingId || paramBuildingId;
  const [showForm, setShowForm] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [editingSurvey, setEditingSurvey] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch surveys
  const { data: surveys = [], isLoading, refetch } = useQuery({
    queryKey: ['surveys', buildingId],
    queryFn: async () => {
      const all: any[] = await base44.entities.Survey.list();
      return buildingId ? all.filter((s: any) => s.building_id === buildingId) : all;
    },
  });

  const { data: messagingJourneys = [] } = useQuery({
    queryKey: ['messaging-journeys'],
    queryFn: () => base44.entities.MessagingJourney.list().catch(() => []),
  });

  const { data: integrationEndpoints = [] } = useQuery({
    queryKey: ['integration-endpoints'],
    queryFn: () => base44.entities.IntegrationEndpoint.list().catch(() => []),
  });

  const { data: automationRuns = [] } = useQuery({
    queryKey: ['survey-automation-runs'],
    queryFn: () => base44.entities.AutomationRun.list().catch(() => []),
  });

  const { data: crmSegments = [] } = useQuery({
    queryKey: ['crm-segments'],
    queryFn: () => base44.entities.CrmSegment.list().catch(() => []),
  });

  const handleCreateSurvey = async (data: any) => {
    await base44.entities.Survey.create({
      ...data,
      ...(buildingId ? { building_id: buildingId } : {}),
      status: 'draft',
      responses_count: 0,
    });
    setShowForm(false);
    setEditingSurvey(null);
    refetch();
  };

  const templateToSurvey = (template: any, status = 'draft') => ({
    title: template.title,
    description: template.description,
    use_case: template.use_case,
    template_key: template.key,
    template_badge: template.badge,
    questions: template.questions,
    reporting_export_enabled: template.reporting_export_enabled,
    reporting_status: template.exportCopy,
    status,
    responses_count: 0,
    ...(buildingId ? { building_id: buildingId } : {}),
  });

  const handleUseTemplate = (template: any) => {
    setEditingSurvey(templateToSurvey(template, 'draft'));
    setShowForm(false);
    setPreviewTemplate(null);
  };

  const handleDeployTemplate = async (template: any) => {
    await base44.entities.Survey.create(templateToSurvey(template, 'active'));
    setPreviewTemplate(null);
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
        onSave={(data: any) => editingSurvey.id ? handleUpdateSurvey(editingSurvey.id, data) : handleCreateSurvey(data)}
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
            <p className="max-w-3xl text-textSecondary">Create resident surveys, review responses, and turn feedback into clear follow-up for buildings, events, perks, and partner programs.</p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              className="gap-1.5 text-[#11182B]"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Survey
            </Button>
          )}
        </div>

        <section className="mb-8 rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Resident feedback</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#0B1F33]">Ask, understand, and act.</h2>
              <p className="mt-3 text-sm leading-6 text-[rgba(11,31,51,0.68)]">
                Use surveys to learn what residents need, what events delivered, which perks are working, and where a property or partner should take action next.
              </p>
              <div className="mt-5 grid gap-3">
                {launchPhases.map(([phase, title, body]) => (
                  <div key={phase} className="border-t border-[rgba(11,31,51,0.08)] pt-3">
                    <p className="text-[11px] font-bold uppercase text-[#C8A96A]">{phase} - {title}</p>
                    <p className="mt-1 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {architectureLayers.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.layer} className="border-t border-[rgba(11,31,51,0.08)] bg-white pt-4">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[#C8A96A]" />
                      <p className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{item.layer}</p>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-[#0B1F33]">{item.platform}</h3>
                    <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{item.purpose}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel title="Feedback forms" eyebrow="Survey library">
            <div className="grid gap-3">
              {surveyTemplates.map((template) => (
                <TemplateCard
                  key={template.key}
                  template={template}
                  onPreview={() => setPreviewTemplate(template)}
                  onUse={() => handleUseTemplate(template)}
                  onDeploy={() => handleDeployTemplate(template)}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Resident follow-up journeys" eyebrow="Messaging">
            <div className="grid gap-3">
              {(messagingJourneys as any[]).map((journey: any) => (
                <OperationalRow
                  key={journey.id || journey.name}
                  title={journey.name}
                  meta={`${formatStatus(journey.status)} · ${formatUseCase(journey.audience || 'audience')}`}
                  detail={rewriteJourneyPurpose(journey.purpose)}
                  extra={summarizeJourney(journey)}
                />
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-8 grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Panel title="Reporting connections" eyebrow="Exports">
            <div className="grid gap-3">
              {(integrationEndpoints as any[]).map((endpoint: any) => (
                <OperationalRow
                  key={endpoint.id || endpoint.name}
                  title={displayIntegrationName(endpoint.name)}
                  meta={`${displayLayer(endpoint.layer || endpoint.provider)} · ${formatStatus(endpoint.status)}`}
                  detail={rewriteIntegrationPurpose(endpoint.purpose)}
                  extra={integrationActionCopy(endpoint.status)}
                />
              ))}
            </div>
          </Panel>

          <Panel title="Follow-up workflows" eyebrow="Action queue">
            <div className="grid gap-3">
              {(automationRuns as any[]).map((run: any) => (
                <OperationalRow
                  key={run.id || run.name}
                  title={displayWorkflowName(run.name)}
                  meta={`${formatStatus(run.status)} · ${displayWorkflowTarget(run.target)}`}
                  detail={rewriteWorkflowAction(run.action)}
                  extra={displayWorkflowTrigger(run.trigger)}
                />
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-8 rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatTile label="Feedback templates" value={surveyTemplates.length} />
            <StatTile label="Follow-up journeys" value={(messagingJourneys as any[]).length} />
            <StatTile label="CRM segments" value={(crmSegments as any[]).length} />
            <StatTile label="Workflows" value={(automationRuns as any[]).length} />
          </div>
        </section>

        {previewTemplate ? (
          <TemplatePreview
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onUse={() => handleUseTemplate(previewTemplate)}
            onDeploy={() => handleDeployTemplate(previewTemplate)}
          />
        ) : null}

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
              <p className="text-textMuted text-lg">No surveys are active for this building yet.</p>
              <p className="mt-2 text-sm text-textMuted">Create a satisfaction, event feedback, NPS, or perk feedback survey when you need resident input.</p>
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
                          <div className={`border border-[rgba(11,31,51,0.08)] p-3 rounded-none ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-navy">{survey.title || 'Resident feedback survey'}</h3>
                            <p className="text-textSecondary text-sm">
                              {survey.responses_count || 0} responses
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`border border-[rgba(11,31,51,0.08)] px-3 py-1 text-xs font-bold uppercase tracking-normal rounded-none ${statusCfg.bg} ${statusCfg.color}`}>
                            {statusCfg.label}
                          </span>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button aria-label={`View results for ${survey.title || 'survey'}`} title="View results" variant="outline" size="sm" onClick={() => setSelectedSurvey(survey)} className="border-[#EFEFEF] text-[#11182B] hover:bg-slate-50">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button aria-label={`Edit ${survey.title || 'survey'}`} title="Edit survey" variant="outline" size="sm" onClick={() => setEditingSurvey(survey)} className="border-[#EFEFEF] text-[#11182B] hover:bg-slate-50">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            {survey.status === 'active' ? (
                              <Button aria-label={`Close ${survey.title || 'survey'}`} title="Close survey" variant="outline" size="sm" onClick={() => handleStatusChange(survey.id, 'closed')} className="border-[#EFEFEF] text-[#11182B] hover:bg-slate-50">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button aria-label={`Publish ${survey.title || 'survey'}`} title="Publish survey" variant="outline" size="sm" onClick={() => handleStatusChange(survey.id, 'active')} className="border-[#EFEFEF] text-[#11182B] hover:bg-slate-50">
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                            <Button aria-label={`Delete ${survey.title || 'survey'}`} title="Delete survey" variant="outline" size="sm" onClick={() => handleDeleteSurvey(survey.id)} className="text-rose-500 hover:text-rose-600 border-[#EFEFEF]">
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

function Panel({ eyebrow, title, children }: any) {
  return (
    <article className="rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-semibold text-[#0B1F33]">{title}</h2>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function TemplateCard({ template, onPreview, onUse, onDeploy }: any) {
  return (
    <article className="border-t border-[rgba(11,31,51,0.08)] pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#0B1F33]">{template.title}</h3>
          <p className="mt-1 text-xs font-semibold text-[#C8A96A]">{template.badge} · {formatUseCase(template.use_case)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onPreview} className="text-[#11182B]">Preview</Button>
          <Button variant="outline" onClick={onUse} className="text-[#11182B]"><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
          <Button onClick={onDeploy} className="text-[#11182B]"><Rocket className="h-3.5 w-3.5" /> Deploy</Button>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{template.description}</p>
      <p className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.48)]">{template.exportCopy}</p>
      <div className="mt-3 grid gap-1.5">
        {template.questions.slice(0, 3).map((question: string) => (
          <p key={question} className="border-l border-[#C8A96A] pl-3 text-xs leading-5 text-[rgba(11,31,51,0.6)]">{question}</p>
        ))}
      </div>
    </article>
  );
}

function TemplatePreview({ template, onClose, onUse, onDeploy }: any) {
  return (
    <section className="mb-8 rounded-xl border border-[rgba(11,31,51,0.08)] bg-white p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">Template preview</p>
          <h2 className="mt-2 text-xl font-semibold text-[#0B1F33]">{template.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgba(11,31,51,0.62)]">{template.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={onUse}><Edit2 className="h-3.5 w-3.5" /> Edit template</Button>
          <Button onClick={onDeploy}><Rocket className="h-3.5 w-3.5" /> Deploy survey</Button>
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        {template.questions.map((question: string, index: number) => (
          <div key={question} className="grid gap-1 border-t border-[rgba(11,31,51,0.08)] pt-3 sm:grid-cols-[90px_1fr]">
            <span className="text-[11px] font-bold uppercase text-[#C8A96A]">Question {index + 1}</span>
            <p className="text-sm leading-6 text-[#0B1F33]">{question}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OperationalRow({ title, meta, detail, extra }: any) {
  return (
    <div className="border-t border-[rgba(11,31,51,0.08)] pt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#0B1F33]">{title}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-normal text-[#C8A96A]">{meta}</p>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-[rgba(11,31,51,0.62)]">{detail}</p>
      {extra ? <p className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.48)]">{extra}</p> : null}
    </div>
  );
}

function StatTile({ label, value }: any) {
  return (
    <div className="border-t border-[rgba(11,31,51,0.08)] pt-3">
      <p className="text-[11px] font-bold uppercase text-[rgba(11,31,51,0.52)]">{label}</p>
      <strong className="mt-2 block text-2xl font-semibold text-[#0B1F33]">{value}</strong>
    </div>
  );
}

function formatStatus(status?: string) {
  const value = String(status || 'planned')
    .replace(/ready_for_credentials|pending_credentials/g, 'Setup needed')
    .replace(/configured/g, 'Ready')
    .replace(/seeded/g, 'Available')
    .replace(/planned/g, 'Planned')
    .replace(/active/g, 'Active')
    .replace(/_/g, ' ');
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatUseCase(value?: string) {
  return String(value || 'survey')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function rewriteJourneyPurpose(purpose?: string) {
  const text = String(purpose || '').toLowerCase();
  if (text.includes('passport')) return 'Keep residents informed about progress, stamps, and rewards.';
  if (text.includes('event')) return 'Remind residents before events and collect feedback afterward.';
  if (text.includes('support')) return 'Route resident issues to the right operator and follow up when they are resolved.';
  return 'Help residents complete the next step without losing the context of their original action.';
}

function summarizeJourney(journey: any) {
  if (Array.isArray(journey?.flow) && journey.flow.length > 0) {
    return journey.flow
      .map((step: string) => formatUseCase(step))
      .join(' → ');
  }
  return displayWorkflowTrigger(journey?.trigger);
}

function displayIntegrationName(name?: string) {
  const text = String(name || 'Reporting connection').toLowerCase();
  if (text.includes('webhook')) return 'Survey response intake';
  if (text.includes('verify')) return 'Resident phone verification';
  if (text.includes('messaging')) return 'Resident messaging';
  if (text.includes('sheets')) return 'Report export connection';
  if (text.includes('workflow')) return 'Workflow routing';
  if (text.includes('insights')) return 'Response insights';
  return formatUseCase(name || 'Reporting connection');
}

function displayLayer(layer?: string) {
  const text = String(layer || '').toLowerCase();
  if (text.includes('survey')) return 'Feedback';
  if (text.includes('messaging')) return 'Messaging';
  if (text.includes('analytics')) return 'Reporting';
  if (text.includes('automation')) return 'Workflow';
  if (text.includes('ai')) return 'Insights';
  return formatUseCase(layer || 'Platform');
}

function rewriteIntegrationPurpose(purpose?: string) {
  const text = String(purpose || '').toLowerCase();
  if (text.includes('verified phone')) return 'Verify resident contact details before sending reminders or follow-ups.';
  if (text.includes('reminders') || text.includes('messaging')) return 'Send resident reminders, progress updates, and post-action follow-ups.';
  if (text.includes('report') || text.includes('sheets')) return 'Make survey data available for clean exports and monthly reporting.';
  if (text.includes('summaries') || text.includes('sentiment')) return 'Turn response text into themes, risks, opportunities, and next steps.';
  return 'Keep survey responses connected to reporting, resident records, and operator follow-up.';
}

function integrationActionCopy(status?: string) {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('configured') || normalized.includes('active')) return 'Ready to use in survey workflows.';
  return 'Needs setup before this workflow can run live.';
}

function displayWorkflowName(name?: string) {
  const text = String(name || '').toLowerCase();
  if (text.includes('webhook') || text.includes('intake')) return 'New response intake';
  if (text.includes('event')) return 'Event reminder follow-up';
  if (text.includes('passport') || text.includes('stamp')) return 'Passport progress follow-up';
  if (text.includes('survey analysis') || text.includes('ai')) return 'Response insight summary';
  return formatUseCase(name || 'Workflow');
}

function displayWorkflowTarget(target?: string) {
  const text = String(target || '').toLowerCase();
  if (text.includes('survey')) return 'Survey responses';
  if (text.includes('event')) return 'Event feedback';
  if (text.includes('passport')) return 'Passport activity';
  if (text.includes('insight')) return 'Insights';
  return 'Resident action';
}

function rewriteWorkflowAction(action?: string) {
  const text = String(action || '').toLowerCase();
  if (text.includes('store response')) return 'Save the response, update reporting, and prepare a clear summary for operators.';
  if (text.includes('24h') || text.includes('2h')) return 'Remind residents before the event and keep the RSVP journey on track.';
  if (text.includes('reward')) return 'Notify residents when progress changes or a reward is unlocked.';
  if (text.includes('sentiment') || text.includes('recommend')) return 'Summarize responses, identify sentiment, and suggest the next action.';
  return action || 'Move the response to the right follow-up workflow.';
}

function displayWorkflowTrigger(trigger?: string) {
  const text = String(trigger || '').toLowerCase();
  if (text.includes('webhook')) return 'Starts when a new response is submitted.';
  if (text.includes('rsvp')) return 'Starts when a resident RSVPs.';
  if (text.includes('qr') || text.includes('stamp')) return 'Starts when a QR action is recorded.';
  if (text.includes('survey response')) return 'Starts when a survey response is completed.';
  return trigger ? `Starts when ${trigger}.` : 'Start condition not set yet.';
}

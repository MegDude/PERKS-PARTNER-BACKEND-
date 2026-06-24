import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { MessageSquare, Star, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function SurveyActivity({ buildingId }) {
  const [retrying, setRetrying] = useState(false);

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['survey_responses', buildingId],
    queryFn: async () => {
      const all = await base44.entities.SurveyResponse.list('-completed_at');
      return buildingId ? all.filter(r => r.building_id === buildingId) : all;
    },
  });

  const { data: exportLogs = [] } = useQuery({
    queryKey: ['survey_export_logs'],
    queryFn: () => base44.entities.SurveyExportLog.list(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['management_notifications'],
    queryFn: () => base44.entities.ManagementNotification.list('-created_at'),
  });

  // Calculate summary stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completionsToday = responses.filter(r => r.completed_at && new Date(r.completed_at) >= today).length;
  const redemptionLinked = responses.filter(r => r.redemption_id).length;
  const scoredResponses = responses.filter(r => r.score != null);
  const avgScore = scoredResponses.length > 0
    ? Math.round(scoredResponses.reduce((sum, r) => sum + r.score, 0) / scoredResponses.length)
    : 0;
  const exportFailed = exportLogs.filter(l => l.status === 'failed').length;
  const exportHealth = exportLogs.length > 0
    ? Math.round(((exportLogs.length - exportFailed) / exportLogs.length) * 100)
    : 100;
  const negativeFeedback = responses.filter(r => r.sentiment === 'negative').length;

  const stats = [
    { label: 'Completions Today', value: completionsToday, icon: MessageSquare, color: 'text-navy' },
    { label: 'Redemption-Linked', value: redemptionLinked, icon: Star, color: 'text-gold' },
    { label: 'Avg Score', value: avgScore || '—', icon: Star, color: 'text-navy' },
    { label: 'Export Health', value: `${exportHealth}%`, icon: exportHealth === 100 ? CheckCircle2 : AlertCircle, color: exportHealth === 100 ? 'text-green-600' : 'text-orange-500' },
  ];

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await base44.functions.invoke('retryPendingSurveyExports', {});
      const data = res.data || res;
      toast.success(`Retried ${data.retried || 0} exports — ${data.succeeded || 0} succeeded`);
    } catch (error) {
      toast.error('Retry failed: ' + (error.message || ''));
    } finally {
      setRetrying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-[var(--border-subtle)]">
        <h3 className="font-bold text-navy mb-1">Survey Activity</h3>
        <p className="text-sm text-textMuted">No survey responses yet. Responses will appear here once residents complete surveys.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 border border-[var(--border-subtle)] shadow-soft"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-textMuted uppercase tracking-wide">{stat.label}</span>
                <Icon className={cn('w-3.5 h-3.5', stat.color)} />
              </div>
              <div className={cn('text-xl font-bold', stat.color)}>{stat.value}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Latest Completions */}
      <div className="bg-white rounded-2xl border border-[var(--border-subtle)] shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="font-bold text-navy text-sm">Latest Survey Completions</h3>
            <p className="text-xs text-textMuted mt-0.5">{responses.length} total responses</p>
          </div>
          {exportFailed > 0 && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1.5 text-xs font-semibold text-navy bg-gold/10 hover:bg-gold/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Retry {exportFailed} failed
            </button>
          )}
        </div>

        <div className="divide-y divide-[var(--border-subtle)] max-h-80 overflow-y-auto">
          {responses.slice(0, 15).map((response) => {
            const exportLog = exportLogs.find(l => l.survey_response_id === response.id);
            const notification = notifications.find(n => n.survey_response_id === response.id);
            return (
              <div key={response.id} className="px-5 py-3 flex items-center gap-3 hover:bg-bgAlt/50 transition-colors">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  response.sentiment === 'positive' ? 'bg-green-50' :
                  response.sentiment === 'negative' ? 'bg-orange-50' : 'bg-bgAlt'
                )}>
                  {response.sentiment === 'positive' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                   response.sentiment === 'negative' ? <AlertCircle className="w-4 h-4 text-orange-500" /> :
                   <MessageSquare className="w-4 h-4 text-textMuted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy text-sm truncate">{response.resident_name}</span>
                    {response.score != null && (
                      <span className="text-xs text-gold font-bold">{response.score}</span>
                    )}
                  </div>
                  <div className="text-xs text-textMuted truncate">
                    {response.survey_name || 'Survey'}
                    {response.building_name && ` · ${response.building_name}`}
                    {response.perk_name && ` · ${response.perk_name}`}
                    {response.partner_name && ` · ${response.partner_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {exportLog && (
                    <span className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      exportLog.status === 'success' ? 'bg-green-50 text-green-700' :
                      exportLog.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'
                    )}>
                      {exportLog.status === 'success' ? 'Exported' : exportLog.status === 'failed' ? 'Failed' : 'Pending'}
                    </span>
                  )}
                  <span className="text-[10px] text-textMuted">
                    {response.completed_at ? new Date(response.completed_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
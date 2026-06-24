import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, Star, Send, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { buildSurveyExportPayload, exportSurveyResponseToSheet } from '@/services/surveyExportService';
import { sendManagementNotification } from '@/services/managementNotificationService';

export default function SurveyTaker({ survey, buildingId, buildingName, onClose }) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const questions = Array.isArray(survey.questions) ? survey.questions : [];
  const answeredCount = questions.filter((_, idx) => answers[idx] !== undefined && answers[idx] !== '').length;
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleAnswer = (idx, value) => {
    setAnswers({ ...answers, [idx]: value });
  };

  const calculateScore = () => {
    const ratingAnswers = Object.entries(answers)
      .filter(([idx, val]) => typeof val === 'number')
      .map(([, val]) => val);
    if (ratingAnswers.length === 0) return null;
    return Math.round(ratingAnswers.reduce((a, b) => a + b, 0) / ratingAnswers.length * 20);
  };

  const determineSentiment = (score) => {
    if (score == null) return null;
    if (score >= 70) return 'positive';
    if (score >= 40) return 'neutral';
    return 'negative';
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((_, idx) => !answers[idx] && answers[idx] !== 0);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      const score = calculateScore();
      const formattedAnswers = questions.map((q, idx) => ({
        question: q.question || q.title || `Question ${idx + 1}`,
        answer: String(answers[idx] ?? ''),
      }));

      const res = await base44.functions.invoke('processSurveyResponse', {
        survey_id: survey.id,
        answers: formattedAnswers,
        score,
        sentiment: determineSentiment(score),
        source_flow: 'resident-survey',
        building_id: buildingId,
      });
      const data = res.data || res;

      setSubmitted(true);
      queryClient.invalidateQueries(['surveys']);
      queryClient.invalidateQueries(['survey_responses']);

      // Success confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0B1F33', '#C9A227', '#E8C97A'],
      });

      if (data?.export_status === 'success') {
        toast.success('Survey submitted and exported to Google Sheets');
      } else {
        toast.success('Survey submitted');
      }

      // Fire frontend webhook services (non-blocking — these complement the
      // backend processSurveyResponse function with configurable webhook URLs)
      const timestamp = new Date().toISOString();
      const exportPayload = buildSurveyExportPayload({
        surveyId: survey.id,
        buildingId,
        buildingName,
        residentName: data?.resident_name,
        residentEmail: data?.resident_email,
        perkId: data?.perk_id,
        perkName: data?.perk_name,
        redemptionId: data?.redemption_id,
        answers: formattedAnswers,
        score,
        sentiment: determineSentiment(score),
        sourceRoute: window.location.pathname,
      });

      const exportResult = await exportSurveyResponseToSheet(exportPayload);

      await sendManagementNotification({
        timestamp,
        buildingId,
        buildingName,
        surveyId: survey.id,
        perkId: data?.perk_id,
        redemptionId: data?.redemption_id,
        exportStatus: exportResult.status,
        answersSummary: exportPayload.answersSummary,
      }).catch(() => {});
    } catch (error) {
      toast.error('Failed to submit survey: ' + (error.message || ''));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 text-center border border-[var(--border-subtle)] shadow-soft overflow-hidden relative"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
          className="w-16 h-16 bg-gradient-to-br from-gold to-goldSoft rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-gold"
        >
          <CheckCircle2 className="w-8 h-8 text-navy" />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-lg font-bold text-navy mb-1"
        >
          Thank you!
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="text-sm text-textSecondary mb-1"
        >
          Your feedback has been recorded.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex items-center justify-center gap-1.5 text-xs text-gold mb-5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>You've earned a perk reward</span>
        </motion.div>
        <Button onClick={onClose} variant="outline" className="text-navy">
          Close
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[var(--border-subtle)] shadow-soft overflow-hidden"
    >
      {/* Header */}
      <div className="bg-navy text-white px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Survey</p>
            <h3 className="font-bold text-sm truncate">{survey.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Progress indicator */}
        {questions.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  progressPct === 100 ? 'bg-green-400' : 'bg-gold'
                )}
              />
            </div>
            <span className="text-[10px] font-semibold text-white/60 tabular-nums shrink-0">
              {answeredCount}/{questions.length}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {survey.description && (
        <div className="px-5 pt-4">
          <p className="text-sm text-textSecondary">{survey.description}</p>
        </div>
      )}

      {/* Questions */}
      <div className="p-5 space-y-5">
        {questions.length === 0 ? (
          <p className="text-center text-textMuted text-sm py-4">This survey has no questions.</p>
        ) : (
          questions.map((q, idx) => {
            const questionText = q.question || q.title || `Question ${idx + 1}`;
            const type = q.type || 'text';
            const options = q.options || q.choices || [];

            return (
              <div key={idx}>
                <label className="block text-sm font-semibold text-navy mb-2">
                  {idx + 1}. {questionText}
                </label>

                {type === 'rating' || type === 'scale' ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleAnswer(idx, rating)}
                        className={cn(
                          'w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all',
                          answers[idx] === rating
                            ? 'border-gold bg-gold/10 text-gold'
                            : 'border-[var(--border-subtle)] text-textMuted hover:border-gold/50'
                        )}
                      >
                        <Star className={cn('w-4 h-4', answers[idx] === rating && 'fill-current')} />
                      </button>
                    ))}
                  </div>
                ) : type === 'choice' || type === 'multiple_choice' ? (
                  <div className="space-y-2">
                    {options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswer(idx, typeof option === 'string' ? option : option.value || option.label)}
                        className={cn(
                          'w-full text-left px-4 py-2.5 rounded-xl border transition-all text-sm',
                          answers[idx] === (typeof option === 'string' ? option : option.value || option.label)
                            ? 'border-navy bg-navy/5 text-navy font-medium'
                            : 'border-[var(--border-subtle)] text-textSecondary hover:border-navy/30'
                        )}
                      >
                        {typeof option === 'string' ? option : option.label || option.value}
                      </button>
                    ))}
                  </div>
                ) : (
                  <textarea
                    value={answers[idx] || ''}
                    onChange={(e) => handleAnswer(idx, e.target.value)}
                    placeholder="Type your answer..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm text-navy"
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="text-navy">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || questions.length === 0}
          className="bg-navy hover:bg-navySoft text-white gap-1.5"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Send className="w-3.5 h-3.5" /> Submit</>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
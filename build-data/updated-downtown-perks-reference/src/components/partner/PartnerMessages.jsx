import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MailOpen, Reply, Send, Loader2, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function PartnerMessages({ messages, userPartner }) {
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const markReadMutation = useMutation({
    mutationFn: (msgId) => base44.functions.invoke('handlePartnerMessage', { action: 'mark_read', message_id: msgId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['partner_context'] }),
  });

  const replyMutation = useMutation({
    mutationFn: ({ originalMsg, reply }) => base44.functions.invoke('handlePartnerMessage', {
      action: 'reply',
      message_id: originalMsg.id,
      reply_text: reply,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner_context'] });
      setReplyingTo(null);
      setReplyText('');
      toast.success('Reply sent!');
    },
  });

  const handleReply = (msg) => {
    if (msg.status === 'unread') markReadMutation.mutate(msg.id);
    setReplyingTo(replyingTo === msg.id ? null : msg.id);
    setReplyText('');
  };

  const sendReply = (msg) => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ originalMsg: msg, reply: replyText });
  };

  const unreadCount = messages.filter(m => m.status === 'unread').length;

  const getStatusIcon = (status) => {
    if (status === 'unread') return <Mail className="w-4 h-4 text-gold" />;
    if (status === 'replied') return <Reply className="w-4 h-4 text-green-600" />;
    return <MailOpen className="w-4 h-4 text-textMuted" />;
  };

  return (
    <Card className="bg-white border-[var(--border-subtle)]">
      <CardHeader>
        <CardTitle className="text-navy flex items-center gap-2">
          <Inbox className="w-5 h-5 text-gold" />
          Message Inbox
        </CardTitle>
        <CardDescription>
          {messages.length} total messages{unreadCount > 0 && ` · ${unreadCount} unread`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-10 h-10 text-textMuted/40 mx-auto mb-3" />
            <p className="text-textMuted text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'rounded-xl border p-4 transition-all',
                  msg.status === 'unread' ? 'border-gold/30 bg-gold/5' : 'border-[var(--border-subtle)] bg-white'
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      msg.status === 'unread' ? 'bg-gold/15' : 'bg-bgAlt'
                    )}>
                      {getStatusIcon(msg.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-navy text-sm">{msg.subject}</span>
                        {msg.status === 'unread' && (
                          <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium">New</span>
                        )}
                        {msg.status === 'replied' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Replied</span>
                        )}
                      </div>
                      <p className="text-xs text-textMuted mt-0.5">
                        from {msg.resident_name || 'Resident'} · {msg.sent_at ? new Date(msg.sent_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleReply(msg)} className="text-navy hover:bg-bgAlt shrink-0">
                    <Reply className="w-3.5 h-3.5 mr-1" /> Reply
                  </Button>
                </div>
                <p className="text-sm text-textSecondary sm:ml-12">{msg.message}</p>

                {replyingTo === msg.id && (
                  <div className="mt-3 sm:ml-12 space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      rows={3}
                      className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sendReply(msg)}
                        disabled={!replyText.trim() || replyMutation.isPending}
                        className="bg-navy hover:bg-navy/90 text-white"
                      >
                        {replyMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 mr-1" /> Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
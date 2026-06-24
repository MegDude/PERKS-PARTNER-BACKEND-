import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Send } from 'lucide-react';

export default function PartnerMessaging({ partner, user, isOpen, onOpenChange }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const messageMutation = useMutation({
    mutationFn: async () => {
      if (!user || !subject.trim() || !message.trim()) return;
      await base44.entities.PartnerMessage.create({
        partner_id: partner.id,
        partner_name: partner.business_name,
        resident_email: user.email,
        resident_name: user.full_name,
        subject,
        message,
        sent_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setSubject('');
      setMessage('');
      onOpenChange(false);
    },
  });

  const handleSend = () => {
    messageMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-navy">Contact {partner.business_name}</DialogTitle>
          <DialogDescription>Send a message to the partner</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy uppercase mb-1 block">Subject</label>
            <Input
              placeholder="e.g., Question about discount"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-[var(--border-subtle)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy uppercase mb-1 block">Message</label>
            <textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!subject.trim() || !message.trim() || messageMutation.isPending}
              className="bg-navy hover:bg-navy/90 text-white"
            >
              {messageMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
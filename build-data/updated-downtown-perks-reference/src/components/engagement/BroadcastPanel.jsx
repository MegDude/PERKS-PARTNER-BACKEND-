import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Radio, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const BROADCAST_TYPES = [
  { value: 'perks_announcement', label: 'Perks Announcement' },
  { value: 'community_update', label: 'Community Update' },
  { value: 'event', label: 'Event Notice' },
  { value: 'reminder', label: 'Reminder' },
];

export default function BroadcastPanel() {
  const { buildingId, building } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'perks_announcement'
  });

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['broadcasts', buildingId],
    queryFn: async () => {
      const all = await base44.entities.Broadcast.list('-created_date');
      if (!buildingId) return all;
      return all.filter(b => b.building_id === buildingId);
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants', buildingId],
    queryFn: () => base44.entities.Tenant.list(),
    enabled: !!buildingId,
  });

  const recipientCount = tenants.filter(t => t.perks_enrolled).length;

  const mutation = useQueryClient();
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!buildingId) {
      toast.error('Select a building first');
      return;
    }
    setSending(true);
    try {
      await base44.entities.Broadcast.create({
        ...formData,
        building_id: buildingId,
        delivery_status: 'sent',
        recipients_count: recipientCount,
        type: formData.type,
      });
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      setFormData({ title: '', message: '', type: 'perks_announcement' });
      toast.success('Broadcast sent to all enrolled residents!');
    } catch (err) {
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const typeBadge = {
    perks_announcement: 'bg-gold/15 text-gold',
    community_update: 'bg-blue-100 text-blue-700',
    event: 'bg-green-100 text-green-700',
    reminder: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      {/* Composer */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-gold" />
              Broadcast Message
            </CardTitle>
            {building && (
              <Badge variant="outline" className="text-xs">
                {building.name} · {recipientCount} recipients
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Message Type</Label>
              <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BROADCAST_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., New Partner Venue Announcement"
              />
            </div>

            <div>
              <Label>Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Your broadcast message to all enrolled residents..."
                rows={5}
              />
            </div>

            <Button
              type="submit"
              disabled={sending || !buildingId}
              className="bg-gold text-navy hover:bg-goldSoft w-full sm:w-auto"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to All Enrolled Residents
                </>
              )}
            </Button>
            {!buildingId && (
              <p className="text-xs text-textMuted">Select a building to enable broadcasting.</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Broadcast History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-navy" />
            Broadcast History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-textMuted" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-8 text-textSecondary text-sm">
              <Radio className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No broadcasts sent yet.
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div key={b.id} className="border border-[var(--border-subtle)] rounded-xl p-4 hover:bg-bgAlt/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-navy text-sm truncate">{b.title}</h4>
                      <p className="text-xs text-textMuted mt-0.5">
                        {b.recipients_count || 0} recipients · {b.delivery_status}
                      </p>
                    </div>
                    <Badge className={cn('text-xs shrink-0', typeBadge[b.type] || 'bg-bgAlt text-textSecondary')}>
                      {b.type?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-textSecondary line-clamp-2">{b.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
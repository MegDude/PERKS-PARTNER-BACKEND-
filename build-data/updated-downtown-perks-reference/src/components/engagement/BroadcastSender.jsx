import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BroadcastSender({ building }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'perks_announcement'
  });

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.Broadcast.create({
      ...data,
      building_id: building.id,
      delivery_status: 'sent',
      recipients_count: 0
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      setFormData({ title: '', message: '', type: 'perks_announcement' });
      toast.success('Broadcast sent successfully!');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Broadcast Message</CardTitle>
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
                  <SelectItem value="perks_announcement">Perks Announcement</SelectItem>
                  <SelectItem value="community_update">Community Update</SelectItem>
                  <SelectItem value="event">Event Notice</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
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
                placeholder="Your broadcast message here..."
                rows={5}
              />
            </div>

            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-gold text-navy hover:bg-goldSoft"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to All Residents
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
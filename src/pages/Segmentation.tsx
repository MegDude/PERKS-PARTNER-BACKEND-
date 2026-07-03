import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Users, Zap, TrendingUp, Mail, Loader2 } from 'lucide-react';
import { segmentResidents, getEngagementStats } from '@/utils/engagementSegmentation';
import ResidentProfileModal from '@/components/ResidentProfileModal';
import { toast } from 'sonner';

const segmentGuidance: Record<string, string> = {
  'Power User': 'Highly engaged residents who are ready for early access, premium offers, and ambassador moments.',
  Occasional: 'Residents with some activity who may respond well to clear, nearby reasons to come back.',
  Inactive: 'Residents who need a simple re-entry point, welcome message, or practical neighborhood prompt.'
};

export default function Segmentation() {
  const { buildingId } = useParams();
  const [user, setUser] = useState<any>(null);
  const [selectedResidents, setSelectedResidents] = useState(new Set());
  const [bulkMessageOpen, setBulkMessageOpen] = useState(false);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedSegmentName, setSelectedSegmentName] = useState('');
  const [selectedResident, setSelectedResident] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ['residents', buildingId],
    queryFn: async () => {
        try {
            return await base44.entities.Tenant.list();
        } catch {
            return [];
        }
    }
  });

  const enrichedResidents = (residents as any[]);
  const segments = segmentResidents(enrichedResidents);
  const stats = getEngagementStats(enrichedResidents);

  const isAdmin = user?.role === 'admin';
  const metrics = [
    { label: 'Total residents', value: stats.total, helper: 'Known resident records', Icon: Users },
    { label: 'Power users', value: stats.powerUsers, helper: 'Highest engagement segment', Icon: Zap },
    { label: 'Engagement rate', value: `${stats.engagementRate}%`, helper: 'Power + occasional residents', Icon: TrendingUp },
    { label: 'Inactive', value: stats.inactive, helper: 'Needs a reactivation path', Icon: Mail }
  ];

  const toggleResident = (residentId: string) => {
    const newSelected = new Set(selectedResidents);
    if (newSelected.has(residentId)) {
      newSelected.delete(residentId);
    } else {
      newSelected.add(residentId);
    }
    setSelectedResidents(newSelected);
  };

  const openSegmentMessage = (segmentName: string, segmentResidents: any[]) => {
    setSelectedSegmentName(segmentName);
    setSelectedResidents(new Set(segmentResidents.map((resident) => resident.id)));
    setMessageSubject(`${segmentName} resident update`);
    setMessageBody('');
    setBulkMessageOpen(true);
  };

  const handleSendBulkEmail = async () => {
    const selectedIds = Array.from(selectedResidents);
    const recipients = enrichedResidents.filter((resident) => selectedIds.includes(resident.id));

    if (!messageSubject.trim() || !messageBody.trim()) {
      toast.error('Add a subject and message before sending.');
      return;
    }

    if (recipients.length === 0) {
      toast.error('Select at least one resident.');
      return;
    }

    setIsSending(true);
    try {
      const timestamp = new Date().toISOString();
      const notification = await base44.entities.ManagementNotification.create({
        title: messageSubject.trim(),
        message: messageBody.trim(),
        body: messageBody.trim(),
        category: 'resident_segment',
        channel: 'email',
        status: 'queued',
        segment_name: selectedSegmentName || 'Custom selection',
        recipient_ids: selectedIds,
        recipient_count: recipients.length,
        recipients: recipients.map((resident) => ({ id: resident.id, name: resident.name, email: resident.email })),
        created_by: user?.email || user?.name || 'admin',
        created_at: timestamp,
      });

      await base44.entities.Broadcast.create({
        title: messageSubject.trim(),
        description: messageBody.trim(),
        message: messageBody.trim(),
        delivery_status: 'queued',
        audience: selectedSegmentName || 'Custom selection',
        audience_count: recipients.length,
        building_id: buildingId || 'all',
        channel: 'email',
        created_at: timestamp,
      });

      await base44.entities.TenantAuditLog.create({
        action: 'resident_segment_message_queued',
        entity_type: 'ManagementNotification',
        entity_id: notification.id,
        before: null,
        after: {
          subject: messageSubject.trim(),
          segment_name: selectedSegmentName || 'Custom selection',
          recipient_count: recipients.length,
        },
        actor: user?.email || user?.name || 'admin',
        created_at: timestamp,
      });

      await queryClient.invalidateQueries({ queryKey: ['residents', buildingId] });
      toast.success(`Message queued for ${recipients.length} residents.`);
      setBulkMessageOpen(false);
      setSelectedResidents(new Set());
      setMessageSubject('');
      setMessageBody('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not queue segment message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0B1F33]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 border-b border-[rgba(11,31,51,0.08)] pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C8A96A]">Resident groups</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[#0B1F33] sm:text-3xl">Resident segmentation</h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[rgba(11,31,51,0.68)]">
            Group residents by engagement level, then send practical messages that match how each group actually uses Downtown Perks.
          </p>
        </div>

        {isLoading ? (
          <div className="mb-8 flex items-center gap-3 border border-[rgba(11,31,51,0.08)] bg-white px-5 py-4 text-sm text-[rgba(11,31,51,0.68)]">
            <Loader2 className="h-5 w-5 animate-spin text-[#C8A96A]" />
            Loading resident segments...
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map(({ label, value, helper, Icon }) => (
              <section key={label} className="border border-[rgba(11,31,51,0.08)] bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgba(11,31,51,0.55)]">{label}</p>
                  <Icon className="h-4 w-4 text-[#C8A96A]" />
                </div>
                <div className="text-2xl font-semibold tracking-normal text-[#0B1F33]">{value}</div>
                <p className="mt-1 text-xs leading-5 text-[rgba(11,31,51,0.58)]">{helper}</p>
              </section>
            ))}
          </motion.div>
        )}

        <div className="space-y-5">
          {Object.entries(segments).map(([segmentName, segmentResidents]) => (
            <section key={segmentName} className="border border-[rgba(11,31,51,0.08)] bg-white p-4 shadow-none sm:p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-normal text-[#0B1F33]">{segmentName}</h2>
                  <p className="mt-1 text-sm leading-6 text-[rgba(11,31,51,0.62)]">
                    {(segmentResidents as any[]).length} residents. {segmentGuidance[segmentName] || 'A focused group for targeted resident communication.'}
                  </p>
                </div>
                {isAdmin && (segmentResidents as any[]).length > 0 && (
                  <Button 
                    variant="outline" 
                    className="min-h-11 border-[rgba(11,31,51,0.12)] px-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#0B1F33]"
                    onClick={() => openSegmentMessage(segmentName, segmentResidents as any[])}
                  >
                    <Mail className="mr-2 h-4 w-4 text-[#C8A96A]" /> Message segment
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {(segmentResidents as any[]).map((resident: any) => (
                  <div key={resident.id} className="flex flex-col gap-4 border border-[rgba(11,31,51,0.08)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                     <div className="flex min-w-0 items-center gap-3">
                        {isAdmin && (
                          <Checkbox
                            checked={selectedResidents.has(resident.id)}
                            onCheckedChange={() => toggleResident(resident.id)}
                            aria-label={`Select ${resident.name}`}
                          />
                        )}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[rgba(11,31,51,0.08)] bg-white">
                          <span className="font-semibold text-[#0B1F33]">
                            {resident.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                           <p className="truncate font-semibold text-[#0B1F33]">{resident.name || 'Unnamed resident'}</p>
                           <p className="truncate text-xs font-medium text-[rgba(11,31,51,0.55)]">{resident.email || 'No email on file'}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 sm:justify-end">
                       <Badge className="border-[rgba(11,31,51,0.12)] bg-white text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0B1F33]">
                          {resident.perks_tier || 'Basic'}
                       </Badge>
                       <Button
                         variant="ghost"
                         className="min-h-11 px-3 text-xs font-semibold text-[#0B1F33] hover:bg-[rgba(200,169,106,0.1)]"
                         onClick={() => {
                           setSelectedResident(resident);
                           setProfileModalOpen(true);
                         }}
                       >
                         View
                       </Button>
                     </div>
                  </div>
                ))}
                {(segmentResidents as any[]).length === 0 && (
                  <p className="border border-[rgba(11,31,51,0.08)] bg-white px-4 py-5 text-sm leading-6 text-[rgba(11,31,51,0.58)]">
                    No residents in this segment yet.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

      </div>
      <Dialog open={bulkMessageOpen} onOpenChange={setBulkMessageOpen}>
        <DialogContent className="border-[rgba(11,31,51,0.08)] bg-white text-[#0B1F33]">
          <DialogHeader>
            <DialogTitle>Message {selectedSegmentName || 'selected residents'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-none border border-[rgba(11,31,51,0.08)] bg-white p-4 text-sm text-[rgba(11,31,51,0.68)]">
              {selectedResidents.size} residents selected. This will create a persisted broadcast, management notification, and audit log.
            </div>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgba(11,31,51,0.58)]">Subject</span>
              <input
                value={messageSubject}
                onChange={(event) => setMessageSubject(event.target.value)}
                className="w-full border border-[rgba(11,31,51,0.08)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgba(200,169,106,0.3)]"
                placeholder="Resident update"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgba(11,31,51,0.58)]">Message</span>
              <Textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Write the resident-facing message."
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setBulkMessageOpen(false)} disabled={isSending}>Cancel</Button>
              <Button onClick={handleSendBulkEmail} disabled={isSending} className="gap-2 bg-[#C8A96A] text-[#0B1F33] hover:bg-[#C8A96A]/90">
                {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                Queue message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ResidentProfileModal resident={selectedResident} open={profileModalOpen} onOpenChange={setProfileModalOpen} />
    </div>
  );
}

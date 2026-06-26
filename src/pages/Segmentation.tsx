import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Zap, TrendingUp, Mail, Loader2, Home, Phone, Star
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { segmentResidents, getEngagementStats } from '@/utils/engagementSegmentation';
import ResidentProfileModal from '@/components/ResidentProfileModal';
import { toast } from 'sonner';

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
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10 p-6 bg-white shadow-none border border-[#EFEFEF] rounded-none">
          <h2 className="text-xl font-bold text-[#11182B] mb-2">Resident Segmentation</h2>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Analyze your community by engagement level. Craft targeted communications.
          </p>
        </div>

        {!isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Total Residents
              </div>
              <div className="text-xl font-medium tracking-tight text-[#11182B]">{stats.total}</div>
            </div>
            <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Power Users
              </div>
              <div className="text-xl font-medium tracking-tight text-[#11182B]">{stats.powerUsers}</div>
            </div>
            <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Engagement Rate
              </div>
              <div className="text-xl font-medium tracking-tight text-[#11182B]">{stats.engagementRate}%</div>
            </div>
            <div className="bg-transparent border-t border-b border-[#EFEFEF] py-4 flex flex-col justify-center transition-colors hover:border-[#C5A028]">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Inactive
              </div>
              <div className="text-xl font-medium tracking-tight text-[#11182B]">{stats.inactive}</div>
            </div>
          </motion.div>
        )}

        <div className="space-y-8">
          {Object.entries(segments).map(([segmentName, segmentResidents]) => (
            <div key={segmentName} className="bg-white border border-[#EFEFEF] rounded-none p-6 shadow-none">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#11182B] ">{segmentName}</h3>
                  <p className="text-sm font-medium text-slate-500">{(segmentResidents as any[]).length} residents</p>
                </div>
                {isAdmin && (segmentResidents as any[]).length > 0 && (
                  <Button 
                    variant="outline" 
                    className="text-xs font-bold uppercase tracking-widest"
                    onClick={() => openSegmentMessage(segmentName, segmentResidents as any[])}
                  >
                    <Mail className="w-4 h-4 mr-2" /> Message Segment
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {(segmentResidents as any[]).map((resident: any) => (
                  <div key={resident.id} className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-none">
                     <div className="flex items-center gap-3">
                        {isAdmin && (
                          <Checkbox
                            checked={selectedResidents.has(resident.id)}
                            onCheckedChange={() => toggleResident(resident.id)}
                            aria-label={`Select ${resident.name}`}
                          />
                        )}
                        <div className="w-10 h-10 rounded-none bg-white flex items-center justify-center border border-[#EFEFEF]">
                          <span className="font-bold text-[#11182B] ">
                            {resident.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                           <p className="font-bold text-[#11182B] ">{resident.name}</p>
                           <p className="text-xs font-medium text-slate-500">{resident.email}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <Badge className="bg-[#11182B]/10 text-[#11182B] border-[#11182B]/30 text-[10px] uppercase font-bold tracking-widest">
                          {resident.perks_tier || 'Basic'}
                       </Badge>
                       <Button
                         variant="ghost"
                         className="min-h-11 px-3 text-xs font-semibold text-[#0B1F33]"
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
                  <p className="text-center py-4 text-slate-500 font-medium">No residents in this segment.</p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
      <Dialog open={bulkMessageOpen} onOpenChange={setBulkMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {selectedSegmentName || 'selected residents'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-none border border-[rgba(11,31,51,0.08)] bg-white p-4 text-sm text-[rgba(11,31,51,0.68)]">
              {selectedResidents.size} residents selected. This will create a persisted broadcast, management notification, and audit log.
            </div>
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Subject</span>
              <input
                value={messageSubject}
                onChange={(event) => setMessageSubject(event.target.value)}
                className="w-full border border-[#EFEFEF] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#11182B]/15"
                placeholder="Resident update"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Message</span>
              <Textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Write the resident-facing message."
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setBulkMessageOpen(false)} disabled={isSending}>Cancel</Button>
              <Button onClick={handleSendBulkEmail} disabled={isSending} className="gap-2 text-[#0B1F33]">
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

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Megaphone, Search, Filter, MessageSquare, Calendar, Zap, X, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function EngagementHub() {
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'All Residents',
    channel: 'In-App Push',
  });
  const queryClient = useQueryClient();

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['engagement-broadcasts'],
    queryFn: () => base44.entities.Broadcast.list().catch(() => []),
  });

  const createBroadcast = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.message.trim()) {
        throw new Error('Add a subject and message before sending.');
      }
      const timestamp = new Date().toISOString();
      const created = await base44.entities.Broadcast.create({
        title: form.title.trim(),
        description: form.message.trim(),
        message: form.message.trim(),
        delivery_status: 'queued',
        audience: form.audience,
        channel: form.channel,
        category: form.channel.toLowerCase().includes('push') ? 'push' : 'email',
        engagement: 'Awaiting engagement',
        created_at: timestamp,
      });
      await base44.entities.TenantAuditLog.create({
        action: 'broadcast.queued',
        entity_type: 'Broadcast',
        entity_id: created.id,
        before: null,
        after: {
          title: form.title.trim(),
          audience: form.audience,
          channel: form.channel,
        },
        actor: 'admin',
        created_at: timestamp,
      });
      return created;
    },
    onSuccess: () => {
      toast.success('Broadcast queued for residents.', {
        style: { borderRadius: '0px', backgroundColor: '#11182B', color: '#fff', border: 'none' }
      });
      queryClient.invalidateQueries({ queryKey: ['engagement-broadcasts'] });
      setForm({ title: '', message: '', audience: 'All Residents', channel: 'In-App Push' });
      setShowBroadcastModal(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not queue broadcast.');
    },
  });

  const decorateBroadcast = (broadcast: any) => {
    const status = String(broadcast.delivery_status || broadcast.status || '').toLowerCase();
    const type = broadcast.type || broadcast.category || (status === 'queued' ? 'Queued' : 'Announcement');
    const icon =
      type.toLowerCase().includes('event') ? <Calendar className="w-5 h-5 text-[#11182B] " /> :
      type.toLowerCase().includes('alert') ? <MessageSquare className="w-5 h-5 text-[#11182B] " /> :
      <Megaphone className="w-5 h-5 text-[#11182B] " />;
    const createdAt = broadcast.created_at || broadcast.date;
    const date = status === 'queued'
      ? 'Queued'
      : createdAt
        ? `Sent • ${new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : 'Scheduled';
    return {
      ...broadcast,
      type,
      icon,
      date,
      engagement: broadcast.engagement || `${broadcast.audience_count || 0} recipients`,
      color: 'bg-slate-50 border-[#EFEFEF]',
    };
  };

  const filteredBroadcasts = (broadcasts as any[])
    .map(decorateBroadcast)
    .filter(b => String(b.title || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-[#11182B] tracking-tight">Notes to send</h1>
          <p className="text-slate-500 font-medium mt-1">Write to residents, share events, and keep building messages moving.</p>
        </div>
        <Button onClick={() => setShowBroadcastModal(true)} className="px-5 py-2.5 bg-[#11182B] text-white rounded-none font-bold text-xs uppercase hover:bg-white hover:text-[#11182B] border border-[#11182B] transition-colors flex items-center gap-2">
          <Zap className="w-4 h-4" /> New note
        </Button>
      </div>

      <div className="bg-white border border-[#EFEFEF] rounded-none overflow-hidden shadow-none">
         <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
            <div className="flex-1 relative">
               <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
               <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..." 
                  className="w-full pl-9 pr-4 py-2 rounded-none border border-[#EFEFEF] text-sm focus:outline-none focus:ring-2 focus:ring-[#11182B]" 
               />
            </div>
            <Button
              className="px-4 py-2 bg-white border border-[#EFEFEF] rounded-none text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-white hover:text-[#11182B] transition-colors"
              onClick={() => {
                setSearchQuery('');
                toast.info('Showing all broadcast activity.');
              }}
            >
               <Filter className="w-4 h-4" /> Filter
            </Button>
         </div>
         
         <div className="divide-y divide-slate-100">
            {isLoading && (
              <div className="p-6 text-sm font-medium text-slate-500">Loading broadcast activity...</div>
            )}
            {!isLoading && filteredBroadcasts.map(b => (
              <div key={b.id} className="p-6 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                 <div className={`w-12 h-12 rounded-none border flex items-center justify-center shrink-0 ${b.color}`}>
                   {b.icon}
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                       <h3 className="font-bold text-[#11182B] text-lg">{b.title}</h3>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{b.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-[#11182B] uppercase tracking-widest rounded-none">{b.type}</span>
                       <span className="text-sm font-medium text-slate-500">{b.engagement}</span>
                    </div>
                 </div>
              </div>
            ))}
            {!isLoading && filteredBroadcasts.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-bold text-[#11182B]">No broadcasts found</p>
                <p className="mt-2 text-sm font-medium text-slate-500">Create a resident update or clear the search filter.</p>
              </div>
            )}
         </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-[#11182B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none w-full max-w-2xl overflow-hidden shadow-none flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#11182B] text-white">
               <h2 className="text-lg font-bold">New Broadcast</h2>
               <Button variant="ghost" onClick={() => setShowBroadcastModal(false)} className="text-white bg-transparent hover:text-white hover:bg-white/10 p-2"><X className="w-5 h-5" /></Button>
            </div>
            <div className="p-8 space-y-6">
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Subject</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className="w-full border border-[#EFEFEF] rounded-none px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#11182B]"
                    placeholder="Resident rooftop reminder"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Message</label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    className="w-full border border-[#EFEFEF] rounded-none px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#11182B]"
                    placeholder="Write the resident-facing message exactly as it should be sent."
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Audience Segment</label>
                    <select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value })} className="w-full border border-[#EFEFEF] rounded-none px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#11182B] bg-white">
                       <option>All Residents</option>
                       <option>Premium Tier</option>
                       <option>Inactive Residents</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Delivery Method</label>
                    <select value={form.channel} onChange={(event) => setForm({ ...form, channel: event.target.value })} className="w-full border border-[#EFEFEF] rounded-none px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-[#11182B] bg-white">
                       <option>In-App Push</option>
                       <option>Email Only</option>
                       <option>Push + Email</option>
                    </select>
                  </div>
               </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
               <Button variant="ghost" onClick={() => setShowBroadcastModal(false)} className="px-6 py-2.5 rounded-none text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</Button>
               <Button onClick={() => createBroadcast.mutate()} disabled={createBroadcast.isPending} className="px-8 py-2.5 rounded-none text-[10px] uppercase tracking-widest font-bold bg-[#11182B] text-white hover:bg-[#1a243d] transition-colors shadow-none flex items-center gap-2">
                 {createBroadcast.isPending ? 'Queueing...' : 'Send Broadcast'} <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

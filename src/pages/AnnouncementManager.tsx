import React, { useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Bell, Plus, Edit, Trash2, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnouncementManager() {
  const { buildingId: ctxBuildingId } = useOutletContext<any>() || {};
  const { buildingId: paramBuildingId } = useParams();
  const buildingId = ctxBuildingId || paramBuildingId;
  
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general'
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', buildingId],
    queryFn: async () => {
      const all: any[] = await base44.entities.Announcement.list();
      return all.filter((a: any) => a.building_id === buildingId);
    },
    enabled: !!buildingId
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => base44.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', buildingId] });
      setShowForm(false);
      resetForm();
      toast.success('Announcement created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => base44.entities.Announcement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', buildingId] });
      setShowForm(false);
      setEditingAnnouncement(null);
      toast.success('Announcement updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', buildingId] });
      setDeleteConfirm(null);
      toast.success('Announcement deleted');
    }
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', category: 'general' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildingId) return;

    if (editingAnnouncement) {
      updateMutation.mutate({
        id: editingAnnouncement.id,
        data: {
          title: formData.title,
          description: formData.description,
          category: formData.category
        }
      });
    } else {
      createMutation.mutate({
        building_id: buildingId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  if (!buildingId) {
    return (
      <div className="text-center p-12 text-slate-500 font-medium">Please select a building to manage announcements.</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[#11182B]">Building Announcements</h2>
          <p className="text-sm text-slate-500 font-medium">Broadcast messages to residents</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-[#11182B] text-white hover:bg-[#1a243d]">
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#11182B]" />
        </div>
      ) : announcements.length === 0 ? (
        <Card className="   ">
          <CardContent className="pt-2">
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#11182B] mb-2">No Announcements</h3>
              <p className="text-slate-500 font-medium mb-4">You haven't posted any announcements for this building yet.</p>
              <Button onClick={() => { resetForm(); setShowForm(true); }} variant="outline" className="border-[#11182B] text-[#11182B] hover:bg-slate-50 font-bold uppercase tracking-widest text-xs">
                Create First Announcement
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(announcements as any[]).map((ann, idx) => (
            <motion.div key={ann.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className=" hover: transition- -4 -[#11182B]  -slate-200 -slate-200">
                <CardContent className="pt-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded">
                          {ann.category}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ann.date}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#11182B] mb-2">{ann.title}</h3>
                      <p className="text-sm font-medium text-slate-600">{ann.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingAnnouncement(ann);
                        setFormData({ title: ann.title, description: ann.description, category: ann.category });
                        setShowForm(true);
                      }}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(ann)} className="text-rose-500 hover:text-rose-600 border-[#EFEFEF] bg-white">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Rooftop hours update" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                className="w-full px-3 py-2 border rounded-none"
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="general">General</option>
                <option value="maintenance">Maintenance</option>
                <option value="event">Event</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea 
                required
                className="w-full px-3 py-2 border rounded-none min-h-[100px]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Write the resident-facing announcement clearly, including timing, location, and any action residents need to take."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-[#11182B] text-white hover:bg-navySoft">
                {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingAnnouncement ? 'Save Changes' : 'Post Announcement'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement?</DialogTitle>
          </DialogHeader>
          <p>Are you sure? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(deleteConfirm.id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

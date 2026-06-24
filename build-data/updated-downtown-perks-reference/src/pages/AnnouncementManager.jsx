import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Loader2, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import EditorialHero from '@/components/editorial/EditorialHero';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AnnouncementManager() {
  const { buildingId } = useParams();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: announcements = [], isLoading, refetch } = useQuery({
    queryKey: ['announcements', buildingId],
    queryFn: () => buildingId 
      ? base44.entities.Announcement.filter({ building_id: buildingId }, '-created_date', 100)
      : base44.entities.Announcement.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create({ ...data, building_id: buildingId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements', buildingId]);
      setShowForm(false);
      setEditingAnnouncement(null);
      toast.success('Announcement created');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements', buildingId]);
      setShowForm(false);
      setEditingAnnouncement(null);
      toast.success('Announcement updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements', buildingId]);
      setDeleteConfirm(null);
      toast.success('Announcement deleted');
    }
  });

  const notifyMutation = useMutation({
    mutationFn: (id) => base44.functions.invoke('sendAnnouncementNotification', { announcementId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements', buildingId]);
      toast.success('Push notification sent to residents');
    }
  });

  const handleSave = (formData) => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, status: 'published', published_at: new Date().toISOString() });
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedCount = announcements.filter(a => a.status === 'published').length;
  const notificationSentCount = announcements.filter(a => a.notification_sent).length;
  const totalViews = announcements.reduce((sum, a) => sum + (a.read_count || 0), 0);

  return (
    <div className="min-h-screen bg-bgMain">
      {/* Editorial Hero */}
      <EditorialHero
        eyebrow="Announcements"
        headline="Keep residents informed."
        support="Manage urgent updates, maintenance notices, and community news."
      >
        <Button
          onClick={() => {
            setEditingAnnouncement(null);
            setShowForm(true);
          }}
          className="bg-navy hover:bg-navySoft text-white font-semibold gap-2"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </EditorialHero>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-[var(--border-subtle)] p-4">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1">Total</p>
            <p className="text-2xl font-bold text-navy">{announcements.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border-subtle)] p-4">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1">Published</p>
            <p className="text-2xl font-bold text-gold">{publishedCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border-subtle)] p-4">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1">Notified</p>
            <p className="text-2xl font-bold text-navy">{notificationSentCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border-subtle)] p-4">
            <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-1">Views</p>
            <p className="text-2xl font-bold text-navy">{totalViews}</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
            <Input
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-textMuted" />
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <p className="text-textMuted">No announcements yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <div key={announcement.id} className="group relative">
                <AnnouncementCard
                  announcement={announcement}
                  isManager={true}
                  onEdit={handleEdit}
                  onDelete={() => setDeleteConfirm(announcement)}
                />
                {announcement.status === 'published' && !announcement.notification_sent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity gap-2"
                    onClick={() => notifyMutation.mutate(announcement.id)}
                    disabled={notifyMutation.isPending}
                  >
                    <Send className="w-3 h-3" />
                    Notify
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Forms & Dialogs */}
      {showForm && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          onSubmit={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingAnnouncement(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will remove "{deleteConfirm?.title}" from all resident feeds.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => handleDelete(deleteConfirm.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
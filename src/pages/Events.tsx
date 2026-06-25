import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { H1, Body } from '@/components/ui/Typography';
import { Calendar, MapPin, Users, Clock, Sparkles, Zap, Gift, Home as HomeIcon, Loader2 } from 'lucide-react';
import { getBuildingEvents } from '@/utils/dataLayer';
import { toast } from 'sonner';

const CATEGORY_COLORS: Record<string, string> = {
  community: 'bg-slate-100 text-[#11182B] ',
  social: 'bg-slate-100 text-[#11182B] ',
  networking: 'bg-[#11182B]/10 text-[#11182B] ',
  wellness: 'bg-[#11182B]/10 text-[#11182B] ',
  entertainment: 'bg-[#11182B]/10 text-[#11182B] ',
  dining: 'bg-[#11182B]/10 text-[#11182B] '
};

export default function Events() {
  const { buildingId } = useOutletContext<any>() || { buildingId: null };
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<any>(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['building-events', buildingId],
    queryFn: () => getBuildingEvents(buildingId),
  });

  const categories = [...new Set(events.map(e => e.category || 'community'))].sort();
  const filteredEvents = selectedCategory
    ? events.filter(e => e.category === selectedCategory)
    : events;

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <H1 className="text-4xl font-bold text-[#11182B] mb-2">Events OS</H1>
          <Body className="text-lg text-slate-500 font-medium">Publish building events, track RSVP demand, and turn attendance into resident engagement signals.</Body>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? 'bg-[#11182B] text-white rounded-none px-4 py-2 border border-[#11182B] text-[10px] uppercase tracking-widest font-bold' : 'bg-transparent text-[#11182B] border border-[#EFEFEF] hover:border-[#11182B] rounded-none px-4 py-2 text-[10px] uppercase tracking-widest font-bold'}
              >
                All Events
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? 'bg-[#11182B] text-white rounded-none px-4 py-2 border border-[#11182B] text-[10px] uppercase tracking-widest font-bold' : 'bg-transparent text-[#11182B] border border-[#EFEFEF] hover:border-[#11182B] rounded-none px-4 py-2 text-[10px] uppercase tracking-widest font-bold'}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredEvents.map((event: any) => (
                <Card 
                  key={event.id} 
                  onClick={() => navigate(`/admin/events/${event.id}`)} 
                  className="hover:shadow-none cursor-pointer transition-shadow overflow-hidden border-[#EFEFEF] bg-white"
                >
                  <div className="w-full h-40 bg-white overflow-hidden border-b border-[#EFEFEF]">
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-[#C8A96A]" />
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-[#11182B] mb-2">{event.title}</CardTitle>
                        <Badge className={`${CATEGORY_COLORS[event.category || 'community']}`}>
                          {event.category || 'community'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-500 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm font-medium">
                      {event.date && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-4 h-4 text-[#11182B] " />
                          <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-[#11182B] " />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <Button 
                        className="w-full bg-[#11182B] text-white hover:bg-[#11182B]/90 font-bold"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModal(event);
                        }}
                      >
                        Share with residents
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <Card className="text-center py-12  ">
                <CardContent>
                  <p className="text-slate-500 font-medium mb-4">No events scheduled yet</p>
                  <Button variant="outline" onClick={() => setSelectedCategory(null)} className="font-bold">
                    See all events
                  </Button>
                </CardContent>
              </Card>
            )}

            {shareModal && (
              <div className="fixed inset-0 bg-[#11182B]/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[#11182B] font-bold">Share Event with Residents</CardTitle>
                      <Button variant="ghost" onClick={() => setShareModal(null)} className="text-slate-400 hover:text-[#11182B] ">✕</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    <div className="bg-slate-50 p-4 rounded-none border border-[#EFEFEF]">
                      <h3 className="font-bold text-[#11182B] mb-2">{shareModal.title}</h3>
                      <p className="text-sm text-slate-600 font-medium">{shareModal.description}</p>
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button
                        className="flex-1 bg-[#11182B] text-white hover:bg-[#11182B]/90 font-bold"
                        onClick={() => {
                          toast.success('Event sharing workflow queued for residents.');
                          setShareModal(null);
                        }}
                      >
                        Queue resident share
                      </Button>
                      <Button variant="outline" className="flex-1 font-bold" onClick={() => setShareModal(null)}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

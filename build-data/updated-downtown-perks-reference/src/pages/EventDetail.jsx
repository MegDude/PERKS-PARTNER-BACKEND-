import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, ArrowLeft, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import EventsMap from '@/components/EventsMap';

const DEMO_EVENTS = [
  { id: 'e1', title: 'Rooftop Sunset Social', category: 'social', date: '2026-06-25', time: '6:00 PM', location: 'Rooftop Terrace', capacity: 40, registered_count: 28, description: 'Unwind with neighbors and enjoy panoramic city views. Light bites and craft cocktails provided.', image_url: 'https://images.unsplash.com/photo-1533149158935-457004ba3a36?w=800&h=600&fit=crop', lat: 30.2632, lng: -97.7401 },
  { id: 'e2', title: 'Downtown Art Walk', category: 'community', date: '2026-06-28', time: '7:00 PM', location: 'Congress Ave Galleries', capacity: 20, registered_count: 14, description: 'Guided tour of Austin\'s most celebrated galleries with exclusive resident access.', image_url: 'https://images.unsplash.com/photo-1531913764164-f85c52e6e65f?w=800&h=600&fit=crop', lat: 30.2701, lng: -97.7444 },
  { id: 'e3', title: 'Morning Yoga on the Lawn', category: 'wellness', date: '2026-06-30', time: '7:30 AM', location: 'Building Courtyard', capacity: 15, registered_count: 9, description: 'Start your Thursday with an energizing flow session led by a certified instructor.', image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop', lat: 30.2672, lng: -97.7431 },
  { id: 'e4', title: 'Neighbors & Negronis', category: 'social', date: '2026-07-02', time: '7:00 PM', location: 'Banger\'s Sausage & Beer', capacity: 50, registered_count: 37, description: 'Monthly residents-only happy hour at our featured Downtown Perks partner.', image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&h=600&fit=crop', lat: 30.2621, lng: -97.7395 },
  { id: 'e5', title: 'Food & Wine Pairing', category: 'dining', date: '2026-07-07', time: '7:30 PM', location: 'Uchi Austin', capacity: 12, registered_count: 10, description: 'An intimate five-course dining experience curated for Shore residents.', image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', lat: 30.2505, lng: -97.7701 },
  { id: 'e6', title: 'Tech Networking Mixer', category: 'networking', date: '2026-07-10', time: '6:30 PM', location: 'Co-working Lounge, Floor 3', capacity: 30, registered_count: 12, description: 'Meet fellow residents working in tech and startups.', image_url: 'https://images.unsplash.com/photo-1515187029135-18ee286d813b?w=800&h=600&fit=crop', lat: 30.2672, lng: -97.7431 },
];

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { buildingId, building } = useOutletContext() || {};
  const queryClient = useQueryClient();
  const [rsvpStatus, setRsvpStatus] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Try to load event from DB; fall back to demo
  const { data: dbEvent, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      try {
        return await base44.entities.Event.get(eventId);
      } catch {
        return null;
      }
    },
  });

  const demoEvent = DEMO_EVENTS.find(e => e.id === eventId);
  const event = dbEvent || demoEvent || null;

  // Check RSVP status
  const { data: rsvps = [] } = useQuery({
    queryKey: ['event_rsvps', eventId],
    queryFn: async () => {
      const all = await base44.entities.EventRSVP.list();
      return all.filter(r => r.event_id === eventId);
    },
    enabled: !!eventId,
  });

  useEffect(() => {
    if (currentUser && rsvps.length > 0) {
      const myRsvp = rsvps.find(r => r.tenant_id || r.registered_by === currentUser.id);
      setRsvpStatus(!!myRsvp);
    }
  }, [rsvps, currentUser]);

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (rsvpStatus) {
        // Cancel — find and delete the user's RSVP
        const myRsvp = rsvps.find(r => r.tenant_id || r.registered_by === currentUser?.id);
        if (myRsvp) {
          await base44.entities.EventRSVP.delete(myRsvp.id);
        }
        // Decrement count on event
        if (dbEvent && dbEvent.registered_count > 0) {
          await base44.entities.Event.update(eventId, { registered_count: dbEvent.registered_count - 1 });
        }
      } else {
        // RSVP
        await base44.entities.EventRSVP.create({
          event_id: eventId,
          event_name: event?.title || '',
          event_date: event?.date || '',
          registered_at: new Date().toISOString(),
        });
        // Increment count on event
        if (dbEvent) {
          await base44.entities.Event.update(eventId, {
            registered_count: (dbEvent.registered_count || 0) + 1,
          });
        }
      }
    },
    onSuccess: () => {
      setRsvpStatus(!rsvpStatus);
      queryClient.invalidateQueries(['event_rsvps', eventId]);
      queryClient.invalidateQueries(['event', eventId]);
      queryClient.invalidateQueries(['events']);
      toast.success(rsvpStatus ? 'RSVP cancelled' : "You're going!");
    },
    onError: (error) => {
      toast.error('Failed to update RSVP: ' + (error.message || ''));
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgMain">
        <Loader2 className="w-8 h-8 animate-spin text-textMuted" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-bgMain p-6 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <Calendar className="w-12 h-12 text-textMuted/40 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-navy mb-2">Event not found</h2>
          <Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  const spotsLeft = Math.max(0, (event.capacity || 0) - (event.registered_count || 0));
  const eventsForMap = [event];

  return (
    <div className="min-h-screen bg-bgMain">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-navy">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        {/* Hero image */}
        <div className="rounded-2xl overflow-hidden mb-6 shadow-soft">
          <div className="h-64 sm:h-80 relative">
            {event.image_url ? (
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-navy to-navySoft" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {format(new Date(event.date + 'T12:00:00'), 'EEEE, MMMM dd, yyyy')}</span>
                {event.time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {event.time}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Details */}
            <div className="bg-white rounded-2xl p-6 border border-[var(--border-subtle)] shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {event.location && (
                      <span className="flex items-center gap-1.5 text-sm text-textSecondary">
                        <MapPin className="w-4 h-4 text-gold" /> {event.location}
                      </span>
                    )}
                  </div>
                  {event.capacity > 0 && (
                    <span className="flex items-center gap-1.5 text-sm text-textSecondary">
                      <Users className="w-4 h-4 text-gold" /> {event.registered_count || 0}/{event.capacity} attending · {spotsLeft} spots left
                    </span>
                  )}
                </div>
              </div>

              {event.description && (
                <div>
                  <h3 className="font-bold text-navy mb-2">About this event</h3>
                  <p className="text-textSecondary leading-relaxed">{event.description}</p>
                </div>
              )}
            </div>

            {/* Map */}
            {event.lat != null && event.lng != null && (
              <div className="bg-white rounded-2xl p-4 border border-[var(--border-subtle)] shadow-soft">
                <h3 className="font-bold text-navy mb-3 px-2">Location</h3>
                <div className="h-64">
                  <EventsMap
                    events={eventsForMap}
                    selectedEvent={event}
                    onEventSelect={() => {}}
                    building={building || { lat: event.lat, lng: event.lng }}
                  />
                </div>
                {event.address && (
                  <p className="text-sm text-textMuted mt-3 px-2">{event.address}</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar — RSVP */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-[var(--border-subtle)] shadow-soft sticky top-6">
              <h3 className="font-bold text-navy mb-3">Reserve Your Spot</h3>
              {event.capacity > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-textMuted">{event.registered_count || 0} registered</span>
                    <span className="font-semibold text-navy">{spotsLeft} left</span>
                  </div>
                  <div className="h-2 bg-bgAlt rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold rounded-full transition-all"
                      style={{ width: `${Math.round(((event.registered_count || 0) / event.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={() => rsvpMutation.mutate()}
                disabled={rsvpMutation.isPending}
                className={`w-full py-3 ${rsvpStatus ? 'bg-green-600 hover:bg-green-700' : 'bg-navy hover:bg-navySoft'} text-white`}
              >
                {rsvpMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : rsvpStatus ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : null}
                {rsvpStatus ? "You're Going" : 'RSVP Now'}
              </Button>

              {spotsLeft <= 5 && spotsLeft > 0 && !rsvpStatus && (
                <p className="text-xs text-orange-600 font-medium mt-2 text-center">
                  Only {spotsLeft} spots remaining!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
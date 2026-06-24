import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Calendar, MapPin, Users, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';

const eventsData = [
{ id: 1, name: 'Rooftop Yoga', date: '2026-04-20', time: '09:00', location: 'Rooftop Garden', capacity: 30, description: 'Start your morning with sunrise yoga on our beautiful rooftop.', image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500&h=500&fit=crop' },
{ id: 2, name: 'Residents Social Hour', date: '2026-04-25', time: '17:00', location: 'Lounge Area', capacity: 50, description: 'Meet your neighbors at our monthly social hour with complimentary drinks and appetizers.', image: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=500&h=500&fit=crop' }
];

export default function EventDetail() {
const { eventId } = useParams();
const navigate = useNavigate();
const [event, setEvent] = useState<any>(null);
const [tenant, setTenant] = useState<any>(null);
const [rsvpStatus, setRsvpStatus] = useState(false);
const [loading, setLoading] = useState(true);

useEffect(() => {
loadData();
}, [eventId]);

const loadData = async () => {
try {
const foundEvent = eventsData.find((e: any) => e.id === parseInt(eventId || ""));
setEvent(foundEvent);
const currentUser = await base44.auth.me();
  const tenants = await base44.entities.Tenant.filter({ });
  if (tenants.length > 0) {
    setTenant(tenants[0]);

    const rsvps = await base44.entities.EventRSVP.filter({
      tenant_id: tenants[0].id,
      event_id: eventId
    });
    setRsvpStatus(rsvps.length > 0);
  }
} catch (error) {
  console.error('Error loading data:', error);
} finally {
  setLoading(false);
}
};

const handleRSVP = async () => {
if (!tenant || !event) return;
  setRsvpStatus(!rsvpStatus);
};

if (loading) {
return (
<div className="p-6 flex items-center justify-center">
<div className="w-8 h-8 border-4 border-[#EFEFEF] border-t-navy rounded-none animate-spin"></div>
</div>
);
}

if (!event) {
return (
<div className="min-h-screen bg-bgMain p-6 flex items-center justify-center">
<Card>
<CardContent className="p-8 text-center">
<p className="text-textMuted">Event not found</p>
<Button onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
</CardContent>
</Card>
</div>
);
}

return (
<div className="min-h-screen bg-bgMain p-6">
<div className="max-w-2xl mx-auto">
<Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
<ArrowLeft className="w-4 h-4 mr-2" />
Back
</Button>
<Card>
      <img src={event.image} alt={event.name} className="w-full h-64 object-cover" />
      
      <CardHeader>
        <CardTitle className="text-3xl mb-4">{event.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Event Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[#11182B]">
            <Calendar className="w-5 h-5 text-[#11182B]" />
            <span className="font-medium">{format(new Date(event.date), 'EEEE, MMMM dd, yyyy')} at {event.time}</span>
          </div>
          <div className="flex items-center gap-3 text-[#11182B]">
            <MapPin className="w-5 h-5 text-[#11182B]" />
            <span className="font-medium">{event.location}</span>
          </div>
          <div className="flex items-center gap-3 text-[#11182B]">
            <Users className="w-5 h-5 text-[#11182B]" />
            <span className="font-medium">Capacity: {event.capacity}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-bold text-[#11182B] mb-3">About this event</h3>
          <p className="text-textSecondary">{event.description}</p>
        </div>

        {/* RSVP Button */}
        <Button 
          variant={rsvpStatus ? 'outline' : 'primary'}
          onClick={handleRSVP}
          className="w-full"
        >
          {rsvpStatus ? '✓ You\'re Going' : 'RSVP Now'}
        </Button>
      </CardContent>
    </Card>
  </div>
</div>
);
}

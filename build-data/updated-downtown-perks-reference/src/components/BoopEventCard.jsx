import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BoopEventCard({ event, index }) {
  const [booked, setBooked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all"
    >
      {/* Event Header with Gradient */}
      <div className="h-32 bg-gradient-to-br from-secondary to-secondary/70 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-2 right-2 w-20 h-20 bg-primary/20 rounded-full" />
        </div>
        <div className="relative h-full flex items-end p-4">
          <div>
            <div className="inline-block bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold mb-2">
              🎉 Live Event
            </div>
            <h3 className="text-lg font-bold text-foreground">{event.title}</h3>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-4 space-y-3">
        {/* Time & Date */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-secondary" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <span>{event.time}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{event.venue}</p>
            <p className="text-xs">{event.address}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/80">{event.description}</p>

        {/* Availability */}
        <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/10 rounded-lg p-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-primary font-medium">{event.spotsLeft} spots left</span>
        </div>

        {/* Booking Button */}
        <Button
          onClick={() => setBooked(!booked)}
          className={`w-full transition-all ${
            booked
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-secondary hover:bg-secondary/90 text-white'
          }`}
        >
          <Zap className="w-4 h-4 mr-2" />
          {booked ? '✓ You\'re In!' : 'Book Now'}
        </Button>
      </div>

      {/* Tags */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        {event.tags.map(tag => (
          <span
            key={tag}
            className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
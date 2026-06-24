import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BoopEventCard from './BoopEventCard';

// Mock events data - replace with real API when ready
const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Rooftop Yoga & Brunch',
    date: 'Sat, Apr 19',
    time: '10:00 AM',
    venue: 'The Independent (Rooftop)',
    address: '301 West Ave, Austin',
    description: 'Join us for a morning yoga session followed by brunch with exclusive resident pricing.',
    spotsLeft: 8,
    tags: ['Wellness', 'Social', 'Dining'],
    building: 'the-independent'
  },
  {
    id: 2,
    title: 'Rainey Street Crawl',
    date: 'Fri, Apr 18',
    time: '7:00 PM',
    venue: 'Starting at Lustre Pearl',
    address: '440 Rainey St, Austin',
    description: 'Guided tour of Rainey Street bars with resident discounts at each stop. VIP entry included.',
    spotsLeft: 5,
    tags: ['Nightlife', 'Social', 'Dining'],
    building: 'milago'
  },
  {
    id: 3,
    title: 'Downtown Coffee Meetup',
    date: 'Tue, Apr 15',
    time: '8:30 AM',
    venue: 'True Food Kitchen',
    address: 'Seaholm District',
    description: 'Weekly resident coffee meetup. Meet your neighbors and get exclusive café discounts.',
    spotsLeft: 12,
    tags: ['Social', 'Community', 'Dining'],
    building: 'seaholm-residences'
  },
  {
    id: 4,
    title: 'Spring Market Pop-Up',
    date: 'Sat, Apr 19',
    time: '11:00 AM',
    venue: 'Republic Square Park',
    address: 'Republic Square District',
    description: 'Local vendors, artisan goods, and resident-exclusive shopping discounts.',
    spotsLeft: 15,
    tags: ['Shopping', 'Community', 'Entertainment'],
    building: 'hanover-republic-square'
  }
];

export default function BoopEventsPanel({ isOpen, onClose, buildingLocation = null }) {
  const [expandedEvent, setExpandedEvent] = useState(null);

  // Filter events by nearby building if location provided
  const displayEvents = buildingLocation
    ? MOCK_EVENTS.filter(e => e.building === buildingLocation)
    : MOCK_EVENTS;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-background border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-foreground">Boop Events</h2>
                <p className="text-sm text-muted-foreground">Live events near you</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto">
              {displayEvents.length > 0 ? (
                <div className="p-4 space-y-4">
                  {displayEvents.map((event, idx) => (
                    <div key={event.id}>
                      <BoopEventCard event={event} index={idx} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-center text-muted-foreground px-4">
                  <p>No upcoming events near this location. Check back soon!</p>
                </div>
              )}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center mb-3">
                Events curated for downtown residents
              </p>
              <Button variant="outline" className="w-full text-sm">
                View All Events
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
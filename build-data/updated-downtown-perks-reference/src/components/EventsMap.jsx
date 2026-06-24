import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';

// Event-specific marker icon (gold with calendar icon)
const createEventIcon = (category) => {
  const categoryColors = {
    social: '#EC4899',
    community: '#3B82F6',
    wellness: '#10B981',
    dining: '#F97316',
    networking: '#6366F1',
    entertainment: '#F59E0B',
  };
  const color = categoryColors[category] || '#C9A227';

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.25);
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
    `,
    className: 'leaflet-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// Recenter map when building changes
function RecenterMap({ center }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, 15);
  }, [center[0], center[1]]);
  return null;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function EventsMap({ events, selectedEvent, onEventSelect, building }) {
  const eventsWithCoords = events.filter(e => e.lat != null && e.lng != null);

  if (!building || eventsWithCoords.length === 0) {
    return (
      <div className="w-full h-full bg-bgAlt rounded-xl flex items-center justify-center text-textMuted min-h-[300px]">
        <div className="text-center">
          <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            {events.length === 0
              ? 'No events to display'
              : 'No events have map coordinates yet'}
          </p>
        </div>
      </div>
    );
  }

  const center = [building.lat || 30.2672, building.lng || -97.7431];

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ width: '100%', height: '100%', borderRadius: '12px' }}
      className="rounded-xl shadow-soft border border-[var(--border-subtle)]"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      <RecenterMap center={center} />

      {eventsWithCoords.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={createEventIcon(event.category)}
          eventHandlers={{
            click: () => onEventSelect(event),
          }}
        >
          <Popup>
            <div className="max-w-[220px]">
              <h4 className="font-semibold text-navy text-sm mb-1">{event.title}</h4>
              <p className="text-xs text-textMuted mb-2">{event.category}</p>

              <div className="space-y-1 mb-2">
                <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                  <Calendar className="w-3 h-3 shrink-0 text-gold" />
                  {formatDate(event.date)}{event.time ? ` · ${event.time}` : ''}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                  <MapPin className="w-3 h-3 shrink-0 text-gold" />
                  {event.location}
                </div>
                {event.capacity > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-textSecondary">
                    <Users className="w-3 h-3 shrink-0 text-gold" />
                    {event.registered_count || 0}/{event.capacity} attending
                  </div>
                )}
              </div>

              {event.description && (
                <p className="text-xs text-textMuted line-clamp-2 mb-2">{event.description}</p>
              )}

              <button
                onClick={() => onEventSelect(event)}
                className="w-full text-xs font-semibold text-white bg-navy hover:bg-navySoft px-3 py-1.5 rounded-lg transition-colors"
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Phone, Globe, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom icon for markers
const createIcon = (category, isInactive) => {
  const colors = {
    bar_nightlife: '#0B1F33',
    coffee: '#CFAF5A',
    restaurant: '#0B1F33',
    fitness: '#CFAF5A',
    shopping: '#0B1F33',
  };
  const color = isInactive ? '#B8C7D6' : (colors[category] || '#0B1F33');

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ${isInactive ? 'opacity:0.45;' : ''}
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        </svg>
      </div>
    `,
    className: 'leaflet-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function PerkMap({ locations, selectedLocation, onLocationSelect, building }) {
  const [hideInactive, setHideInactive] = useState(false);

  if (!building || locations.length === 0) {
    return (
      <div className="w-full h-full bg-bgAlt rounded-xl flex items-center justify-center text-textMuted">
        <MapPin className="w-6 h-6 mr-2" />
        No venues to display on map
      </div>
    );
  }

  const filteredLocations = hideInactive
    ? locations.filter(l => l.is_active !== false)
    : locations;

  // Calculate center point from building coordinates
  const center = [building.lat || 30.2672, building.lng || -97.7431];

  const inactiveCount = locations.filter(l => l.is_active === false).length;

  return (
    <div className="relative w-full h-full">
      {/* Quick filter toggle overlay */}
      {inactiveCount > 0 && (
        <div className="absolute top-3 right-3 z-[1000]">
          <button
            onClick={() => setHideInactive(!hideInactive)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-soft transition-colors',
              hideInactive ? 'bg-navy text-white' : 'bg-white text-navy border border-[var(--border-subtle)] hover:bg-bgAlt'
            )}
          >
            {hideInactive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {hideInactive ? 'Inactive hidden' : `${inactiveCount} inactive`}
          </button>
        </div>
      )}

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

        {filteredLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat || 30.2672, loc.lng || -97.7431]}
            icon={createIcon(loc.category_key, loc.is_active === false)}
            eventHandlers={{
              click: () => onLocationSelect(loc),
            }}
          >
            <Popup>
              <div className="max-w-xs">
                <h4 className="font-semibold text-navy text-sm mb-1">{loc.name}</h4>
                <p className="text-xs text-textMuted mb-2">{loc.category}</p>
                {loc.is_active === false && (
                  <div className="bg-gray-100 text-gray-500 rounded p-1.5 mb-2">
                    <p className="text-xs font-medium">⚠ Inactive — not currently participating</p>
                  </div>
                )}
                {loc.perk && (
                  <div className="bg-gold/10 border border-gold/30 rounded p-2 mb-2">
                    <p className="text-xs font-medium text-navy">{loc.perk}</p>
                  </div>
                )}
                {loc.hours && (
                  <p className="text-xs text-textMuted mb-1"><strong>Hours:</strong> {loc.hours}</p>
                )}
                {loc.contact_phone && (
                  <a href={`tel:${loc.contact_phone}`} className="text-xs text-navy hover:underline block mb-1">
                    📞 {loc.contact_phone}
                  </a>
                )}
                {loc.website && (
                  <a href={loc.website} target="_blank" rel="noopener noreferrer" className="text-xs text-navy hover:underline block">
                    🌐 Visit website
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
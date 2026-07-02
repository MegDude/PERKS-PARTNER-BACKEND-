import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fallback for marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function getMapIconSvg(entity: any, isSelected: boolean) {
  const isPerk = entity.perk || entity.category === 'perk';
  const type = (entity.type || '').toLowerCase();
  const text = [entity.name, entity.category, entity.intent, entity.description].filter(Boolean).join(' ').toLowerCase();
  const isLegends = /\blegends\b/.test(text);
  const size = 34;
  const fill = isSelected ? '#C8A96A' : '#0B1F33';
  const border = isSelected ? '#0B1F33' : '#C8A96A';
  const icon = isSelected ? '#0B1F33' : '#C8A96A';
  const scale = isSelected ? 'scale(1.06)' : 'scale(1)';

  if (isLegends) {
    return `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;transform:${scale};transition:transform .18s ease;">
      <div style="width:${size}px;height:${size}px;border-radius:999px;background:#FFFFFF;border:3px solid #C8A96A;display:grid;place-items:center;box-shadow:0 8px 18px rgba(11,31,51,.18);overflow:hidden;">
        <img src="/pins/downtown-perks/legends-logo.png" alt="" style="width:25px;height:25px;object-fit:contain;display:block;" />
      </div>
    </div>`;
  }

  const iconMarkup = type === 'hotel'
    ? `<path d="M8 8v9M16 8v9M8 12h8" stroke="${icon}" stroke-width="2.2" stroke-linecap="round"/>`
    : type === 'event'
      ? `<rect x="7" y="8" width="10" height="9" rx="2" stroke="${icon}" stroke-width="2"/><path d="M9 6v4M15 6v4M7 11h10" stroke="${icon}" stroke-width="2" stroke-linecap="round"/>`
      : type === 'property' || type === 'real estate' || type === 'building'
        ? `<path d="M8 18V6h8v12M10 9h.01M14 9h.01M10 13h.01M14 13h.01" stroke="${icon}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
        : type === 'brand' && /\b(coffee|cafe|espresso|jo's)\b/.test(text)
          ? `<path d="M7 9h8v4a4 4 0 0 1-4 4h0a4 4 0 0 1-4-4Z" stroke="${icon}" stroke-width="2"/><path d="M15 10h1.5a2 2 0 0 1 0 4H15M9 6v1M12 6v1" stroke="${icon}" stroke-width="2" stroke-linecap="round"/>`
          : isPerk
            ? `<path d="M17 7 7 17M8.5 8.5h.01M15.5 15.5h.01" stroke="${icon}" stroke-width="2.4" stroke-linecap="round"/><circle cx="8.5" cy="8.5" r="1.7" stroke="${icon}" stroke-width="1.8"/><circle cx="15.5" cy="15.5" r="1.7" stroke="${icon}" stroke-width="1.8"/>`
            : `<circle cx="12" cy="12" r="4" stroke="${icon}" stroke-width="2.2"/><circle cx="12" cy="12" r="1.4" fill="${icon}"/>`;

  return `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;transform:${scale};transition:transform .18s ease;">
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 8px 18px rgba(11,31,51,.18));">
      <circle cx="12" cy="12" r="10" fill="${fill}" stroke="${border}" stroke-width="2.2"/>
      ${iconMarkup}
    </svg>
  </div>`;
}

function createMarker(entity: any) {
  return L.divIcon({
    className: "dp-pin-custom",
    html: getMapIconSvg(entity, entity.isSelected),
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
}

function MapEffect({ selectedEntity }: { selectedEntity: any }) {
  const map = useMap();
  useEffect(() => {
    if (selectedEntity?.lat && selectedEntity?.lng) {
      map.flyTo([selectedEntity.lat, selectedEntity.lng], 16, { animate: true, duration: 1 });
    }
  }, [selectedEntity, map]);
  return null;
}

export default function UnifiedMapShell({ 
  entities, 
  onEntitySelect, 
  selectedEntity,
  mode
}: { 
  entities: any[], 
  onEntitySelect: (e: any) => void,
  selectedEntity: any,
  mode?: string
}) {
  return (
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={[30.2672, -97.7431]} // Austin, TX
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        <MapEffect selectedEntity={selectedEntity} />
        
        {entities.map(pt => (
          <Marker 
            key={pt.id} 
            position={[pt.lat, pt.lng]}
            icon={createMarker({ ...pt, isSelected: selectedEntity?.id === pt.id })}
            eventHandlers={{
              click: () => onEntitySelect(pt)
            }}
          >
            {/* Optional Popup */}
          </Marker>
        ))}
      </MapContainer>
      <style>{`
        .leaflet-container {
          background: #F5F7FA;
        }
        .leaflet-control-zoom {
          margin-bottom: 2rem !important;
          margin-right: 1.5rem !important;
        }
        .leaflet-control-zoom a {
          color: #11182B !important;
          background: #fff !important;
          border: 1px solid rgba(17, 24, 43, 0.1) !important;
        }
      `}</style>
    </div>
  );
}

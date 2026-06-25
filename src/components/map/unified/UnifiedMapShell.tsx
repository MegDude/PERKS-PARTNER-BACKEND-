import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

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
  
  if (isPerk) {
    return `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:36px;transform:translateY(0) ${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:all .2s ease;">
      <svg width="28" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 8px 16px rgba(11,31,51,0.18))">
        <path d="M12 21C12 21 18 15.6 18 10.5C18 7.46243 15.3137 5 12 5C8.68629 5 6 7.46243 6 10.5C6 15.6 12 21 12 21Z" fill="rgba(212,175,55,0.98)" stroke="#FFFFFF" stroke-width="1.2"></path>
        <path d="M12 8.2L13.35 10.95L16.4 11.4L14.2 13.55L14.72 16.55L12 15.12L9.28 16.55L9.8 13.55L7.6 11.4L10.65 10.95L12 8.2Z" fill="#0B1F33"></path>
      </svg>
    </div>`;
  }
  
  if (type === 'dining') {
    return `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:36px;transform:translateY(0) ${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:all .2s ease;">
      <svg width="28" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 8px 16px rgba(11,31,51,0.18))">
        <path d="M12 21C12 21 18 15.6 18 10.5C18 7.46243 15.3137 5 12 5C8.68629 5 6 7.46243 6 10.5C6 15.6 12 21 12 21Z" fill="rgba(15,38,66,0.98)" stroke="#FFFFFF" stroke-width="1.2"></path>
        <path d="M10 8.2V12.7" stroke="#F4D78A" stroke-width="1.4" stroke-linecap="round"></path>
        <path d="M12 8.2V12.7" stroke="#F4D78A" stroke-width="1.4" stroke-linecap="round"></path>
        <path d="M14.6 8.2C14.6 9.7 13.8 10.5 13.1 10.9V12.8" stroke="#F4D78A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </div>`;
  }

  if (type === 'hotel') {
    return `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:36px;transform:translateY(0) ${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:all .2s ease;">
      <svg width="28" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 8px 16px rgba(11,31,51,0.18))">
        <path d="M12 21C12 21 18 15.6 18 10.5C18 7.46243 15.3137 5 12 5C8.68629 5 6 7.46243 6 10.5C6 15.6 12 21 12 21Z" fill="rgba(212,175,55,0.98)" stroke="#FFFFFF" stroke-width="1.2"></path>
        <path d="M10 8.3V12.8" stroke="#0B1F33" stroke-width="1.9" stroke-linecap="round"></path>
        <path d="M14 8.3V12.8" stroke="#0B1F33" stroke-width="1.9" stroke-linecap="round"></path>
        <path d="M10 10.55H14" stroke="#0B1F33" stroke-width="1.9" stroke-linecap="round"></path>
      </svg>
    </div>`;
  }
  
  if (type === 'event') {
    return `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:36px;transform:translateY(0) ${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:all .2s ease;">
      <svg width="28" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 8px 16px rgba(11,31,51,0.18))">
        <path d="M12 21C12 21 18 15.6 18 10.5C18 7.46243 15.3137 5 12 5C8.68629 5 6 7.46243 6 10.5C6 15.6 12 21 12 21Z" fill="rgba(212,175,55,0.98)" stroke="#FFFFFF" stroke-width="1.2"></path>
        <rect x="8.2" y="9.4" width="7.6" height="5.8" rx="1.4" fill="#0B1F33"></rect>
        <path d="M9 7.8V10.2" stroke="#0B1F33" stroke-width="1.4" stroke-linecap="round"></path>
        <path d="M15 7.8V10.2" stroke="#0B1F33" stroke-width="1.4" stroke-linecap="round"></path>
      </svg>
    </div>`;
  }
  
  if (type === 'building' || type === 'property' || type === 'real estate') {
    return `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:36px;transform:translateY(0) ${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:all .2s ease;">
      <svg width="28" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 8px 16px rgba(11,31,51,0.18))">
        <path d="M12 21C12 21 18 15.6 18 10.5C18 7.46243 15.3137 5 12 5C8.68629 5 6 7.46243 6 10.5C6 15.6 12 21 12 21Z" fill="rgba(212,175,55,0.98)" stroke="#FFFFFF" stroke-width="1.2"></path>
        <circle cx="12" cy="10.5" r="2.5" fill="#0B1F33"></circle>
      </svg>
    </div>`;
  }
  
  // place-marker-icon default
  return `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:36px;transform:translateY(0) ${isSelected ? 'scale(1.15)' : 'scale(1)'};transition:all .2s ease;">
      <svg width="28" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 8px 16px rgba(11,31,51,0.18))">
        <path d="M12 21C12 21 18 15.6 18 10.5C18 7.46243 15.3137 5 12 5C8.68629 5 6 7.46243 6 10.5C6 15.6 12 21 12 21Z" fill="rgba(212,175,55,0.98)" stroke="#FFFFFF" stroke-width="1.2"></path>
        <circle cx="12" cy="10.5" r="3.1" fill="#0B1F33"></circle>
        <circle cx="12" cy="10.5" r="1.15" fill="rgba(255,255,255,0.92)"></circle>
      </svg>
  </div>`;
}

function createMarker(entity: any) {
  return L.divIcon({
    className: "dp-pin-custom",
    html: getMapIconSvg(entity, entity.isSelected),
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
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

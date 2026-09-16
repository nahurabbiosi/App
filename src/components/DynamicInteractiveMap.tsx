import React, { useEffect } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Compass } from 'lucide-react';

export interface DynamicMapProps {
  selectedLocation: {
    lat: number;
    lng: number;
    name?: string;
  };
  userCoords?: { latitude: number; longitude: number } | null;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
  className?: string;
  height?: string;
  zoom?: number;
}

// Controller component to smoothly animate camera to selected position
const MapCameraAnimator: React.FC<{ target: { lat: number; lng: number }; zoom?: number }> = ({
  target,
  zoom = 15,
}) => {
  const map = useMap();

  useEffect(() => {
    if (map && target && typeof target.lat === 'number' && typeof target.lng === 'number') {
      map.panTo({ lat: target.lat, lng: target.lng });
      map.setZoom(zoom);
    }
  }, [map, target.lat, target.lng, zoom]);

  return null;
};

export const DynamicInteractiveMap: React.FC<DynamicMapProps> = ({
  selectedLocation,
  userCoords,
  onCoordinatesChange,
  className = '',
  height = '260px',
  zoom = 15,
}) => {
  const currentCenter = {
    lat: selectedLocation?.lat || -34.5802,
    lng: selectedLocation?.lng || -58.4233,
  };

  return (
    <div
      style={{ height }}
      className={`relative w-full rounded-2xl overflow-hidden border border-[#2A2F37] shadow-xl bg-[#121417] ${className}`}
    >
      <Map
        defaultCenter={currentCenter}
        center={currentCenter}
        defaultZoom={zoom}
        zoom={zoom}
        mapId="FALTA1_DYNAMIC_MAP"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        gestureHandling="cooperative"
        fullscreenControl={false}
        streetViewControl={false}
        mapTypeControl={false}
        className="w-full h-full"
        onClick={(e) => {
          if (e.detail?.latLng && onCoordinatesChange) {
            onCoordinatesChange({
              lat: e.detail.latLng.lat,
              lng: e.detail.latLng.lng,
            });
          }
        }}
      >
        {/* Animated Camera Synchronizer */}
        <MapCameraAnimator target={currentCenter} zoom={zoom} />

        {/* User GPS Location Marker */}
        {userCoords && (
          <AdvancedMarker
            position={{ lat: userCoords.latitude, lng: userCoords.longitude }}
            title="Tu ubicación GPS"
          >
            <div className="relative flex items-center justify-center">
              <div className="w-5 h-5 bg-[#00F0FF] rounded-full border-2 border-white shadow-[0_0_15px_#00F0FF] z-10" />
              <div className="absolute w-9 h-9 bg-[#00F0FF]/30 rounded-full animate-ping" />
            </div>
          </AdvancedMarker>
        )}

        {/* Target Selected Complex / Match Pin (Neon Falta1) */}
        {selectedLocation && typeof selectedLocation.lat === 'number' && (
          <AdvancedMarker
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            title={selectedLocation.name || 'Cancha seleccionada'}
          >
            <div className="relative flex flex-col items-center -translate-y-5 group cursor-pointer">
              <div className="bg-[#0F4C3A] text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-[#00F0FF] shadow-lg mb-1 whitespace-nowrap flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
                {selectedLocation.name || 'Cancha seleccionada'}
              </div>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#0F4C3A] border-2 border-[#00F0FF] shadow-[0_0_20px_#00F0FF] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#00F0FF]" />
                </div>
                <div className="w-2 h-2 bg-[#00F0FF] rotate-45 mx-auto -mt-1 shadow-sm" />
              </div>
            </div>
          </AdvancedMarker>
        )}
      </Map>

      {/* Floating Info Overlay */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
        <div className="bg-[#121417]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl backdrop-blur-md border border-[#2A2F37] flex items-center gap-1.5 pointer-events-auto">
          <Compass className="w-3 h-3 text-[#00F0FF]" />
          <span>
            {currentCenter.lat.toFixed(4)}, {currentCenter.lng.toFixed(4)}
          </span>
        </div>

        {onCoordinatesChange && (
          <div className="bg-[#0F4C3A]/90 text-emerald-200 text-[10px] font-semibold px-2.5 py-1 rounded-xl backdrop-blur-md border border-[#1b6a52] pointer-events-auto">
            Hacé clic en el mapa para reubicar el pin
          </div>
        )}
      </div>
    </div>
  );
};

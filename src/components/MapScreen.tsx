import React, { useState, useMemo, useEffect } from 'react';
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Calendar,
  Users,
  Compass,
  DollarSign,
  ExternalLink,
  ChevronRight,
  Filter,
  Globe,
  Clock,
} from 'lucide-react';
import { Partido } from '@/types/database';
import { calculateDistanceKm } from '@/lib/store';
import { LocationSearch } from './LocationSearch';
import { LocationResult } from '@/lib/geoService';
import { formatMatchDateTime } from '@/lib/timezone';

export type MapScreenProps = {
  partidos: Partido[];
  onSelectMatch: (id: string) => void;
  userCoords?: { latitude: number; longitude: number } | null;
};

// Smooth camera animator helper using useMap()
const MapCameraSynchronizer: React.FC<{
  target: { lat: number; lng: number } | null;
  zoom?: number;
}> = ({ target, zoom = 14 }) => {
  const map = useMap();

  useEffect(() => {
    if (map && target && typeof target.lat === 'number' && typeof target.lng === 'number') {
      map.panTo({ lat: target.lat, lng: target.lng });
      if (zoom) {
        map.setZoom(zoom);
      }
    }
  }, [map, target, zoom]);

  return null;
};

export const MapScreen: React.FC<MapScreenProps> = ({
  partidos,
  onSelectMatch,
  userCoords,
}) => {
  // Default center: Buenos Aires (Obelisco / Palermo area)
  const defaultCenter = useMemo(() => {
    if (userCoords) {
      return { lat: userCoords.latitude, lng: userCoords.longitude };
    }
    return { lat: -34.5802, lng: -58.4233 };
  }, [userCoords]);

  const [selectedMatch, setSelectedMatch] = useState<Partido | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number | null>(null); // null = all, 5 = < 5km, 10 = < 10km
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [onlyArquero, setOnlyArquero] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number } | null>(null);

  // Filter matches with valid coordinates
  const matchesWithCoords = useMemo(() => {
    return partidos.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
  }, [partidos]);

  // Filtered by distance and tags
  const filteredMatches = useMemo(() => {
    return matchesWithCoords.filter((match) => {
      if (selectedFormat !== 'all' && match.tipo_cancha !== selectedFormat) {
        return false;
      }
      if (onlyArquero && !match.busca_arquero) {
        return false;
      }
      if (distanceFilter !== null && userCoords && match.lat && match.lng) {
        const d = calculateDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          match.lat,
          match.lng
        );
        if (d > distanceFilter) return false;
      }
      return true;
    });
  }, [matchesWithCoords, selectedFormat, onlyArquero, distanceFilter, userCoords]);

  const handleSelectSearchedPlace = (loc: LocationResult) => {
    setCameraTarget({ lat: loc.lat, lng: loc.lng });
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Compass className="w-6 h-6 text-emerald-600" />
              Mapa de Canchas y Partidos
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Explorá partidos abiertos cerca de tu ubicación actual en Google Maps
            </p>
          </div>

          {userCoords && (
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full self-start sm:self-auto border border-emerald-200">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              Ubicación GPS activa
            </div>
          )}
        </div>

        {/* Filters pills & Global Search */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-600" /> Búsqueda Global de Predios y Ciudades:
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Internacional sin restricción</span>
            </div>
            <LocationSearch
              onSelectLocation={handleSelectSearchedPlace}
              userCoords={userCoords}
              placeholder="Buscá predios, clubes o ciudades en cualquier país..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-gray-400 font-medium flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" /> Filtrar:
            </span>

          {/* Distance pills (only if user has coordinates) */}
          {userCoords && (
            <>
              <button
                type="button"
                onClick={() => setDistanceFilter(null)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  distanceFilter === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cualquier distancia
              </button>
              <button
                type="button"
                onClick={() => setDistanceFilter(5)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  distanceFilter === 5
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                &lt; 5 km
              </button>
              <button
                type="button"
                onClick={() => setDistanceFilter(10)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  distanceFilter === 10
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                &lt; 10 km
              </button>
            </>
          )}

          {/* Format pills */}
          {['all', '5', '7', '11'].map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setSelectedFormat(fmt)}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                selectedFormat === fmt
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {fmt === 'all' ? 'Todos los formatos' : `Fútbol ${fmt}`}
            </button>
          ))}

          {/* Arquero toggle */}
          <button
            type="button"
            onClick={() => setOnlyArquero(!onlyArquero)}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              onlyArquero
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>🧤</span> Con arquero/a pedido
          </button>
        </div>
      </div>
    </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[460px] md:h-[560px] rounded-2xl overflow-hidden border border-gray-200 shadow-md">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          fullscreenControl={false}
          className="w-full h-full"
        >
          {/* Smooth camera synchronizer */}
          <MapCameraSynchronizer target={cameraTarget} zoom={15} />

          {/* User Location Marker */}
          {userCoords && (
            <AdvancedMarker
              position={{ lat: userCoords.latitude, lng: userCoords.longitude }}
              title="Tu ubicación"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg z-10" />
                <div className="absolute w-9 h-9 bg-blue-400/40 rounded-full animate-ping" />
              </div>
            </AdvancedMarker>
          )}

          {/* Match Markers */}
          {filteredMatches.map((match) => {
            const isSelected = selectedMatch?.id === match.id;
            const spotsLeft = match.jugadores_necesarios - match.jugadores_confirmados;
            const isUrgent = spotsLeft > 0 && spotsLeft <= 2;

            return (
              <AdvancedMarker
                key={match.id}
                position={{ lat: match.lat!, lng: match.lng! }}
                onClick={() => {
                  setSelectedMatch(match);
                  if (match.lat && match.lng) {
                    setCameraTarget({ lat: match.lat, lng: match.lng });
                  }
                }}
                title={match.titulo}
              >
                <div
                  className={`px-2.5 py-1.5 rounded-xl font-bold shadow-lg flex items-center gap-1.5 text-xs transition-all cursor-pointer transform hover:scale-110 ${
                    isSelected
                      ? 'bg-gray-900 text-white ring-2 ring-emerald-400 scale-105'
                      : isUrgent
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  <span className="text-sm">⚽</span>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="font-extrabold text-[11px]">F{match.tipo_cancha}</span>
                    <span className="text-[9px] opacity-90">
                      ${match.precio_por_persona?.toLocaleString('es-AR') || '3.000'}
                    </span>
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* InfoWindow for Selected Match */}
          {selectedMatch && selectedMatch.lat && selectedMatch.lng && (
            <InfoWindow
              position={{ lat: selectedMatch.lat, lng: selectedMatch.lng }}
              onCloseClick={() => setSelectedMatch(null)}
              headerContent={
                <div className="font-bold text-gray-900 text-sm">
                  {selectedMatch.cancha || selectedMatch.titulo}
                </div>
              }
            >
              <div className="p-1 max-w-[240px] text-xs space-y-2">
                <p className="font-semibold text-gray-800 line-clamp-1">{selectedMatch.titulo}</p>

                <div className="flex items-center justify-between text-gray-600">
                  <span className="bg-gray-100 px-2 py-0.5 rounded font-bold">
                    Fútbol {selectedMatch.tipo_cancha}
                  </span>
                  <span className="font-bold text-emerald-700">
                    ${selectedMatch.precio_por_persona?.toLocaleString('es-AR') || '3.000'} c/u
                  </span>
                </div>

                {/* Localized match date and time */}
                {(() => {
                  const mt = formatMatchDateTime(selectedMatch.fecha_hora);
                  return (
                    <div className="text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium">
                        {mt.displayDate} {mt.displayTime} ({mt.deviceTimezone.split('/')[1] || mt.deviceTimezone})
                      </span>
                    </div>
                  );
                })()}

                <div className="text-gray-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {selectedMatch.jugadores_confirmados} de {selectedMatch.jugadores_necesarios} jugadores
                  </span>
                </div>

                {userCoords && (
                  <div className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>
                      A{' '}
                      {calculateDistanceKm(
                        userCoords.latitude,
                        userCoords.longitude,
                        selectedMatch.lat,
                        selectedMatch.lng
                      )}{' '}
                      km de vos
                    </span>
                  </div>
                )}

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectMatch(selectedMatch.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-lg text-center text-xs transition-colors"
                  >
                    Ver partido
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMatch.lat},${selectedMatch.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold p-1.5 rounded-lg flex items-center justify-center transition-colors"
                    title="Cómo llegar en Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>

      {/* List of matches with distances */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Canchas disponibles ({filteredMatches.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredMatches.map((match) => {
            const distance =
              userCoords && match.lat && match.lng
                ? calculateDistanceKm(
                    userCoords.latitude,
                    userCoords.longitude,
                    match.lat,
                    match.lng
                  )
                : null;
            const mt = formatMatchDateTime(match.fecha_hora);

            return (
              <div
                key={match.id}
                onClick={() => {
                  setSelectedMatch(match);
                  if (match.lat && match.lng) {
                    setCameraTarget({ lat: match.lat, lng: match.lng });
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedMatch?.id === match.id
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-gray-900 text-white px-2 py-0.5 rounded">
                      F{match.tipo_cancha}
                    </span>
                    <h4 className="font-bold text-sm text-gray-900 truncate">{match.titulo}</h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{match.cancha}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{mt.displayDate} {mt.displayTime}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end">
                  {distance !== null && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-1">
                      {distance} km
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMatch(match.id);
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                  >
                    Detalles <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

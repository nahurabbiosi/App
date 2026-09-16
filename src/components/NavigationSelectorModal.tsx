import React, { useState } from 'react';
import { X, ExternalLink, Navigation, Copy, Check, Car, Footprints } from 'lucide-react';

export type NavigationSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pitchName: string;
  lat: number;
  lng: number;
  userCoords?: { latitude: number; longitude: number } | null;
  distanceKm?: number | null;
};

export const NavigationSelectorModal: React.FC<NavigationSelectorModalProps> = ({
  isOpen,
  onClose,
  pitchName,
  lat,
  lng,
  distanceKm,
}) => {
  const [copied, setCopied] = useState(false);

  // Estimations
  const autoMinutes = distanceKm ? Math.max(3, Math.round(distanceKm * 2.3)) : 15;
  const transitMinutes = distanceKm ? Math.max(8, Math.round(distanceKm * 4.5)) : 30;

  // Direct URLs
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5">
            <Navigation className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-gray-900">Cómo llegar a la cancha</h3>
          <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-0.5">{pitchName}</p>
        </div>

        {/* Travel time estimation badges */}
        {distanceKm !== null && distanceKm !== undefined && (
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-2xl mb-4 border border-gray-100 text-center text-xs">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 font-bold text-gray-800">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                ~{autoMinutes} min
              </div>
              <span className="text-[10px] text-gray-500">En auto / taxi</span>
            </div>
            <div className="flex flex-col items-center border-l border-gray-200">
              <div className="flex items-center gap-1 font-bold text-gray-800">
                <Footprints className="w-3.5 h-3.5 text-emerald-600" />
                ~{transitMinutes} min
              </div>
              <span className="text-[10px] text-gray-500">Transporte / a pie</span>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Google Maps Option */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                🗺️
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                  Google Maps
                </span>
                <span className="text-[11px] text-gray-500">Navegación GPS y tránsito en vivo</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
          </a>

          {/* Waze Option */}
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-black text-sm">
                🚗
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                  Waze
                </span>
                <span className="text-[11px] text-gray-500">Alertas de tráfico y radares</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
          </a>

          {/* Apple Maps Option */}
          <a
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-800 flex items-center justify-center font-black text-sm">
                🍎
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                  Apple Maps
                </span>
                <span className="text-[11px] text-gray-500">Navegación en dispositivos iOS/Mac</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
          </a>
        </div>

        {/* Copy coordinates action */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="font-mono text-[11px]">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
          <button
            type="button"
            onClick={handleCopyCoords}
            className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copiar coordenadas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  Flame,
  Navigation,
  Compass,
} from 'lucide-react';
import { Partido } from '@/types/database';
import { calculateDistanceKm } from '@/lib/store';
import { NavigationSelectorModal } from './NavigationSelectorModal';

export type MatchCardProps = {
  partido: Partido;
  onPress: () => void;
  userCoords?: { latitude: number; longitude: number } | null;
};

export const MatchCard: React.FC<MatchCardProps> = ({ partido, onPress, userCoords }) => {
  const [showNavModal, setShowNavModal] = useState(false);
  const rawDate = new Date(partido.fecha_hora);
  const dateValid = isValid(rawDate);
  const spotsLeft = Math.max(0, partido.jugadores_necesarios - partido.jugadores_confirmados);
  const isFalta1 = spotsLeft === 1;
  const isUrgent = spotsLeft > 0 && spotsLeft <= 2;
  const isFull = spotsLeft === 0;
  const progressPercent = Math.min(
    100,
    Math.round((partido.jugadores_confirmados / partido.jugadores_necesarios) * 100)
  );

  const formattedDate = dateValid
    ? format(rawDate, "EEEE d 'de' MMMM — HH:mm", { locale: es })
    : partido.fecha_hora;
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Distance calculation
  let distanceStr: string | null = null;
  let distanceKm: number | null = null;
  if (userCoords && partido.lat && partido.lng) {
    distanceKm = calculateDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      partido.lat,
      partido.lng
    );
    distanceStr = `A ${distanceKm} km`;
  }

  const generoLabel = {
    mixto: 'Mixto',
    femenino: 'Exclusivo Femenino',
    masculino: 'Masculino',
  }[partido.genero || 'mixto'];

  return (
    <div
      id={`match-card-${partido.id}`}
      onClick={onPress}
      className="bg-[#1E2228] rounded-2xl p-5 border-t-2 border-t-[#0F4C3A] border-x border-b border-[#2A2F37] shadow-lg hover:shadow-2xl hover:border-t-[#00F0FF] hover:border-[#38404B] transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
    >
      {/* Background glow when Falta 1 */}
      {isFalta1 && (
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#00F0FF]/5 rounded-full blur-2xl pointer-events-none" />
      )}

      <div>
        {/* Top bar: Header & Price Pill */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider bg-[#121417] text-gray-200 px-2.5 py-1 rounded-lg border border-[#2D333D]">
              Fútbol {partido.tipo_cancha}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/25">
              {generoLabel}
            </span>
          </div>

          {/* Pastilla de Precio: Verde Esmeralda (#0F4C3A) con texto blanco */}
          <div className="shrink-0 bg-[#0F4C3A] hover:bg-[#135f49] text-white px-3 py-1.5 rounded-xl text-right border border-[#1b6a52] shadow-sm transition-colors">
            <span className="text-xs font-black block leading-none">
              ${partido.precio_por_persona?.toLocaleString('es-AR') || '3.000'}
            </span>
            <span className="text-[10px] text-emerald-200/90 font-medium block">/ persona</span>
          </div>
        </div>

        {/* Título de la tarjeta */}
        <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#00F0FF] transition-colors line-clamp-1 mb-2.5 tracking-tight">
          {partido.titulo}
        </h3>

        {/* Cuerpo de la Tarjeta */}
        <div className="space-y-2 text-xs mb-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
              <span className="truncate font-medium text-[#A0AAB4]">
                {partido.cancha || 'Ubicación a convenir'}
              </span>
            </div>
            {distanceStr && (
              <span className="shrink-0 text-[11px] font-bold text-emerald-400 bg-[#0F4C3A]/40 border border-[#0F4C3A] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Navigation className="w-3 h-3" /> {distanceStr}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-200">
              <Calendar className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
              <span className="truncate font-medium">{displayDate} hs</span>
            </div>

            {partido.lat && partido.lng && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNavModal(true);
                }}
                className="text-[11px] font-bold text-emerald-300 hover:text-white bg-[#0F4C3A]/50 hover:bg-[#0F4C3A] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors border border-[#0F4C3A] cursor-pointer"
                title="Abrir en Google Maps, Waze o Apple Maps"
              >
                <Compass className="w-3 h-3 text-[#00F0FF]" /> Cómo llegar
              </button>
            )}
          </div>
        </div>

        {/* Badges en Azul Cyan y tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {partido.servicios?.includes('techada') && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">
              [Techado]
            </span>
          )}

          {partido.servicios?.includes('sintetico') && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20">
              [Sintético]
            </span>
          )}

          {partido.busca_arquero && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <span>🧤</span> Se busca arquero/a {partido.arquero_gratis ? '(¡Gratis!)' : ''}
            </span>
          )}

          {partido.tercer_tiempo && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-300 border border-orange-500/25">
              🍻 Tercer tiempo
            </span>
          )}
        </div>
      </div>

      {/* Footer de la Tarjeta (Estado de Cupos) */}
      <div className="pt-3 border-t border-[#2A2F37]/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-[#A0AAB4] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#A0AAB4]" />
            {partido.jugadores_confirmados} de {partido.jugadores_necesarios} confirmados
          </span>

          {/* Texto de cupos: ¡FALTA 1 JUGADOR/A! destacado en Cyan */}
          {isFalta1 ? (
            <span className="font-black text-[#00F0FF] flex items-center gap-1 text-xs tracking-wide animate-pulse-cyan">
              <Flame className="w-4 h-4 fill-[#00F0FF]" /> ¡FALTA 1 JUGADOR/A!
            </span>
          ) : isFull ? (
            <span className="font-bold text-gray-400">Cupos llenos</span>
          ) : (
            <span className={`font-bold ${isUrgent ? 'text-amber-400' : 'text-emerald-400'}`}>
              Faltan {spotsLeft} jugadores
            </span>
          )}
        </div>

        {/* Barra de Progreso: línea fina en verde esmeralda y el último tramo en cyan */}
        <div className="w-full bg-[#121417] h-1.5 rounded-full overflow-hidden mb-3 relative border border-[#2D333D]">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isFalta1
                ? 'bg-gradient-to-r from-[#0F4C3A] via-[#10B981] to-[#00F0FF]'
                : isFull
                ? 'bg-gray-500'
                : 'bg-[#0F4C3A]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between text-[11px] text-[#A0AAB4]">
          <span>
            {partido.medio_pago === 'transferencia' ? '💳 Transferencia' : '💵 Efectivo en cancha'}
          </span>
          <span className="text-[#00F0FF] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Ver detalles <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {partido.lat && partido.lng && (
        <NavigationSelectorModal
          isOpen={showNavModal}
          onClose={() => setShowNavModal(false)}
          pitchName={partido.cancha || partido.titulo}
          lat={partido.lat}
          lng={partido.lng}
          userCoords={userCoords}
          distanceKm={distanceKm}
        />
      )}
    </div>
  );
};


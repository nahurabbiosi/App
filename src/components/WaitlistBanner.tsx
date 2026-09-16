import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, XCircle, ArrowRight, Zap } from 'lucide-react';
import { DataStore } from '@/lib/store';
import { Partido, Usuario } from '@/types/database';

export type WaitlistBannerProps = {
  currentUser: Usuario;
  onOpenMatch: (matchId: string) => void;
  onRefresh?: () => void;
};

export const WaitlistBanner: React.FC<WaitlistBannerProps> = ({
  currentUser,
  onOpenMatch,
  onRefresh,
}) => {
  const [activeMatch, setActiveMatch] = useState<Partido | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const checkWaitlistStatus = () => {
    // Also trigger automated timer checks
    DataStore.checkAndAdvanceWaitlistTimers();

    // Get stored matches
    try {
      const partidos = JSON.parse(localStorage.getItem('juntada_partidos_v1') || '[]') as Partido[];
      const myTurnMatch = partidos.find(
        (p) => p.suplente_activo && p.suplente_activo.usuario_id === currentUser.id
      );

      if (myTurnMatch && myTurnMatch.suplente_activo) {
        const expTime = new Date(myTurnMatch.suplente_activo.expira_en).getTime();
        const diffSecs = Math.max(0, Math.floor((expTime - Date.now()) / 1000));

        if (diffSecs > 0) {
          setActiveMatch(myTurnMatch);
          setSecondsRemaining(diffSecs);
        } else {
          setActiveMatch(null);
          setSecondsRemaining(0);
        }
      } else {
        setActiveMatch(null);
        setSecondsRemaining(0);
      }
    } catch {
      setActiveMatch(null);
    }
  };

  useEffect(() => {
    checkWaitlistStatus();
    const interval = setInterval(() => {
      checkWaitlistStatus();
    }, 1000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  if (!activeMatch || secondsRemaining <= 0) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleConfirm = async () => {
    const success = await DataStore.confirmWaitlistSlot(activeMatch.id, currentUser.id);
    if (success) {
      setActiveMatch(null);
      if (onRefresh) onRefresh();
      onOpenMatch(activeMatch.id);
    }
  };

  const handleDecline = async () => {
    await DataStore.declineWaitlistSlot(activeMatch.id, currentUser.id);
    setActiveMatch(null);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg sticky top-0 z-40 animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide uppercase bg-amber-400 text-gray-950 px-2 py-0.5 rounded-md">
                ¡Tu Turno en Lista de Espera!
              </span>
              <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {timerDisplay} para confirmar
              </span>
            </div>
            <p className="text-sm font-semibold text-white truncate max-w-md sm:max-w-xl">
              Se liberó un cupo en "{activeMatch.titulo}". ¡Confirmá tu lugar antes de que pase al siguiente suplente!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Confirmar y Sumarme</span>
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="bg-black/20 hover:bg-black/30 text-white/90 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Ceder a otro
          </button>

          <button
            type="button"
            onClick={() => onOpenMatch(activeMatch.id)}
            className="text-white hover:text-emerald-100 p-1.5 rounded-lg text-xs font-bold"
            title="Ver partido"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

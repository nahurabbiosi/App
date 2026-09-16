import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { evaluateCancellation, CancellationPolicyResult } from '@/lib/security';
import { Usuario } from '@/types/database';

export type CancelPenaltyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  matchDateIso: string;
  currentUser: Usuario;
};

export const CancelPenaltyModal: React.FC<CancelPenaltyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  matchDateIso,
  currentUser,
}) => {
  if (!isOpen) return null;

  const evaluation: CancellationPolicyResult = evaluateCancellation(matchDateIso);
  const currentAttendance = currentUser.asistencia_pct || 98;
  const newAttendance = Math.max(0, currentAttendance - evaluation.penaltyPct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 relative">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              evaluation.type === 'anticipada'
                ? 'bg-emerald-100 text-emerald-700'
                : evaluation.type === 'tardia'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {evaluation.type === 'anticipada' ? (
              <Clock className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">{evaluation.title}</h3>
            <span className="text-xs text-gray-500 font-medium">
              Faltan {evaluation.hoursRemaining} horas para el inicio
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-4">{evaluation.description}</p>

        {/* Impact breakdown */}
        <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200/80 mb-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Índice de Asistencia actual:</span>
            <span className="font-bold text-gray-800">{currentAttendance}%</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Penalización aplicada:</span>
            <span
              className={`font-black ${
                evaluation.penaltyPct > 0 ? 'text-red-600' : 'text-emerald-600'
              }`}
            >
              {evaluation.penaltyPct > 0 ? `-${evaluation.penaltyPct}%` : '0% (Sin penalización)'}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-xs font-bold">
            <span className="text-gray-800">Nuevo Índice de Asistencia:</span>
            <span
              className={`text-sm font-black ${
                newAttendance >= 90
                  ? 'text-emerald-700'
                  : newAttendance >= 80
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}
            >
              {newAttendance}%
            </span>
          </div>

          {evaluation.suspensionDays > 0 && (
            <div className="p-2 rounded-xl bg-red-100/70 border border-red-200 text-[11px] text-red-800 font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Suspensión por {evaluation.suspensionDays} días para inscribirte a nuevos partidos.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Permanecer en el partido
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-colors ${
              evaluation.type === 'anticipada'
                ? 'bg-gray-800 hover:bg-gray-900'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Confirmar Baja
          </button>
        </div>
      </div>
    </div>
  );
};

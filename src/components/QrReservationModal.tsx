import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, CheckCircle2, ShieldCheck, MapPin, Calendar, Clock, Copy, Check, Sparkles } from 'lucide-react';
import { Partido } from '@/types/database';
import { DataStore } from '@/lib/store';

export type QrReservationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  partido: Partido;
  onValidationSuccess?: () => void;
};

export const QrReservationModal: React.FC<QrReservationModalProps> = ({
  isOpen,
  onClose,
  partido,
  onValidationSuccess,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isValidated, setIsValidated] = useState(partido.reserva_validada || false);
  const [validating, setValidating] = useState(false);

  const reservationCode = partido.reserva_codigo || `F1-${partido.id.slice(-6).toUpperCase()}`;

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(reservationCode, {
        width: 250,
        margin: 2,
        color: {
          dark: '#121417',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('Error generating QR', err));
    }
  }, [isOpen, reservationCode]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(reservationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateReceptionValidation = () => {
    setValidating(true);
    setTimeout(() => {
      const res = DataStore.validateReservaQR(reservationCode);
      setIsValidated(res.success);
      setValidating(false);
      if (onValidationSuccess) onValidationSuccess();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative border border-gray-100 overflow-hidden text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Check-in Digital en Recepción</span>
          </div>
          <h3 className="text-lg font-black text-gray-900">
            Confirmación de Reserva
          </h3>
          <p className="text-xs text-gray-500">
            Presentá este código QR en la administración del complejo para ingresar a la cancha
          </p>
        </div>

        {/* QR Code Canvas Frame */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 inline-block shadow-inner">
          {qrUrl ? (
            <img
              src={qrUrl}
              alt={`QR Reserva ${reservationCode}`}
              className="w-48 h-48 mx-auto rounded-xl"
            />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">
              Generando código QR...
            </div>
          )}

          {/* Alphanumeric fallback code */}
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-center gap-2">
            <span className="font-mono font-black text-sm text-gray-800 tracking-wider">
              {reservationCode}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-emerald-700 hover:text-emerald-900 transition-colors"
              title="Copiar código"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Complex and Match Info */}
        <div className="bg-emerald-50/60 p-3.5 rounded-xl text-left text-xs space-y-1.5 text-emerald-950 border border-emerald-200/70">
          <div className="flex items-center justify-between">
            <span className="text-emerald-700 font-medium">Predio:</span>
            <span className="font-bold truncate max-w-[180px]">{partido.cancha || 'Complejo El Predio'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-emerald-700 font-medium">Formato:</span>
            <span className="font-bold">{partido.tipo_cancha}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-emerald-700 font-medium">Beneficio:</span>
            <span className="font-bold text-emerald-800">10% OFF en buffet</span>
          </div>
        </div>

        {/* Validation Status */}
        <div className="pt-2">
          {isValidated ? (
            <div className="bg-emerald-100 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>✅ ¡Check-in Validado en Recepción!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[11px] text-amber-700 font-semibold block">
                ⏳ Pendiente de validación por recepcionista
              </span>
              <button
                type="button"
                onClick={handleSimulateReceptionValidation}
                disabled={validating}
                className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {validating ? 'Verificando con recepción...' : 'Simular Escaneo de Recepcionista'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

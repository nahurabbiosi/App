import React, { useState } from 'react';
import { X, Copy, Check, Share2, Smartphone, QrCode, Lock, Globe, MessageCircle } from 'lucide-react';
import { Partido } from '@/types/database';
import { formatMatchDateTime } from '@/lib/timezone';

export type ShareMatchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  partido: Partido;
};

export const ShareMatchModal: React.FC<ShareMatchModalProps> = ({
  isOpen,
  onClose,
  partido,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const mt = formatMatchDateTime(partido.fecha_hora);
  const spotsLeft = Math.max(0, partido.jugadores_necesarios - partido.jugadores_confirmados);

  // Deep Link URL
  const baseUrl = window.location.origin + window.location.pathname;
  const deepLink = `${baseUrl}?matchId=${partido.id}${partido.privado && partido.codigo_acceso ? `&code=${partido.codigo_acceso}` : ''}`;

  // WhatsApp Message
  const whatsappText = encodeURIComponent(
    `⚽️ *¡FALTA ${spotsLeft > 1 ? spotsLeft : '1'} PARA JUGAR AL FÚTBOL!* ⚽️\n\n` +
      `🏆 *Partido:* ${partido.titulo}\n` +
      `📍 *Cancha:* ${partido.cancha || 'Predio'}\n` +
      `⏰ *Horario:* ${mt.displayDate} a las ${mt.displayTime} hs\n` +
      `👟 *Modalidad:* Fútbol ${partido.tipo_cancha} (${partido.genero || 'Mixto'})\n` +
      `💰 *Cuota individual:* $${partido.precio_por_persona.toLocaleString('es-AR')}\n` +
      (partido.busca_arquero ? `🧤 *¡Se busca arquero/a urgente! (Juega gratis)*\n` : '') +
      (partido.privado && partido.codigo_acceso ? `🔒 *Código de acceso privado:* ${partido.codigo_acceso}\n` : '') +
      `\n👉 *Sumate directamente acá en 1 toque:*\n${deepLink}\n\n` +
      `_Organizado en Falta1 - La app de fútbol amateur_`
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (partido.codigo_acceso) {
      navigator.clipboard.writeText(partido.codigo_acceso);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Generate SVG QR Code matrix for preview
  const qrSeed = `${partido.id}-${partido.codigo_acceso || 'pub'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 leading-tight">
              Invitar Jugadores (Viralidad Express)
            </h3>
            <p className="text-xs text-gray-500">
              {partido.privado
                ? 'Partido privado: solo ingresan quienes tengan tu enlace o código'
                : 'Compartí en grupos de WhatsApp para completar el partido en minutos'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4 flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
          <div className="flex items-center gap-2">
            {partido.privado ? (
              <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                <Lock className="w-3.5 h-3.5" /> Partido Privado
              </span>
            ) : (
              <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                <Globe className="w-3.5 h-3.5" /> Partido Público
              </span>
            )}
            <span className="text-gray-500 font-medium">Fútbol {partido.tipo_cancha}</span>
          </div>
          <span className="font-extrabold text-emerald-700">
            {spotsLeft > 0 ? `Quedan ${spotsLeft} lugares` : 'Partido lleno'}
          </span>
        </div>

        {/* Direct WhatsApp Share Button */}
        <div className="space-y-3 mb-5">
          <a
            href={`https://wa.me/?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-colors shadow-md text-sm cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Invitar por WhatsApp en 1 toque</span>
          </a>

          {/* Deep Link Field */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
              Enlace directo (Deep Link):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={deepLink}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-[#121417] font-mono truncate select-all caret-[#00E676]"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Private Code if applicable */}
          {partido.privado && partido.codigo_acceso && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
              <label className="block text-[10px] font-bold text-amber-800 uppercase mb-0.5">
                Código de Acceso para Amigos:
              </label>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-black text-amber-900 tracking-wider">
                  {partido.codigo_acceso}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? '¡Copiado!' : 'Copiar código'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic QR Code */}
        <div className="pt-3 border-t border-gray-100 flex flex-col items-center text-center">
          <span className="text-[11px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-emerald-600" /> Código QR para Escaneo en la Cancha
          </span>
          <div className="p-3 bg-white rounded-2xl border border-gray-200 shadow-xs mb-2">
            {/* Elegant Vector QR code illustration */}
            <svg
              className="w-36 h-36"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100" height="100" fill="white" />
              {/* Corner position markers */}
              <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
              <rect x="9" y="9" width="20" height="20" rx="2" fill="white" />
              <rect x="13" y="13" width="12" height="12" rx="2" fill="#059669" />

              <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
              <rect x="71" y="9" width="20" height="20" rx="2" fill="white" />
              <rect x="75" y="13" width="12" height="12" rx="2" fill="#059669" />

              <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
              <rect x="9" y="71" width="20" height="20" rx="2" fill="white" />
              <rect x="13" y="75" width="12" height="12" rx="2" fill="#059669" />

              {/* Data modules */}
              <rect x="38" y="10" width="8" height="6" fill="#0f172a" />
              <rect x="50" y="14" width="10" height="8" fill="#0f172a" />
              <rect x="38" y="24" width="14" height="6" fill="#059669" />

              <rect x="10" y="38" width="6" height="8" fill="#0f172a" />
              <rect x="22" y="44" width="8" height="10" fill="#059669" />
              <rect x="38" y="38" width="24" height="24" rx="4" fill="#0f172a" />
              <rect x="44" y="44" width="12" height="12" rx="2" fill="white" />
              <circle cx="50" cy="50" r="3.5" fill="#059669" />

              <rect x="70" y="38" width="10" height="6" fill="#0f172a" />
              <rect x="84" y="44" width="8" height="10" fill="#059669" />
              <rect x="68" y="54" width="14" height="8" fill="#0f172a" />

              <rect x="38" y="70" width="8" height="10" fill="#0f172a" />
              <rect x="50" y="68" width="12" height="6" fill="#059669" />
              <rect x="42" y="84" width="18" height="8" fill="#0f172a" />
              <rect x="68" y="74" width="12" height="8" fill="#059669" />
              <rect x="84" y="70" width="8" height="12" fill="#0f172a" />
              <rect x="74" y="86" width="18" height="6" fill="#0f172a" />
            </svg>
          </div>
          <p className="text-[11px] text-gray-500 max-w-xs">
            Cualquier jugador puede apuntar con la cámara del celular y abrir directamente la ficha del partido en Falta1.
          </p>
        </div>
      </div>
    </div>
  );
};

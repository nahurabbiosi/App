import React, { useRef, useEffect, useState } from 'react';
import { X, Download, Share2, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { Partido } from '@/types/database';
import { formatMatchDateTime } from '@/lib/timezone';

export type InstagramStoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  partido: Partido;
};

export const InstagramStoryModal: React.FC<InstagramStoryModalProps> = ({
  isOpen,
  onClose,
  partido,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const mt = formatMatchDateTime(partido.fecha_hora);
  const spotsLeft = Math.max(0, partido.jugadores_necesarios - partido.jugadores_confirmados);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dimensions: 1080 x 1920 (Standard 9:16 Instagram Story)
    const W = 1080;
    const H = 1920;
    canvas.width = W;
    canvas.height = H;

    // 1. Background gradient (Night pitch / Deep emerald to charcoal)
    const bgGradient = ctx.createLinearGradient(0, 0, W, H);
    bgGradient.addColorStop(0, '#062817'); // Rich deep emerald
    bgGradient.addColorStop(0.4, '#091c12'); // Dark turf
    bgGradient.addColorStop(0.8, '#0b0f0d'); // Charcoal pitch
    bgGradient.addColorStop(1, '#050706'); // Deep black
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, W, H);

    // 2. Tactical pitch geometric lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.lineWidth = 4;

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 220, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 12, 0, Math.PI * 2);
    ctx.fill();

    // Center line
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();

    // Top penalty box outline
    ctx.strokeRect(W / 2 - 280, 0, 560, 240);

    // Bottom penalty box outline
    ctx.strokeRect(W / 2 - 280, H - 240, 560, 240);

    // 3. Header Logo & Brand
    ctx.textAlign = 'center';
    ctx.fillStyle = '#10b981'; // Emerald 500
    ctx.font = '900 48px system-ui, -apple-system, sans-serif';
    ctx.fillText('⚽️ FALTA1', W / 2, 160);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('LA COMUNIDAD DE FÚTBOL AMATEUR', W / 2, 205);

    // 4. Main Hero Banner ("¡FALTA 1!")
    const bannerY = 280;
    const bannerW = 860;
    const bannerH = 150;
    const bannerX = (W - bannerW) / 2;

    // Pill background
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 40);
    ctx.fill();

    ctx.fillStyle = '#062817';
    ctx.font = '900 78px system-ui, -apple-system, sans-serif';
    const missingText = spotsLeft > 1 ? `¡FALTAN ${spotsLeft} JUGADORES!` : '¡FALTA 1 PARA HOY!';
    ctx.fillText(missingText, W / 2, bannerY + 102);

    // 5. Match Card Container
    const cardY = 480;
    const cardW = 920;
    const cardH = 920;
    const cardX = (W - cardW) / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 48);
    ctx.fill();
    ctx.stroke();

    // Match Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 62px system-ui, -apple-system, sans-serif';
    const title = partido.titulo.length > 25 ? partido.titulo.slice(0, 24) + '...' : partido.titulo;
    ctx.fillText(title, W / 2, cardY + 110);

    // Subtitle / Format
    ctx.fillStyle = '#34d399'; // Emerald 400
    ctx.font = '700 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `FÚTBOL ${partido.tipo_cancha} • ${partido.genero?.toUpperCase() || 'MIXTO'} • ${partido.nivel?.toUpperCase() || 'INTERMEDIO'}`,
      W / 2,
      cardY + 175
    );

    // Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cardX + 60, cardY + 220);
    ctx.lineTo(cardX + cardW - 60, cardY + 220);
    ctx.stroke();

    // Time Big Box
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 380, cardY + 260, 760, 160, 30);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.font = '800 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('HORARIO CONFIRMADO', W / 2, cardY + 310);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 76px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${mt.displayTime} HS`, W / 2, cardY + 390);

    // Date
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '700 34px system-ui, -apple-system, sans-serif';
    ctx.fillText(mt.displayDate.toUpperCase(), W / 2, cardY + 475);

    // Location / Cancha
    ctx.fillStyle = '#34d399';
    ctx.font = '800 28px system-ui, -apple-system, sans-serif';
    ctx.fillText('📍 LUGAR Y CANCHA', W / 2, cardY + 560);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 42px system-ui, -apple-system, sans-serif';
    const canchaText = (partido.cancha || 'Cancha').length > 32
      ? (partido.cancha || 'Cancha').slice(0, 31) + '...'
      : (partido.cancha || 'Cancha');
    ctx.fillText(canchaText, W / 2, cardY + 620);

    // Price per person
    ctx.fillStyle = '#fbbf24'; // Amber 400
    ctx.font = '900 46px system-ui, -apple-system, sans-serif';
    ctx.fillText(`$${partido.precio_por_persona.toLocaleString('es-AR')} POR PERSONA`, W / 2, cardY + 710);

    // Goalie alert badge inside card if true
    if (partido.busca_arquero) {
      ctx.fillStyle = '#ef4444'; // Red 500
      ctx.beginPath();
      ctx.roundRect(W / 2 - 340, cardY + 770, 680, 80, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.fillText('🧤 ¡SE BUSCA ARQUERO/A! (JUEGA GRATIS)', W / 2, cardY + 822);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '600 28px system-ui, -apple-system, sans-serif';
      ctx.fillText('Cupos limitados • Confirmación instantánea', W / 2, cardY + 810);
    }

    // 6. Bottom QR & Call to action
    const qrBoxY = 1460;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 120, qrBoxY, 240, 240, 28);
    ctx.fill();

    // Mini QR inside canvas
    ctx.fillStyle = '#062817';
    // Draw outer corner boxes
    ctx.fillRect(W / 2 - 100, qrBoxY + 20, 60, 60);
    ctx.clearRect(W / 2 - 90, qrBoxY + 30, 40, 40);
    ctx.fillRect(W / 2 - 80, qrBoxY + 40, 20, 20);

    ctx.fillRect(W / 2 + 40, qrBoxY + 20, 60, 60);
    ctx.clearRect(W / 2 + 50, qrBoxY + 30, 40, 40);
    ctx.fillRect(W / 2 + 60, qrBoxY + 40, 20, 20);

    ctx.fillRect(W / 2 - 100, qrBoxY + 160, 60, 60);
    ctx.clearRect(W / 2 - 90, qrBoxY + 170, 40, 40);
    ctx.fillRect(W / 2 - 80, qrBoxY + 180, 20, 20);

    // Random QR modules pattern
    ctx.fillRect(W / 2 - 20, qrBoxY + 40, 30, 20);
    ctx.fillRect(W / 2 - 30, qrBoxY + 90, 60, 60);
    ctx.fillRect(W / 2 + 50, qrBoxY + 100, 30, 30);
    ctx.fillRect(W / 2 - 90, qrBoxY + 100, 40, 20);
    ctx.fillRect(W / 2 + 30, qrBoxY + 160, 40, 40);
    ctx.fillRect(W / 2 - 20, qrBoxY + 170, 30, 40);

    // Footer prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 32px system-ui, -apple-system, sans-serif';
    ctx.fillText('ESCANEÁ EL QR O RESPONDÉ ESTA STORY', W / 2, 1750);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('Descargá Falta1 en iOS y Android', W / 2, 1795);

    // Update preview url
    setPreviewUrl(canvas.toDataURL('image/png'));
  }, [isOpen, partido, mt.displayDate, mt.displayTime, spotsLeft]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setDownloading(true);
    const link = document.createElement('a');
    link.download = `story-falta1-${partido.titulo.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    setTimeout(() => {
      setDownloading(false);
    }, 1200);
  };

  const handleCopyStoryText = () => {
    const storyText = `¡Nos falta 1 para hoy a las ${mt.displayTime} hs en ${partido.cancha}! ⚽️ Cuota $${partido.precio_por_persona}. ¿Quién se suma? Respondeme y te paso el link de Falta1.`;
    navigator.clipboard.writeText(storyText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-gray-900 text-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-800 relative max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white leading-tight flex items-center gap-1.5">
              Generador de Flyer para Stories <span className="text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700">9:16 HD</span>
            </h3>
            <p className="text-xs text-gray-400">
              Imagen estilizada con mapa, horario y precio lista para compartir en Instagram.
            </p>
          </div>
        </div>

        {/* Story Canvas (Hidden or scaled down for preview) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Story Preview */}
        <div className="flex justify-center mb-5">
          <div className="relative w-52 h-[370px] rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl bg-black">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Flyer Instagram Story"
                className="w-full h-full object-cover select-none"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                Generando Story HD...
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-[9px] font-bold text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Vista Previa 1080x1920
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer text-sm"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Descargando Flyer...' : 'Descargar Flyer para Instagram (PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyStoryText}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer border border-gray-700"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedText ? '¡Texto para Story Copiado!' : 'Copiar texto sugerido para la Story'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

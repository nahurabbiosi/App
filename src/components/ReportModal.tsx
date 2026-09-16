import React, { useState, useMemo } from 'react';
import { X, Flag, AlertTriangle, ShieldCheck, CheckCircle2, Sparkles, UserX, AlertOctagon } from 'lucide-react';
import { CategoriaReporte } from '@/types/database';
import { saveReport, blockUser, analyzeOffensiveContent } from '@/lib/security';

export type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  currentUserId: string;
  matchId?: string;
  initialMessageText?: string;
  onUserBlocked?: (userId: string) => void;
};

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  currentUserId,
  matchId,
  initialMessageText = '',
  onUserBlocked,
}) => {
  const [categoria, setCategoria] = useState<CategoriaReporte>(
    initialMessageText ? 'acoso_discriminacion' : 'inasistencia_no_pago'
  );
  const [motivo, setMotivo] = useState(initialMessageText);
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Real-time AI Assisted Moderation Analysis
  const aiAnalysis = useMemo(() => {
    return analyzeOffensiveContent(motivo);
  }, [motivo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveReport({
      reportante_id: currentUserId,
      reportado_id: reportedUserId,
      partido_id: matchId,
      categoria,
      motivo: motivo.trim() || 'Sin descripción adicional',
    });

    if (alsoBlock) {
      blockUser(currentUserId, reportedUserId);
      if (onUserBlocked) onUserBlocked(reportedUserId);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                  Panel de Reporte Express
                </span>
                <h3 className="text-base font-black text-gray-900 leading-tight">
                  Reportar a {reportedUserName}
                </h3>
                <p className="text-xs text-gray-500">
                  Moderación comunitaria asistida para una convivencia honesta y deportiva.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">
                Motivo del Reporte (Reglamento de Convivencia)
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'inasistencia_no_pago',
                    label: 'Inasistencia / No pagó su parte',
                    desc: 'No asistió al partido o no transfirió su cuota correspondiente.',
                  },
                  {
                    id: 'conducta_violenta',
                    label: 'Conducta violenta, juego sucio o agresión',
                    desc: 'Violencia verbal, física o actitudes antideportivas reiteradas.',
                  },
                  {
                    id: 'acoso_discriminacion',
                    label: 'Acoso, discriminación o lenguaje ofensivo',
                    desc: 'Faltas de respeto o discriminación por género, nivel o apariencia.',
                  },
                  {
                    id: 'perfil_falso_spam',
                    label: 'Perfil falso o spam',
                    desc: 'Suplantación de identidad o publicidad no deseada.',
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      categoria === item.id
                        ? 'border-red-500 bg-red-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="categoria"
                      value={item.id}
                      checked={categoria === item.id}
                      onChange={() => setCategoria(item.id as CategoriaReporte)}
                      className="mt-0.5 text-red-600 focus:ring-red-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-900 block">{item.label}</span>
                      <span className="text-[11px] text-gray-500">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                Contenido o detalles del reporte
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explicá lo sucedido o pegá el mensaje inapropiado..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-[#121417] placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-red-500 caret-[#00E676]"
              />
            </div>

            {/* AI-Assisted Moderation Card */}
            {motivo.trim().length > 3 && (
              <div
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  aiAnalysis.es_ofensivo
                    ? aiAnalysis.severidad === 'alta'
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Moderación Asistida por IA:</span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      aiAnalysis.severidad === 'alta'
                        ? 'bg-red-200 text-red-900'
                        : aiAnalysis.severidad === 'media'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    {aiAnalysis.severidad === 'alta'
                      ? 'Infracción Crítica'
                      : aiAnalysis.severidad === 'media'
                      ? 'Lenguaje Inapropiado'
                      : 'Bajo Riesgo'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{aiAnalysis.motivo_deteccion}</p>
                <div className="mt-1.5 text-[10px] font-semibold opacity-90">
                  Acción recomendada: <strong>{aiAnalysis.accion_sugerida.replace('_', ' ').toUpperCase()}</strong>
                </div>
              </div>
            )}

            {/* Personal Blacklist toggle */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="font-bold text-gray-900 flex items-center gap-1">
                  <UserX className="w-3.5 h-3.5 text-red-600" />
                  Agregar a mi Lista Negra Personal
                </span>
                <span className="text-[11px] text-gray-500 block">
                  La app no te volverá a mostrar partidos organizados por {reportedUserName} ni te cruzará en convocatorias futuras.
                </span>
              </div>
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Confirmar Reporte</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 space-y-3 animate-in fade-in">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Reporte Procesado</h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              {alsoBlock
                ? `El reporte fue registrado y ${reportedUserName} ha sido añadido a tu Lista Negra Personal.`
                : 'El reporte fue registrado y enviado al equipo de moderación.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

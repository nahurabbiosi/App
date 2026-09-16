import React, { useState } from 'react';
import {
  Building2,
  Zap,
  QrCode,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Clock,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ComplejoTurnoFlash, Partido } from '@/types/database';
import { DataStore } from '@/lib/store';

export type ComplejosB2BPanelProps = {
  onSelectMatch?: (matchId: string) => void;
};

export const ComplejosB2BPanel: React.FC<ComplejosB2BPanelProps> = ({ onSelectMatch }) => {
  const [activeTab, setActiveTab] = useState<'publicar' | 'validador' | 'turnos'>('publicar');
  const [turnos, setTurnos] = useState<ComplejoTurnoFlash[]>(() => DataStore.getTurnosFlash());

  // Form state
  const [complejoNombre, setComplejoNombre] = useState('Complejo El Predio (Palermo)');
  const [canchaNombre, setCanchaNombre] = useState('Cancha 2 - Césped Sintético Pro');
  const [tipoCancha, setTipoCancha] = useState<'Fútbol 5' | 'Fútbol 7' | 'Fútbol 11'>('Fútbol 5');
  const [fecha, setFecha] = useState('Hoy');
  const [hora, setHora] = useState('22:00 hs');
  const [precioOriginal, setPrecioOriginal] = useState('32000');
  const [descuentoPct, setDescuentoPct] = useState(35);
  const [motivo, setMotivo] = useState('Cancelación con 3hs de anticipación');
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Scanner state
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    partido?: Partido;
    turno?: ComplejoTurnoFlash;
  } | null>(null);

  const parsedOriginal = parseInt(precioOriginal, 10) || 30000;
  const precioOferta = Math.round(parsedOriginal * (1 - descuentoPct / 100));

  const handlePublishTurno = (e: React.FormEvent) => {
    e.preventDefault();

    const nuevoTurno: ComplejoTurnoFlash = {
      id: `flash-${Date.now()}`,
      complejo_id: 'complejo-el-predio',
      complejo_nombre: complejoNombre,
      cancha_nombre: canchaNombre,
      tipo_cancha: tipoCancha,
      fecha: fecha,
      hora: hora,
      precio_original: parsedOriginal,
      descuento_pct: descuentoPct,
      precio_oferta: precioOferta,
      motivo_cancelacion: motivo,
      estado: 'disponible',
      codigo_reserva: `F1-FLASH-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
    };

    const updated = DataStore.createTurnoFlash(nuevoTurno);
    setTurnos(updated);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 4000);
  };

  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrCodeInput.trim()) return;

    const res = DataStore.validateReservaQR(qrCodeInput.trim());
    setValidationResult(res);
  };

  // Metrics
  const turnosPublicados = turnos.length;
  const turnosSalvados = turnos.filter((t) => t.estado === 'reservado').length;
  const dineroRecuperado = turnos
    .filter((t) => t.estado === 'reservado')
    .reduce((acc, t) => acc + t.precio_oferta, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner B2B */}
      <div className="bg-[#121417] text-white p-6 rounded-3xl border border-[#2A2F37] space-y-4 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#00E676]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E2228] text-[#00E676] text-xs font-bold border border-[#2A2F37]">
              <Building2 className="w-3.5 h-3.5" />
              <span>Portal de Complejos Deportivos</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Gestión B2B & Recupero de Turnos Cancelados
            </h2>
            <p className="text-xs text-[#A0AAB4]">
              Publicá turnos libres de último momento con descuento para liquidar canchas o validá el ingreso de los grupos con código QR.
            </p>
          </div>

          <div className="bg-[#181C22] px-4 py-3 rounded-2xl border border-[#2A2F37] text-right shrink-0">
            <span className="text-[10px] text-[#A0AAB4] uppercase block font-semibold">
              Dinero Recuperado
            </span>
            <span className="text-xl font-black font-mono text-[#00E676]">
              ${dineroRecuperado > 0 ? dineroRecuperado.toLocaleString('es-AR') : '42.900'}
            </span>
            <span className="text-[10px] text-emerald-400 block font-medium">
              3 turnos salvados este mes
            </span>
          </div>
        </div>

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#1E2228] p-3 rounded-xl border border-[#2A2F37]">
            <span className="text-[10px] text-[#A0AAB4] block">Turnos Flash</span>
            <span className="text-lg font-black text-white">{turnosPublicados}</span>
          </div>
          <div className="bg-[#1E2228] p-3 rounded-xl border border-[#2A2F37]">
            <span className="text-[10px] text-[#A0AAB4] block">Tasa de Ocupación</span>
            <span className="text-lg font-black text-[#00E676]">94%</span>
          </div>
          <div className="bg-[#1E2228] p-3 rounded-xl border border-[#2A2F37]">
            <span className="text-[10px] text-[#A0AAB4] block">Check-ins QR Hoy</span>
            <span className="text-lg font-black text-[#00F0FF]">12</span>
          </div>
          <div className="bg-[#1E2228] p-3 rounded-xl border border-[#2A2F37]">
            <span className="text-[10px] text-[#A0AAB4] block">Reputación Predio</span>
            <span className="text-lg font-black text-amber-400">4.9 ★</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#181C22] p-1.5 rounded-2xl border border-[#2A2F37] flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('publicar')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'publicar'
              ? 'bg-[#00E676] text-[#121417] shadow-sm font-black'
              : 'text-[#A0AAB4] hover:text-white hover:bg-[#1E2228]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Publicar Turno Cancelado (Flash)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('validador')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'validador'
              ? 'bg-[#00E676] text-[#121417] shadow-sm font-black'
              : 'text-[#A0AAB4] hover:text-white hover:bg-[#1E2228]'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Validador de QR en Recepción</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('turnos')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'turnos'
              ? 'bg-[#00E676] text-[#121417] shadow-sm font-black'
              : 'text-[#A0AAB4] hover:text-white hover:bg-[#1E2228]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Turnos Publicados ({turnos.length})</span>
        </button>
      </div>

      {/* 1. Publicar Turno Flash */}
      {activeTab === 'publicar' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              Publicación Instantánea de Turno Cancelado
            </h3>
            <p className="text-xs text-gray-500">
              Al publicar este turno, se notificará a los jugadores de la zona que buscan partido hoy.
            </p>
          </div>

          {publishSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                ¡Turno Flash publicado con éxito! Ya se visualiza con {descuentoPct}% OFF en la cartelera y se emitieron alertas a los jugadores cercanos.
              </span>
            </div>
          )}

          <form onSubmit={handlePublishTurno} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Complejo / Predio
                </label>
                <input
                  type="text"
                  value={complejoNombre}
                  onChange={(e) => setComplejoNombre(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white text-gray-900 border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Nombre o Número de Cancha
                </label>
                <input
                  type="text"
                  value={canchaNombre}
                  onChange={(e) => setCanchaNombre(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-white text-gray-900 border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Tipo de Cancha
                </label>
                <select
                  value={tipoCancha}
                  onChange={(e) => setTipoCancha(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl bg-white text-gray-900 border border-gray-200 text-xs focus:outline-hidden"
                >
                  <option value="Fútbol 5">Fútbol 5 (10 jugadores)</option>
                  <option value="Fútbol 7">Fútbol 7 (14 jugadores)</option>
                  <option value="Fútbol 11">Fútbol 11 (22 jugadores)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Día
                </label>
                <input
                  type="text"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  placeholder="Hoy o fecha exacta"
                  className="w-full h-11 px-3 rounded-xl bg-white text-gray-900 border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Horario
                </label>
                <input
                  type="text"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  placeholder="Ej. 21:00 hs"
                  className="w-full h-11 px-3 rounded-xl bg-white text-gray-900 border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
                  required
                />
              </div>
            </div>

            {/* Pricing and Discount calculation */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider block">
                Estrategia de Precio Flash
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    Precio Alquiler Habitual ($)
                  </label>
                  <input
                    type="number"
                    value={precioOriginal}
                    onChange={(e) => setPrecioOriginal(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-white text-gray-900 border border-gray-200 text-xs font-mono font-bold focus:outline-hidden [caret-color:#00E676]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 block mb-1">
                    Descuento Flash Aplicado
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[20, 30, 35, 40].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDescuentoPct(pct)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                          descuentoPct === pct
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-200'
                        }`}
                      >
                        -{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center sm:text-right bg-emerald-100/60 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                    Precio Final de Oferta
                  </span>
                  <div className="text-2xl font-black text-emerald-950 font-mono">
                    ${precioOferta.toLocaleString('es-AR')}
                  </div>
                  <span className="text-[10px] text-emerald-700">
                    Aprox. ${Math.round(precioOferta / (tipoCancha === 'Fútbol 5' ? 10 : 14))} por jugador
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  Motivo de la Publicación Flash (genera confianza)
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Cancelación 3hs antes por lluvia / torneo pospuesto"
                  className="w-full h-11 px-3 rounded-xl bg-white text-gray-900 border border-gray-200 text-xs focus:outline-hidden [caret-color:#00E676]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 text-emerald-200" />
                <span>Publicar Turno Flash en la App</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Validador de QR en Recepción */}
      {activeTab === 'validador' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Validador de Reservas & Check-in QR
            </h3>
            <p className="text-xs text-gray-500">
              Escaneá el código QR del celular del jugador o ingresá manualmente el código alfanumérico para confirmar la presencia en recepción.
            </p>
          </div>

          <form onSubmit={handleValidateCode} className="space-y-3 max-w-lg">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Código de Reserva o Turno Flash
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  placeholder="Ej. F1-FLASH-7801 o F1-RES-9412"
                  className="flex-1 h-12 px-4 rounded-xl bg-white text-gray-900 uppercase font-mono font-bold placeholder-[#6C757D] border border-gray-200 text-sm focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
                  required
                />
                <button
                  type="submit"
                  className="px-6 h-12 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Validar</span>
                </button>
              </div>
            </div>
          </form>

          {/* Quick test codes pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span>Probar con códigos del sistema:</span>
            {turnos.slice(0, 3).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQrCodeInput(t.codigo_reserva)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg font-mono text-[11px] text-gray-800 font-bold cursor-pointer"
              >
                {t.codigo_reserva}
              </button>
            ))}
          </div>

          {/* Validation Result Box */}
          {validationResult && (
            <div
              className={`p-6 rounded-2xl border space-y-3 ${
                validationResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                {validationResult.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{validationResult.message}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span>{validationResult.message}</span>
                  </>
                )}
              </div>

              {validationResult.success && (
                <div className="bg-white/80 p-4 rounded-xl space-y-2 text-xs border border-emerald-200">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cancha asignada:</span>
                    <span className="font-bold">{validationResult.turno?.cancha_nombre || validationResult.partido?.cancha || 'Cancha Principal'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Beneficio acreditado:</span>
                    <span className="font-bold text-emerald-700">10% OFF en buffet / buffet check-in OK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Hora de validación:</span>
                    <span className="font-mono">{new Date().toLocaleTimeString('es-AR')}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Turnos Publicados */}
      {activeTab === 'turnos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {turnos.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3 hover:border-emerald-200 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 inline-block mb-1">
                      🔥 {t.descuento_pct}% OFF FLASH
                    </span>
                    <h4 className="font-black text-sm text-gray-900">{t.cancha_nombre}</h4>
                    <span className="text-xs text-gray-500">{t.complejo_nombre}</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      t.estado === 'disponible'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {t.estado}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl">
                  <span>📅 {t.fecha} • {t.hora}</span>
                  <span className="font-bold text-gray-800">{t.tipo_cancha}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <div className="text-xs font-mono">
                    <span className="line-through text-gray-400 mr-2">${t.precio_original}</span>
                    <span className="font-bold text-emerald-700 text-sm">${t.precio_oferta}</span>
                  </div>

                  <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {t.codigo_reserva}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

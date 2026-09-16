import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldAlert,
  Search,
  Check,
  Globe,
  Lock,
  Zap,
} from 'lucide-react';
import { DataStore } from '@/lib/store';
import { FREQUENT_COMPLEXES } from '@/lib/mockData';
import { GeneroPartido, NivelPartido, ServicioCancha } from '@/types/database';
import { LocationSearch } from './LocationSearch';
import { DynamicInteractiveMap } from './DynamicInteractiveMap';
import { LocationResult, reverseGeocodeGlobal } from '@/lib/geoService';
import { toISOUTC, getDeviceTimezone } from '@/lib/timezone';

export type CreateMatchProps = {
  onSuccess: (matchId: string) => void;
  onCancel: () => void;
  onOpenAuthModal?: () => void;
  userCoords?: { latitude: number; longitude: number } | null;
};

export const CreateMatch: React.FC<CreateMatchProps> = ({ onSuccess, onCancel, onOpenAuthModal, userCoords }) => {
  const currentUser = DataStore.getCurrentUser();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [titulo, setTitulo] = useState('Fútbol 5 nocturno');
  const [cancha, setCancha] = useState('Complejo El Predio - Palermo');
  const [lat, setLat] = useState<number>(-34.5802);
  const [lng, setLng] = useState<number>(-58.4233);

  // Date
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(20, 0, 0, 0);
  const [fechaHora, setFechaHora] = useState(tomorrow.toISOString().slice(0, 16));

  // Format & Rules
  const [tipoCancha, setTipoCancha] = useState('5');
  const [genero, setGenero] = useState<GeneroPartido>('mixto');
  const [nivel, setNivel] = useState<NivelPartido>('intermedio');
  const [servicios, setServicios] = useState<ServicioCancha[]>(['sintetico', 'vestuarios']);
  const [tercerTiempo, setTercerTiempo] = useState(true);

  // Pricing & Goalkeeper
  const [precioTotal, setPrecioTotal] = useState(30000);
  const [jugadoresNecesarios, setJugadoresNecesarios] = useState(10);
  const [buscaArquero, setBuscaArquero] = useState(true);
  const [arqueroGratis, setArqueroGratis] = useState(true);
  const [busquedaUrgenteArquero, setBusquedaUrgenteArquero] = useState(false);

  // Privacy & Access
  const [privado, setPrivado] = useState(false);

  // Payment
  const [medioPago, setMedioPago] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [aliasCvu, setAliasCvu] = useState('futbol.juntada.mp');
  const [notas, setNotas] = useState('Traer camiseta clara y oscura. ¡Tercer tiempo con pizzas al terminar!');
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived price per person
  const precioPorPersona = Math.round(precioTotal / (jugadoresNecesarios || 10));

  // Global Places Autocomplete Selection (International / Worldwide)
  const handleSelectGlobalLocation = (loc: LocationResult) => {
    setCancha(loc.formattedAddress ? `${loc.name} (${loc.formattedAddress})` : loc.name);
    setLat(loc.lat);
    setLng(loc.lng);
  };

  // Reverse geocoding when user clicks anywhere on the dynamic map
  const handleMapCoordinatesChange = async (coords: { lat: number; lng: number }) => {
    setLat(coords.lat);
    setLng(coords.lng);
    try {
      const geo = await reverseGeocodeGlobal(coords.lat, coords.lng);
      setCancha(`${geo.name} - ${geo.formattedAddress}`);
    } catch {
      setCancha(`Cancha (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
    }
  };

  // Quick complex picker
  const handleSelectComplex = (complex: (typeof FREQUENT_COMPLEXES)[0]) => {
    setCancha(`${complex.nombre} - ${complex.direccion}`);
    setLat(complex.lat);
    setLng(complex.lng);
    setTipoCancha(complex.tipo);
    setPrecioTotal(complex.precioSugerido);
    setServicios([...complex.servicios]);
    if (complex.tipo === '5') setJugadoresNecesarios(10);
    if (complex.tipo === '7') setJugadoresNecesarios(14);
    if (complex.tipo === '11') setJugadoresNecesarios(22);
  };

  // Quick date presets
  const handleDatePreset = (preset: 'hoy' | 'manana' | 'sabado') => {
    const d = new Date();
    if (preset === 'hoy') {
      d.setHours(21, 0, 0, 0);
    } else if (preset === 'manana') {
      d.setDate(d.getDate() + 1);
      d.setHours(20, 0, 0, 0);
    } else if (preset === 'sabado') {
      const day = d.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      d.setHours(17, 0, 0, 0);
    }
    setFechaHora(d.toISOString().slice(0, 16));
  };

  // Format changes update default players
  const handleFormatChange = (fmt: string) => {
    setTipoCancha(fmt);
    if (fmt === '5') {
      setJugadoresNecesarios(10);
      setPrecioTotal(30000);
    } else if (fmt === '7') {
      setJugadoresNecesarios(14);
      setPrecioTotal(42000);
    } else if (fmt === '8') {
      setJugadoresNecesarios(16);
      setPrecioTotal(48000);
    } else if (fmt === '11') {
      setJugadoresNecesarios(22);
      setPrecioTotal(66000);
    }
  };

  const toggleServicio = (srv: ServicioCancha) => {
    if (servicios.includes(srv)) {
      setServicios(servicios.filter((s) => s !== srv));
    } else {
      setServicios([...servicios, srv]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const match = await DataStore.createPartido({
        creador_id: currentUser.id,
        titulo,
        cancha,
        lat,
        lng,
        fecha_hora: toISOUTC(fechaHora),
        jugadores_necesarios: jugadoresNecesarios,
        tipo_cancha: tipoCancha,
        notas,
        genero,
        nivel,
        precio_total: precioTotal,
        precio_por_persona: precioPorPersona,
        busca_arquero: buscaArquero,
        arquero_gratis: arqueroGratis,
        busqueda_urgente_arquero: busquedaUrgenteArquero || buscaArquero,
        privado,
        servicios,
        tercer_tiempo: tercerTiempo,
        medio_pago: medioPago,
        alias_cvu: medioPago === 'transferencia' ? aliasCvu : null,
      });

      if (guardarPlantilla) {
        DataStore.saveTemplate({
          nombre: `Plantilla ${cancha}`,
          cancha,
          lat,
          lng,
          tipo_cancha: tipoCancha,
          genero,
          nivel,
          servicios,
          precio_total: precioTotal,
        });
      }

      onSuccess(match.id);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  // Identity verification gate (executed after all hooks)
  if (!currentUser.telefono_verificado) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-7 border border-amber-200 shadow-sm text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold uppercase text-amber-700 tracking-wider">
            Requisito de Seguridad Comunitario
          </span>
          <h2 className="text-xl font-black text-gray-900">
            Verificación de Identidad Requerida
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Para organizar y publicar partidos en Juntada Fútbol, debés tener tu identidad verificada por teléfono celular (OTP). Esto garantiza la confianza y seriedad en las convocatorias.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md transition-colors cursor-pointer"
          >
            Validar mi Celular con Código OTP →
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
      {/* Wizard Step Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Paso {step} de 4
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              {step === 1 && '¿Dónde y cuándo jugamos?'}
              {step === 2 && 'Formato y reglas de juego'}
              {step === 3 && 'Costos, cupos y arquero/a'}
              {step === 4 && 'Cobro y confirmación final'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-gray-400 hover:text-gray-600"
          >
            Cancelar
          </button>
        </div>

        {/* Step bars */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'bg-emerald-500' : 'bg-gray-100'
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Dónde y Cuándo */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Título del Partido
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Fútbol 5 nocturno en Palermo"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#121417] placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white caret-[#00E676]"
                required
              />
            </div>

            {/* Global Places Autocomplete & Dynamic Interactive Map */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Complejo / Cancha (Geocodificación Internacional)
                </label>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-emerald-600" /> Búsqueda Global
                </span>
              </div>

              {/* Global Autocomplete Search (No country:ar limitation) */}
              <LocationSearch
                onSelectLocation={handleSelectGlobalLocation}
                userCoords={userCoords}
                placeholder="Buscá tu cancha o complejo deportivo en cualquier país..."
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Frecuentes:</span>
                {FREQUENT_COMPLEXES.slice(0, 3).map((cmp) => (
                  <button
                    key={cmp.nombre}
                    type="button"
                    onClick={() => handleSelectComplex(cmp)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      cancha.startsWith(cmp.nombre)
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {cmp.nombre.split(' (')[0]}
                  </button>
                ))}
              </div>

              {/* Selected / Confirmed Address Field */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Nombre y Ubicación confirmada:
                </label>
                <input
                  type="text"
                  value={cancha}
                  onChange={(e) => setCancha(e.target.value)}
                  placeholder="Nombre o dirección del complejo"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#121417] placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white caret-[#00E676]"
                  required
                />
              </div>

              {/* Dynamic Interactive Map with Animated Camera & Click-to-Pin */}
              <div className="space-y-1">
                <DynamicInteractiveMap
                  selectedLocation={{ lat, lng, name: cancha }}
                  userCoords={userCoords}
                  onCoordinatesChange={handleMapCoordinatesChange}
                  height="220px"
                  zoom={15}
                />
              </div>
            </div>

            {/* Date and Time with Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 uppercase">
                  Fecha y Hora
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleDatePreset('hoy')}
                    className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md"
                  >
                    Hoy 21:00
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset('manana')}
                    className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md"
                  >
                    Mañana 20:00
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDatePreset('sabado')}
                    className="text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md"
                  >
                    Sábado
                  </button>
                </div>
              </div>

              <input
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#121417] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white caret-[#00E676]"
                required
              />
              <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>
                  Huso horario local: <strong className="text-gray-700">{getDeviceTimezone().timezone} ({getDeviceTimezone().offsetLabel})</strong>. Los jugadores de otros países verán la hora convertida automáticamente a su zona horaria.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: Formato y Reglas */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            {/* Format: 5, 7, 8, 11 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Formato de Cancha
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '5', label: 'Fútbol 5', players: '10 jug.' },
                  { id: '7', label: 'Fútbol 7', players: '14 jug.' },
                  { id: '8', label: 'Fútbol 8', players: '16 jug.' },
                  { id: '11', label: 'Fútbol 11', players: '22 jug.' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => handleFormatChange(fmt.id)}
                    className={`py-3 px-2 rounded-2xl border text-center transition-all ${
                      tipoCancha === fmt.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-2 ring-emerald-500/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="block text-sm">{fmt.label}</span>
                    <span className="text-[10px] text-gray-500">{fmt.players}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gender filter */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Filtro de Género
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mixto', label: 'Mixto', desc: 'Abierto a todos/as' },
                  { id: 'femenino', label: 'Femenino', desc: 'Exclusivo mujeres' },
                  { id: 'masculino', label: 'Masculino', desc: 'Exclusivo varones' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGenero(g.id as GeneroPartido)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                      genero === g.id
                        ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="block text-xs font-bold">{g.label}</span>
                    <span className="text-[10px] text-gray-500">{g.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Competitive Level */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Nivel de Competitividad
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'recreativo', label: 'Recreativo', desc: 'Para divertirse' },
                  { id: 'intermedio', label: 'Intermedio', desc: 'Buen ritmo' },
                  { id: 'competitivo', label: 'Competitivo', desc: 'Picadito picado' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setNivel(lvl.id as NivelPartido)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all ${
                      nivel === lvl.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="block text-xs font-bold">{lvl.label}</span>
                    <span className="text-[10px] text-gray-500">{lvl.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch Services & Third Time */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Comodidades y Tercer Tiempo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'techada', label: '☂️ Cancha Techada' },
                  { id: 'sintetico', label: '🌱 Césped Sintético' },
                  { id: 'vestuarios', label: '🚿 Vestuarios / Duchas' },
                  { id: 'estacionamiento', label: '🚗 Estacionamiento' },
                ].map((srv) => (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => toggleServicio(srv.id as ServicioCancha)}
                    className={`p-2 rounded-xl border text-left text-xs font-medium transition-all ${
                      servicios.includes(srv.id as ServicioCancha)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    {srv.label}
                  </button>
                ))}
              </div>

              {/* Tercer tiempo toggle */}
              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-200">
                <div>
                  <span className="text-xs font-bold text-orange-900 block">🍻 Tercer Tiempo</span>
                  <span className="text-[11px] text-orange-700">Pizzas o birras después del partido</span>
                </div>
                <input
                  type="checkbox"
                  checked={tercerTiempo}
                  onChange={(e) => setTercerTiempo(e.target.checked)}
                  className="w-5 h-5 accent-orange-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Costos y Arquero */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            {/* Live Pricing Calculator */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Calculadora de Costos en Vivo
              </span>

              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Costo Total Cancha ($)
                  </label>
                  <input
                    type="number"
                    value={precioTotal}
                    onChange={(e) => setPrecioTotal(Number(e.target.value))}
                    step="1000"
                    min="5000"
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 caret-[#00E676]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Cupos a Dividir
                  </label>
                  <input
                    type="number"
                    value={jugadoresNecesarios}
                    onChange={(e) => setJugadoresNecesarios(Number(e.target.value))}
                    min="4"
                    max="30"
                    className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-black text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 caret-[#00E676]"
                  />
                </div>
              </div>

              {/* Calculated Output */}
              <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center justify-between">
                <span className="text-xs text-emerald-800 font-semibold">Costo por Persona:</span>
                <span className="text-2xl font-black text-emerald-950">
                  ${precioPorPersona.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Goalkeeper Inclusion & Urgent Search */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-900 block">🧤 Se busca Arquero/a</span>
                  <span className="text-xs text-gray-500">
                    Destacar en la tarjeta para convocar arqueros/as rápidamente
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={buscaArquero}
                  onChange={(e) => setBuscaArquero(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {buscaArquero && (
                <div className="space-y-2.5 pt-1">
                  <div className="pl-3 border-l-2 border-amber-400 flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-medium">¿El arquero/a juega gratis?</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setArqueroGratis(true)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs ${
                          arqueroGratis ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Sí, juega gratis
                      </button>
                      <button
                        type="button"
                        onClick={() => setArqueroGratis(false)}
                        className={`px-3 py-1 rounded-lg font-bold text-xs ${
                          !arqueroGratis ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        No, paga normal
                      </button>
                    </div>
                  </div>

                  {/* Urgent Goalie Push Notification Toggle */}
                  <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-red-950 block">
                          Búsqueda Urgente de Arquero/a (Push Prioritario)
                        </span>
                        <span className="text-[10px] text-red-700">
                          Envía alertas a arqueros/as registrados y jugadores en un radio de 5 km
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={busquedaUrgenteArquero}
                      onChange={(e) => setBusquedaUrgenteArquero(e.target.checked)}
                      className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Cobro y Publicación */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            {/* Match Mode: Public vs Private */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Visibilidad y Acceso al Partido
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrivado(false)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    !privado
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-1">
                    <Globe className="w-4 h-4" />
                    <span>Partido Público</span>
                  </div>
                  <span className="text-[11px] text-gray-600 block leading-tight">
                    Abierto a toda la comunidad de Falta1 (feed, mapa y búsqueda).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivado(true)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    privado
                      ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-xs ring-2 ring-amber-500/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-1">
                    <Lock className="w-4 h-4" />
                    <span>Partido Privado</span>
                  </div>
                  <span className="text-[11px] text-gray-600 block leading-tight">
                    Cerrado para amigos. Solo se ingresa con enlace o código de acceso.
                  </span>
                </button>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Medio de Cobro de la Seña / Pago
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => setMedioPago('transferencia')}
                  className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                    medioPago === 'transferencia'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <span className="block font-bold">💳 Transferencia previa</span>
                  <span className="text-[11px] text-gray-500">Mercado Pago / CVU / Alias</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMedioPago('efectivo')}
                  className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                    medioPago === 'efectivo'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  <span className="block font-bold">💵 Efectivo en la cancha</span>
                  <span className="text-[11px] text-gray-500">Se paga en el complejo</span>
                </button>
              </div>

              {medioPago === 'transferencia' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Tu Alias o CVU de Cobro
                  </label>
                  <input
                    type="text"
                    value={aliasCvu}
                    onChange={(e) => setAliasCvu(e.target.value)}
                    placeholder="ej: nahuel.futbol.mp o 00000031000..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[#121417] placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white caret-[#00E676]"
                  />
                  <span className="text-[11px] text-gray-500 block mt-1">
                    Los jugadores podrán copiar este alias con 1 clic para transferirte su parte.
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Notas y Aclaraciones para los Jugadores
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                placeholder="Indumentaria, balones, estacionamiento, etc."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-[#121417] placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white caret-[#00E676]"
              />
            </div>

            {/* Save as template */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="template-check"
                checked={guardarPlantilla}
                onChange={(e) => setGuardarPlantilla(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <label htmlFor="template-check" className="text-xs font-semibold text-gray-700 cursor-pointer">
                Guardar esta cancha y configuración como plantilla frecuente
              </label>
            </div>

            {/* Summary preview badge */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/70 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-emerald-950">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Resumen del Partido:
              </div>
              <p>
                {titulo} • Fútbol {tipoCancha} • {genero} • ${precioPorPersona.toLocaleString('es-AR')} por jugador.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Navigation Buttons */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-1 transition-colors shadow-sm"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm px-8 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              {isSubmitting ? 'Publicando partido...' : 'Publicar Partido ⚽'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

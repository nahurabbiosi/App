import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw,
  Plus,
  Compass,
  User,
  LogIn,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  ArrowUpDown,
  ShieldCheck,
  Award,
  Bell,
  MessageSquare,
  ChevronDown,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Partido, Usuario } from '@/types/database';
import { DataStore, calculateDistanceKm } from '@/lib/store';
import { MatchCard } from '@/components/MatchCard';
import { MatchDetail } from '@/components/MatchDetail';
import { CreateMatch } from '@/components/CreateMatch';
import { MapScreen } from '@/components/MapScreen';
import { ProfileScreen } from '@/components/ProfileScreen';
import { ChatsScreen } from '@/components/ChatsScreen';
import { NotificationsModal } from '@/components/NotificationsModal';
import { AuthModal } from '@/components/AuthModal';
import { GoogleMapsWrapper } from '@/components/GoogleMapsWrapper';
import { WaitlistBanner } from '@/components/WaitlistBanner';

type Tab = 'partidos' | 'mapa' | 'chats' | 'perfil' | 'crear';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('partidos');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Usuario>(DataStore.getCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'verify_phone'>('login');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationsTick, setNotificationsTick] = useState(0);
  const [justVerified, setJustVerified] = useState(false);

  // User location (default to Palermo, Buenos Aires coordinates)
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>({
    latitude: -34.5802,
    longitude: -58.4233,
  });

  // Location selector state
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Palermo, CABA');
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(5);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('todos');
  const [filterGenero, setFilterGenero] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterNivel, setFilterNivel] = useState<string>('all');
  const [filterFeature, setFilterFeature] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'fecha' | 'precio' | 'distancia'>('fecha');

  // Quota Exceeded listener
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Request browser geolocation if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          // Keep default Palermo
        },
        { timeout: 8000 }
      );
    }
  }, []);

  const loadPartidos = async () => {
    const data = await DataStore.fetchPartidos();
    setPartidos(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadPartidos();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPartidos();
  };

  const handleMatchCreated = (newMatchId: string) => {
    loadPartidos();
    setSelectedMatchId(newMatchId);
    setActiveTab('partidos');
  };

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setActiveTab('partidos');
  };

  // Guard function for Create Match: requires telefono_verificado
  const handleAttemptCreateMatch = () => {
    if (!currentUser.telefono_verificado) {
      setAuthInitialMode('verify_phone');
      setIsAuthOpen(true);
      return;
    }
    setSelectedMatchId(null);
    setActiveTab('crear');
  };

  // Enforce guard if user tries to reach create tab without verified phone
  useEffect(() => {
    if (activeTab === 'crear' && !currentUser.telefono_verificado) {
      setActiveTab('partidos');
      setAuthInitialMode('verify_phone');
      setIsAuthOpen(true);
    }
  }, [activeTab, currentUser.telefono_verificado]);

  // Notifications calculation
  const notifications = useMemo(() => {
    return DataStore.getNotifications(currentUser.id);
  }, [currentUser.id, notificationsTick]);

  const unreadCount = notifications.filter((n) => !n.leido).length;

  // Apply Quick Filter chips
  const handleSelectQuickFilter = (filterKey: string) => {
    setQuickFilter(filterKey);
    if (filterKey === 'todos') {
      setFilterFormat('all');
      setFilterGenero('all');
      setFilterFeature('all');
    } else if (filterKey === 'f5') {
      setFilterFormat('5');
      setFilterGenero('all');
      setFilterFeature('all');
    } else if (filterKey === 'f7') {
      setFilterFormat('7');
      setFilterGenero('all');
      setFilterFeature('all');
    } else if (filterKey === 'femenino') {
      setFilterFormat('all');
      setFilterGenero('femenino');
      setFilterFeature('all');
    } else if (filterKey === 'mixto') {
      setFilterFormat('all');
      setFilterGenero('mixto');
      setFilterFeature('all');
    } else if (filterKey === 'arquero') {
      setFilterFormat('all');
      setFilterGenero('all');
      setFilterFeature('arquero');
    }
  };

  // Filter and sort logic
  const filteredAndSortedPartidos = useMemo(() => {
    return partidos
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.titulo.toLowerCase().includes(q);
          const matchCancha = (p.cancha || '').toLowerCase().includes(q);
          if (!matchTitle && !matchCancha) return false;
        }

        // Genero
        if (filterGenero !== 'all' && p.genero !== filterGenero) return false;

        // Formato
        if (filterFormat !== 'all' && p.tipo_cancha !== filterFormat) return false;

        // Nivel
        if (filterNivel !== 'all' && p.nivel !== filterNivel) return false;

        // Special Features
        if (filterFeature === 'arquero' && !p.busca_arquero) return false;
        if (filterFeature === 'tercer_tiempo' && !p.tercer_tiempo) return false;
        if (filterFeature === 'techada' && !p.servicios?.includes('techada')) return false;

        // Radius filter if coords available
        if (userCoords && p.lat && p.lng && selectedRadiusKm < 999) {
          const dist = calculateDistanceKm(userCoords.latitude, userCoords.longitude, p.lat, p.lng);
          if (dist > selectedRadiusKm) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'precio') {
          return (a.precio_por_persona || 0) - (b.precio_por_persona || 0);
        }
        if (sortBy === 'distancia' && userCoords) {
          const distA =
            a.lat && a.lng
              ? calculateDistanceKm(userCoords.latitude, userCoords.longitude, a.lat, a.lng)
              : 9999;
          const distB =
            b.lat && b.lng
              ? calculateDistanceKm(userCoords.latitude, userCoords.longitude, b.lat, b.lng)
              : 9999;
          return distA - distB;
        }
        // Default by date
        return new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime();
      });
  }, [
    partidos,
    searchQuery,
    filterGenero,
    filterFormat,
    filterNivel,
    filterFeature,
    sortBy,
    userCoords,
    selectedRadiusKm,
  ]);

  return (
    <GoogleMapsWrapper>
      <div className="min-h-screen bg-[#121417] text-white flex flex-col font-sans selection:bg-[#00F0FF]/30 selection:text-white">
        {/* Tier 1 / Tier 2 Quota Exceeded Sticky Banner */}
        {quotaExceeded && (
          <div className="bg-amber-950/80 border-b border-amber-600 text-amber-200 px-4 py-2 text-xs text-center sticky top-0 z-50">
            <span>
              Google Maps Platform quota reached. Para continuar sin interrupciones, revisá las credenciales en tu cuenta.
            </span>
          </div>
        )}

        {/* 1. Header de la Aplicación: Falta1 Brand + Notificaciones + Perfil */}
        <header className="sticky top-0 z-40 bg-[#121417]/95 backdrop-blur-md border-b border-[#1E2228] shadow-md">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Isologotipo Falta1 */}
            <button
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('partidos');
              }}
              className="flex items-center gap-2 cursor-pointer text-left group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">⚽</span>
              <div className="falta1-brand flex items-baseline">
                <span className="text-2xl font-black italic tracking-tighter text-white">
                  Falta
                </span>
                <span className="text-2xl font-black italic tracking-tighter text-[#00F0FF] ml-0.5">
                  1
                </span>
                <span className="text-[9px] uppercase font-black tracking-widest text-[#00F0FF]/70 ml-2 hidden sm:inline">
                  FÚTBOL AMATEUR
                </span>
              </div>
            </button>

            {/* Right actions: Notification bell & User status pill */}
            <div className="flex items-center gap-2.5">
              {/* Notification Bell */}
              <button
                id="btn-notifications-header"
                onClick={() => setShowNotificationsModal(true)}
                className="relative p-2 rounded-xl bg-[#1E2228] hover:bg-[#282D35] text-gray-300 hover:text-white border border-[#2A2F37] transition-colors cursor-pointer"
                title="Notificaciones de partidos"
              >
                <Bell className="w-4 h-4 text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00F0FF] text-[#121417] text-[9px] font-black flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User profile button */}
              <button
                onClick={() => setActiveTab('perfil')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E2228] text-white text-xs font-bold border border-[#2A2F37] hover:border-[#00F0FF]/50 transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-[#0F4C3A] text-[#00F0FF] flex items-center justify-center text-[10px] font-extrabold border border-[#1b6a52]">
                  {currentUser.nombre.charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-[110px] truncate">{currentUser.nombre.split(' ')[0]}</span>
                <span className="text-[10px] text-[#00F0FF] font-bold">
                  {currentUser.asistencia_pct || 98}% asist.
                </span>
              </button>

              {/* Auth Login Trigger */}
              <button
                onClick={() => {
                  setAuthInitialMode('login');
                  setIsAuthOpen(true);
                }}
                className="p-2 text-[#A0AAB4] hover:text-white rounded-xl bg-[#1E2228] hover:bg-[#282D35] border border-[#2A2F37] transition-colors cursor-pointer"
                title="Cuenta / Iniciar Sesión"
              >
                <LogIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Global Waitlist Priority Banner */}
        <WaitlistBanner
          currentUser={currentUser}
          onOpenMatch={(id) => {
            setSelectedMatchId(id);
            setActiveTab('partidos');
          }}
          onRefresh={loadPartidos}
        />

        {/* Barra de Ubicación en Gris Grafito (#1E2228) */}
        <div className="bg-[#1E2228] border-b border-[#2A2F37] py-2 px-4 relative z-30">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
            <div className="relative">
              <button
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                className="flex items-center gap-1.5 font-bold text-gray-200 hover:text-[#00F0FF] transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>
                  {selectedNeighborhood} (a menos de {selectedRadiusKm === 999 ? 'Todo' : `${selectedRadiusKm} km`})
                </span>
                <ChevronDown className="w-3 h-3 text-[#A0AAB4]" />
              </button>

              {/* Dropdown for Neighborhood & Radius */}
              {isLocationDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-[#1E2228] border border-[#2A2F37] rounded-2xl p-3 shadow-2xl z-50 space-y-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#A0AAB4] uppercase tracking-wider block mb-1.5">
                      Radio de búsqueda:
                    </span>
                    <div className="grid grid-cols-4 gap-1">
                      {[2, 5, 10, 999].map((km) => (
                        <button
                          key={km}
                          onClick={() => {
                            setSelectedRadiusKm(km);
                            setIsLocationDropdownOpen(false);
                          }}
                          className={`py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                            selectedRadiusKm === km
                              ? 'bg-[#0F4C3A] text-white border-[#00F0FF]/40'
                              : 'bg-[#121417] text-gray-400 border-[#2A2F37] hover:text-white'
                          }`}
                        >
                          {km === 999 ? 'Todos' : `${km} km`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#2A2F37]">
                    <span className="text-[10px] font-extrabold text-[#A0AAB4] uppercase tracking-wider block mb-1.5">
                      Barrio o Zona:
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {[
                        { label: 'Palermo, CABA', lat: -34.5802, lng: -58.4233 },
                        { label: 'Caballito, CABA', lat: -34.6186, lng: -58.4438 },
                        { label: 'Belgrano, CABA', lat: -34.5614, lng: -58.4563 },
                        { label: 'Colegiales, CABA', lat: -34.5768, lng: -58.4514 },
                        { label: 'Villa Crespo, CABA', lat: -34.5975, lng: -58.4385 },
                        { label: 'San Isidro, GBA Norte', lat: -34.4721, lng: -58.5284 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            setSelectedNeighborhood(item.label);
                            setUserCoords({ latitude: item.lat, longitude: item.lng });
                            setIsLocationDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            selectedNeighborhood === item.label
                              ? 'bg-[#0F4C3A] text-white font-bold'
                              : 'text-gray-300 hover:bg-[#121417]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <span className="text-[11px] text-[#A0AAB4] font-medium hidden sm:inline">
              Falta1 busca partidos cerca tuyo en tiempo real
            </span>
          </div>
        </div>

        {/* Identity Verification Alerts: Success Animation or Pending Notice */}
        <AnimatePresence>
          {justVerified ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#0F4C3A] text-white border-b border-[#00F0FF]/40 px-4 py-3 text-xs shadow-lg relative z-20"
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#00F0FF] text-[#121417] flex items-center justify-center font-black shrink-0">
                    ✓
                  </div>
                  <div>
                    <span className="font-extrabold text-sm block">
                      ¡Celular Verificado con Éxito!
                    </span>
                    <span className="text-emerald-200 text-xs">
                      Tu número {currentUser.telefono} fue autenticado. Acceso total concedido para crear y jugar.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setJustVerified(false)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          ) : !currentUser.telefono_verificado ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#1E2228] border-b border-amber-500/30 text-amber-200 px-4 py-2.5 text-xs relative z-20"
            >
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <span className="font-extrabold text-amber-300">
                    ⚠️ Identidad pendiente de validación:
                  </span>
                  <span className="text-gray-300 hidden sm:inline">
                    Para sumarte a partidos u organizar convocatorias debés verificar tu celular con código OTP.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthInitialMode('verify_phone');
                    setIsAuthOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#0F4C3A] hover:bg-[#135f49] text-white font-bold rounded-xl text-xs border border-[#1b6a52] transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  Validar Celular con OTP →
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 mb-24 sm:mb-12">
          <AnimatePresence mode="wait">
            {/* Match Detail View */}
            {selectedMatchId && activeTab === 'partidos' ? (
              <motion.div
                key={`match-detail-${selectedMatchId}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <MatchDetail
                  matchId={selectedMatchId}
                  userCoords={userCoords}
                  onOpenAuthModal={() => {
                    setAuthInitialMode('verify_phone');
                    setIsAuthOpen(true);
                  }}
                  onBack={() => {
                    setSelectedMatchId(null);
                    loadPartidos();
                  }}
                />
              </motion.div>
            ) : activeTab === 'partidos' ? (
              <motion.div
                key="tab-partidos"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Pastillas de Filtro Rápido (Chips con scroll horizontal) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { key: 'todos', label: 'Todos' },
                    { key: 'f5', label: 'Fútbol 5' },
                    { key: 'f7', label: 'Fútbol 7' },
                    { key: 'femenino', label: 'Exclusivo Femenino' },
                    { key: 'mixto', label: 'Mixto' },
                    { key: 'arquero', label: '🧤 Se busca arquero/a' },
                  ].map((chip) => (
                    <button
                      key={chip.key}
                      onClick={() => handleSelectQuickFilter(chip.key)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                        quickFilter === chip.key
                          ? 'bg-[#0F4C3A] text-white border-[#00F0FF]/50 shadow-md'
                          : 'bg-[#1E2228] text-gray-300 border-[#2A2F37] hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar & Sort Dropdown */}
                <div className="bg-[#1E2228] rounded-2xl p-3 border border-[#2A2F37] shadow-sm flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#A0AAB4] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por complejo, barrio o cancha (ej: Palermo, La Masía, Techada)..."
                      className="w-full bg-[#121417] border border-[#2A2F37] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-[#A0AAB4] focus:outline-none focus:border-[#00F0FF] transition-all caret-[#00E676]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#121417] px-3 py-1.5 rounded-xl border border-[#2A2F37] text-xs font-semibold text-gray-300">
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#A0AAB4]" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent border-none text-xs font-bold text-white focus:outline-none cursor-pointer"
                      >
                        <option value="fecha" className="bg-[#1E2228] text-white">
                          Próxima Fecha
                        </option>
                        <option value="precio" className="bg-[#1E2228] text-white">
                          Menor Precio
                        </option>
                        <option value="distancia" className="bg-[#1E2228] text-white">
                          Más Cercano (km)
                        </option>
                      </select>
                    </div>

                    <button
                      id="btn-refresh-matches"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="p-2.5 rounded-xl border border-[#2A2F37] bg-[#121417] text-gray-300 hover:text-[#00F0FF] transition-all cursor-pointer"
                      title="Actualizar lista de partidos"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00F0FF]' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Match Cards Feed */}
                {loading ? (
                  <div className="py-20 text-center">
                    <div className="w-8 h-8 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs text-[#A0AAB4] font-medium">Buscando convocatorias en Falta1...</p>
                  </div>
                ) : filteredAndSortedPartidos.length === 0 ? (
                  <div className="bg-[#1E2228] rounded-3xl p-10 text-center border border-[#2A2F37] shadow-sm max-w-md mx-auto my-6 space-y-3">
                    <div className="text-4xl">🏟️</div>
                    <h3 className="text-base font-black text-white">No hay partidos con estos filtros</h3>
                    <p className="text-xs text-[#A0AAB4]">
                      Probá cambiando el radio de distancia o limpiá la búsqueda para ver más canchas disponibles.
                    </p>
                    <button
                      onClick={() => {
                        handleSelectQuickFilter('todos');
                        setSelectedRadiusKm(999);
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F4C3A] text-white text-xs font-bold hover:bg-[#135f49] border border-[#1b6a52] transition-colors cursor-pointer"
                    >
                      Ver todos los partidos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAndSortedPartidos.map((partido) => (
                      <MatchCard
                        key={partido.id}
                        partido={partido}
                        userCoords={userCoords}
                        onPress={() => setSelectedMatchId(partido.id)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'mapa' ? (
              <motion.div
                key="tab-mapa"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <MapScreen
                  partidos={partidos}
                  userCoords={userCoords}
                  onSelectMatch={handleSelectMatch}
                />
              </motion.div>
            ) : activeTab === 'chats' ? (
              <motion.div
                key="tab-chats"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <ChatsScreen
                  currentUser={currentUser}
                  partidos={partidos}
                  onOpenMatch={handleSelectMatch}
                />
              </motion.div>
            ) : activeTab === 'crear' ? (
              <motion.div
                key="tab-crear"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <CreateMatch
                  onSuccess={handleMatchCreated}
                  onCancel={() => setActiveTab('partidos')}
                  onOpenAuthModal={() => {
                    setAuthInitialMode('verify_phone');
                    setIsAuthOpen(true);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="tab-perfil"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <ProfileScreen
                  currentUser={currentUser}
                  onUserChanged={(u) => setCurrentUser(u)}
                  onOpenAuthModal={(mode) => {
                    setAuthInitialMode(mode || 'verify_phone');
                    setIsAuthOpen(true);
                  }}
                  onLogout={() => {
                    const defaultUser = DataStore.getAllUsers()[0];
                    DataStore.setCurrentUser(defaultUser);
                    setCurrentUser(defaultUser);
                    setIsAuthOpen(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* 3. Botón Flotante de Acción (FAB) */}
        <button
          id="fab-crear-partido"
          onClick={handleAttemptCreateMatch}
          className="fixed bottom-20 sm:bottom-8 right-5 sm:right-8 z-40 w-14 h-14 rounded-full bg-[#0F4C3A] hover:bg-[#135f49] text-white shadow-2xl border-2 border-[#1b6a52] hover:border-[#00F0FF] flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 group"
          title="Crear Partido (Requiere verificación OTP)"
        >
          <Plus className="w-7 h-7 text-white group-hover:rotate-90 transition-transform duration-300" />
          <span className="sr-only">Crear Partido</span>
        </button>

        {/* 4. Barra de Navegación Inferior (Bottom Nav Bar) - Fondo Negro Carbón (#121417) con 4 pestañas */}
        <nav
          id="bottom-navigation-bar"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#121417]/95 backdrop-blur-md border-t border-[#1E2228] py-2 px-4 sm:hidden shadow-2xl"
        >
          <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
            {/* ⚽ Partidos */}
            <button
              id="tab-btn-partidos"
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('partidos');
              }}
              className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'partidos'
                  ? 'text-[#00F0FF] font-black'
                  : 'text-[#A0AAB4] hover:text-white'
              }`}
            >
              <span className="text-xl">⚽</span>
              <span className="text-[11px] mt-0.5">Partidos</span>
            </button>

            {/* 🗺️ Mapa */}
            <button
              id="tab-btn-mapa"
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('mapa');
              }}
              className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'mapa'
                  ? 'text-[#00F0FF] font-black'
                  : 'text-[#A0AAB4] hover:text-white'
              }`}
            >
              <span className="text-xl">🗺️</span>
              <span className="text-[11px] mt-0.5">Mapa</span>
            </button>

            {/* 💬 Mis Chats con globo indicador */}
            <button
              id="tab-btn-chats"
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('chats');
              }}
              className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer relative ${
                activeTab === 'chats'
                  ? 'text-[#00F0FF] font-black'
                  : 'text-[#A0AAB4] hover:text-white'
              }`}
            >
              <div className="relative">
                <span className="text-xl">💬</span>
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-[#00F0FF] text-[#121417] text-[9px] font-black flex items-center justify-center">
                  1
                </span>
              </div>
              <span className="text-[11px] mt-0.5">Mis Chats</span>
            </button>

            {/* 👤 Perfil con foto redonda y % de asistencia */}
            <button
              id="tab-btn-perfil"
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('perfil');
              }}
              className={`flex flex-col items-center py-1 rounded-xl transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'text-[#00F0FF] font-black'
                  : 'text-[#A0AAB4] hover:text-white'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-[#0F4C3A] border border-[#00F0FF] text-white flex items-center justify-center text-[10px] font-black">
                {currentUser.nombre.charAt(0)}
              </div>
              <span className="text-[11px] mt-0.5 flex items-center gap-0.5">
                Perfil <span className="text-[9px] text-[#00F0FF]">({currentUser.asistencia_pct || 98}%)</span>
              </span>
            </button>
          </div>
        </nav>

        {/* Desktop Navigation Floating Pill - 4 tabs */}
        <div className="hidden sm:block fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-[#121417]/90 backdrop-blur-md text-white rounded-full p-1.5 shadow-2xl border border-[#2A2F37] flex items-center gap-1">
            <button
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('partidos');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'partidos'
                  ? 'bg-[#0F4C3A] text-white border border-[#00F0FF]/40 shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-[#1E2228]'
              }`}
            >
              <span>⚽</span> Partidos
            </button>

            <button
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('mapa');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mapa'
                  ? 'bg-[#0F4C3A] text-white border border-[#00F0FF]/40 shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-[#1E2228]'
              }`}
            >
              <span>🗺️</span> Mapa
            </button>

            <button
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('chats');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'chats'
                  ? 'bg-[#0F4C3A] text-white border border-[#00F0FF]/40 shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-[#1E2228]'
              }`}
            >
              <span>💬</span> Mis Chats
              <span className="w-4 h-4 rounded-full bg-[#00F0FF] text-[#121417] text-[9px] font-black flex items-center justify-center">
                1
              </span>
            </button>

            <button
              onClick={() => {
                setSelectedMatchId(null);
                setActiveTab('perfil');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-[#0F4C3A] text-white border border-[#00F0FF]/40 shadow-sm'
                  : 'text-gray-300 hover:text-white hover:bg-[#1E2228]'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-[#0F4C3A] text-[#00F0FF] text-[9px] font-bold flex items-center justify-center">
                {currentUser.nombre.charAt(0)}
              </div>
              <span>Perfil ({currentUser.asistencia_pct || 98}%)</span>
            </button>
          </div>
        </div>

        {/* Notifications Modal */}
        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
          currentUserId={currentUser.id}
          onSelectMatch={(mId) => {
            setSelectedMatchId(mId);
            setActiveTab('partidos');
          }}
          onNotificationsUpdated={() => setNotificationsTick((t) => t + 1)}
        />

        {/* Auth & Identity Verification Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authInitialMode}
          initialPhone={currentUser.telefono || ''}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(u) => {
            setCurrentUser(u);
            if (u.telefono_verificado) {
              setJustVerified(true);
              setTimeout(() => setJustVerified(false), 8000);
            }
            loadPartidos();
          }}
        />
      </div>
    </GoogleMapsWrapper>
  );
}

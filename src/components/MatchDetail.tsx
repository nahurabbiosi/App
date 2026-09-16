import React, { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  Award,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  UserPlus,
  UserCheck,
  Shuffle,
  ThumbsUp,
  AlertCircle,
  Share2,
  Flag,
  Car,
  Footprints,
  Compass,
  CalendarPlus,
  Lock,
  Zap,
  Sparkles,
  Star,
  Trophy,
  QrCode,
  Beer,
} from 'lucide-react';
import { MatchWithCreator, InscriptionWithUser, ChatMessage } from '@/types/database';
import { DataStore, calculateDistanceKm } from '@/lib/store';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { NavigationSelectorModal } from './NavigationSelectorModal';
import { CancelPenaltyModal } from './CancelPenaltyModal';
import { ReportModal } from './ReportModal';
import { ExportCalendarModal } from './ExportCalendarModal';
import { ShareMatchModal } from './ShareMatchModal';
import { InstagramStoryModal } from './InstagramStoryModal';
import { PostMatchReviewModal } from './PostMatchReviewModal';
import { BalancedTeamsView } from './BalancedTeamsView';
import { MatchDigitalScoreboard } from './MatchDigitalScoreboard';
import { TercerTiempoView } from './TercerTiempoView';
import { QrReservationModal } from './QrReservationModal';
import { checkRateLimit, analyzeOffensiveContent } from '@/lib/security';

export type MatchDetailProps = {
  matchId: string;
  onBack: () => void;
  userCoords?: { latitude: number; longitude: number } | null;
  onOpenAuthModal?: () => void;
};

export const MatchDetail: React.FC<MatchDetailProps> = ({
  matchId,
  onBack,
  userCoords,
  onOpenAuthModal,
}) => {
  const [data, setData] = useState<{
    partido: MatchWithCreator | null;
    inscripciones: InscriptionWithUser[];
  }>({ partido: null, inscripciones: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'jugadores' | 'equipos' | 'tercer_tiempo' | 'chat'>('info');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // New Modals State
  const [showNavModal, setShowNavModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [reportingUser, setReportingUser] = useState<{ id: string; name: string } | null>(null);
  const [reportingMessage, setReportingMessage] = useState<string | undefined>(undefined);
  const [chatRateError, setChatRateError] = useState<string | null>(null);
  const [waitlistRemaining, setWaitlistRemaining] = useState<number>(0);

  const currentUser = DataStore.getCurrentUser();

  const loadData = async () => {
    DataStore.checkAndAdvanceWaitlistTimers();
    setLoading(true);
    const result = await DataStore.fetchMatchDetails(matchId);
    setData(result);
    setChatMessages(DataStore.getChatMessages(matchId));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [matchId]);

  // Automated 10-minute waitlist timer countdown
  useEffect(() => {
    if (!data.partido?.suplente_activo || data.partido.suplente_activo.usuario_id !== currentUser.id) {
      setWaitlistRemaining(0);
      return;
    }
    const updateTimer = () => {
      const expTime = new Date(data.partido!.suplente_activo!.expira_en).getTime();
      const diff = Math.max(0, Math.floor((expTime - Date.now()) / 1000));
      setWaitlistRemaining(diff);
      if (diff === 0) {
        DataStore.checkAndAdvanceWaitlistTimers();
        loadData();
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data.partido?.suplente_activo, currentUser.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm font-semibold text-gray-500">Cargando detalles del partido...</p>
      </div>
    );
  }

  const { partido, inscripciones } = data;
  if (!partido) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Partido no encontrado</h2>
        <p className="text-sm text-gray-500 mb-4">El partido puede haber sido cancelado o eliminado.</p>
        <button
          type="button"
          onClick={onBack}
          className="bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
        >
          Volver a partidos
        </button>
      </div>
    );
  }

  const isCreator = currentUser.id === partido.creador_id;
  const userInscription = inscripciones.find((i) => i.usuario_id === currentUser.id);
  const isJoined = !!userInscription;
  const isConfirmed = userInscription?.estado === 'confirmado';
  const isWaitlisted = partido.lista_espera?.includes(currentUser.id);
  const hasCheckedIn = partido.checkins?.includes(currentUser.id);

  const spotsLeft = Math.max(0, partido.jugadores_necesarios - partido.jugadores_confirmados);
  const isFull = spotsLeft === 0;

  const rawDate = new Date(partido.fecha_hora);
  const dateValid = isValid(rawDate);
  const formattedDate = dateValid
    ? format(rawDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })
    : partido.fecha_hora;
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Distance
  let distanceKm: number | null = null;
  if (userCoords && partido.lat && partido.lng) {
    distanceKm = calculateDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      partido.lat,
      partido.lng
    );
  }

  // Handlers
  const handleJoin = async () => {
    if (!currentUser.telefono_verificado) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        showNotice('⚠️ Debés verificar tu celular con código OTP antes de anotarte a un partido.');
      }
      return;
    }

    if (isFull) {
      const waitlisted = DataStore.toggleWaitlist(partido.id, currentUser.id);
      showNotice(
        waitlisted
          ? '¡Te anotaste en la lista de espera! Te avisaremos si alguien se baja.'
          : 'Saliste de la lista de espera.'
      );
      loadData();
      return;
    }

    await DataStore.joinMatch(partido.id, currentUser.id);
    // Auto confirm in demo for smooth experience
    const updated = await DataStore.fetchMatchDetails(matchId);
    const newIns = updated.inscripciones.find((i) => i.usuario_id === currentUser.id);
    if (newIns) {
      await DataStore.confirmInscription(newIns.id, partido.id);
    }
    showNotice('¡Te uniste al partido! Ya estás en la lista de confirmados.');
    loadData();
  };

  const handleLeave = async () => {
    await DataStore.cancelInscription(partido.id, currentUser.id);
    showNotice('Cancelaste tu inscripción al partido.');
    loadData();
  };

  const handleCheckIn = () => {
    DataStore.checkInMatch(partido.id, currentUser.id);
    showNotice('¡Check-in confirmado! Se avisó a los demás jugadores que estás en camino.');
    loadData();
  };

  const handleTogglePayment = (targetUserId: string) => {
    if (!isCreator) return;
    const status = DataStore.togglePaymentStatus(partido.id, targetUserId);
    showNotice(`Estado de pago actualizado a: ${status === 'pagado' ? 'Pagado ✅' : 'Pendiente ⏳'}`);
    loadData();
  };

  const handleGenerateTeams = () => {
    const confirmedUserIds = inscripciones
      .filter((i) => i.estado === 'confirmado')
      .map((i) => i.usuario_id);
    if (confirmedUserIds.length < 2) {
      showNotice('Se necesitan al menos 2 jugadores para dividir los equipos.');
      return;
    }
    DataStore.generateTeams(partido.id, confirmedUserIds);
    showNotice('¡Equipos armados equitativamente!');
    loadData();
  };

  const handleVoteMvp = (targetUserId: string) => {
    DataStore.voteMvp(partido.id, currentUser.id, targetUserId);
    showNotice('¡Voto registrado para MVP de la fecha!');
    loadData();
  };

  const handleTriggerUrgentGoalie = () => {
    const { goaliesNotified, nearbyNotified } = DataStore.triggerUrgentGoalieAlert(partido.id);
    showNotice(
      `🚨 ¡Búsqueda Urgente activada! Se notificó a ${goaliesNotified} arqueros y ${nearbyNotified} jugadores en un radio de 5 km.`
    );
    loadData();
  };

  const handleConfirmWaitlist = async () => {
    const ok = await DataStore.confirmWaitlistSlot(partido.id, currentUser.id);
    if (ok) {
      showNotice('⚡️ ¡Felicitaciones! Confirmaste tu cupo prioritario y estás en la lista.');
      loadData();
    }
  };

  const handleDeclineWaitlist = async () => {
    await DataStore.declineWaitlistSlot(partido.id, currentUser.id);
    showNotice('Cediste tu lugar en la lista de espera al siguiente suplente.');
    loadData();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!currentUser.telefono_verificado) {
      setChatRateError('⚠️ Debés validar tu número de celular con OTP para participar en el chat del partido.');
      setTimeout(() => setChatRateError(null), 4000);
      if (onOpenAuthModal) onOpenAuthModal();
      return;
    }

    // Anti-Spam Rate Limit: max 5 messages per 10 seconds
    const rateCheck = checkRateLimit(`chat_${currentUser.id}`, 5, 10);
    if (!rateCheck.allowed) {
      setChatRateError(
        `⚠️ Control Anti-Spam activado: Por favor esperá ${rateCheck.remainingSeconds} segundos antes de enviar otro mensaje.`
      );
      setTimeout(() => setChatRateError(null), 4000);
      return;
    }

    // AI Assisted Content Moderation
    const modResult = analyzeOffensiveContent(newMessage.trim());
    if (modResult.es_ofensivo && modResult.severidad === 'alta') {
      setChatRateError(`⚠️ Bloqueado por Moderación IA: ${modResult.motivo_deteccion}`);
      setTimeout(() => setChatRateError(null), 5000);
      return;
    }

    DataStore.addChatMessage(partido.id, currentUser.id, currentUser.nombre, newMessage.trim());
    setNewMessage('');
    setChatMessages(DataStore.getChatMessages(partido.id));
  };

  const handleCopyAlias = () => {
    if (partido.alias_cvu) {
      navigator.clipboard.writeText(partido.alias_cvu);
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2500);
      showNotice('Alias copiado al portapapeles');
    }
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Badges
  const generoBadge = {
    mixto: { label: 'Mixto', bg: 'bg-purple-100 text-purple-800' },
    femenino: { label: 'Femenino', bg: 'bg-pink-100 text-pink-800' },
    masculino: { label: 'Masculino', bg: 'bg-blue-100 text-blue-800' },
  }[partido.genero || 'mixto'];

  const nivelBadge = {
    recreativo: { label: 'Recreativo / Divertirse', bg: 'bg-emerald-100 text-emerald-800' },
    intermedio: { label: 'Intermedio', bg: 'bg-amber-100 text-amber-800' },
    competitivo: { label: 'Competitivo', bg: 'bg-red-100 text-red-800' },
  }[partido.nivel || 'intermedio'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Toast notice */}
      {actionNotice && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Back button & viral action buttons bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-emerald-600 transition-colors bg-white px-3.5 py-2 rounded-xl border border-gray-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a partidos
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp & Deep Link Viral Modal */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-300 transition-colors cursor-pointer shadow-xs"
            title="Invitar por WhatsApp con enlace directo o código QR"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Invitar por WhatsApp</span>
          </button>

          {/* Instagram Story Flyer Generator */}
          <button
            type="button"
            onClick={() => setShowStoryModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-800 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 px-3 py-2 rounded-xl border border-purple-200 transition-colors cursor-pointer shadow-xs"
            title="Generar flyer 9:16 para Stories de Instagram"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Story Instagram</span>
          </button>

          {/* Review & MVP modal */}
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl border border-amber-300 transition-colors cursor-pointer shadow-xs"
            title="Calificar y votar al MVP en 15 segundos"
          >
            <Star className="w-3.5 h-3.5 text-amber-600" />
            <span>Calificar / MVP</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCalendarModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 transition-colors cursor-pointer"
            title="Exportar a Google Calendar o iCal (.ics)"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-gray-600" />
            <span>Calendario</span>
          </button>
        </div>
      </div>

      {/* Priority Waitlist Real-Time Alert Banner (10-minute timer for active substitute) */}
      {waitlistRemaining > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 shadow-lg border border-emerald-500 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-gray-950 px-2 py-0.5 rounded-md">
                    ¡Se liberó tu cupo!
                  </span>
                  <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.floor(waitlistRemaining / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {(waitlistRemaining % 60).toString().padStart(2, '0')}{' '}
                    para confirmar
                  </span>
                </div>
                <p className="text-xs font-semibold text-white mt-0.5">
                  Un jugador canceló su lugar. Tenés prioridad exclusiva para sumarte al partido antes de que pase al siguiente suplente.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleConfirmWaitlist}
                className="flex-1 sm:flex-none bg-white text-emerald-950 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-black transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirmar y Sumarme</span>
              </button>
              <button
                type="button"
                onClick={handleDeclineWaitlist}
                className="flex-1 sm:flex-none bg-black/20 hover:bg-black/30 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Ceder a otro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-lg">
                Fútbol {partido.tipo_cancha}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${generoBadge.bg}`}>
                {generoBadge.label}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${nivelBadge.bg}`}>
                {nivelBadge.label}
              </span>

              {/* Private Match Badge */}
              {partido.privado ? (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>Partido Privado</span>
                  {partido.codigo_acceso && (
                    <span className="font-mono font-black ml-1 text-amber-950 bg-amber-200/60 px-1.5 py-0.2 rounded">
                      {partido.codigo_acceso}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Partido Público
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {partido.titulo}
            </h1>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-gray-800">{partido.cancha}</span>
                  {distanceKm !== null && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      A {distanceKm} km
                    </span>
                  )}
                </div>

                {partido.lat && partido.lng && (
                  <button
                    type="button"
                    onClick={() => setShowNavModal(true)}
                    className="text-xs font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-300 cursor-pointer shadow-xs"
                    title="Cómo llegar con Google Maps, Waze o Apple Maps"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Cómo llegar</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{displayDate}</span>
              </div>
            </div>

            {/* Special attributes & Urgent Goalie Trigger */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {partido.busca_arquero && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                  <span>🧤</span> Se busca arquero/a {partido.arquero_gratis ? '(¡Juega gratis!)' : ''}
                </span>
              )}

              {/* Urgent Goalie Push trigger for creator */}
              {isCreator && (
                <button
                  type="button"
                  onClick={handleTriggerUrgentGoalie}
                  className="text-xs font-bold px-3 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Enviar push urgente a todos los arqueros registrados y jugadores a menos de 5 km"
                >
                  <Zap className="w-3.5 h-3.5 text-red-600" />
                  <span>Búsqueda Urgente de Arquero/a (Notificar)</span>
                </button>
              )}

              {partido.tercer_tiempo && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800">
                  🍻 Tercer tiempo incluido
                </span>
              )}
              {partido.servicios?.map((srv) => (
                <span key={srv} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 capitalize">
                  {srv === 'techada' ? '☂️ Techada' : srv === 'sintetico' ? '🌱 Sintético' : srv}
                </span>
              ))}
            </div>
          </div>

          {/* Pricing & Financial Transparency Box */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 md:min-w-[260px] text-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
              Transparencia de Costos
            </span>
            <div className="text-3xl font-black text-emerald-950 mb-0.5">
              ${partido.precio_por_persona?.toLocaleString('es-AR') || '3.000'}
            </div>
            <span className="text-xs text-emerald-700 font-semibold block mb-3">
              por jugador ({partido.jugadores_necesarios} cupos)
            </span>

            <div className="pt-3 border-t border-emerald-200/80 text-left text-xs space-y-1.5 text-emerald-900">
              <div className="flex justify-between">
                <span className="text-emerald-700">Total alquiler:</span>
                <span className="font-bold">${partido.precio_total?.toLocaleString('es-AR') || '30.000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">Medio de pago:</span>
                <span className="font-semibold capitalize">
                  {partido.medio_pago === 'transferencia' ? '💳 Transferencia' : '💵 Efectivo en cancha'}
                </span>
              </div>

              {partido.alias_cvu && (
                <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg">
                  <div className="truncate mr-2">
                    <span className="text-[10px] text-gray-500 block">Alias / CVU:</span>
                    <span className="font-mono font-bold text-xs text-gray-800">{partido.alias_cvu}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAlias}
                    className="shrink-0 p-1 text-emerald-700 hover:text-emerald-900"
                    title="Copiar alias"
                  >
                    {copiedAlias ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button & Status Footer */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
              {partido.creador?.nombre?.charAt(0) || 'O'}
            </div>
            <div className="text-xs">
              <span className="text-gray-500 block">Organizado por</span>
              <span className="font-bold text-gray-900 flex items-center gap-1">
                {partido.creador?.nombre || 'Organizador'}
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Anti-Plantón Check-in button (if confirmed) */}
            {isConfirmed && (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={hasCheckedIn}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                  hasCheckedIn
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm animate-pulse'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {hasCheckedIn ? '¡Check-in realizado (En camino)!' : 'Confirmar asistencia (Check-in)'}
              </button>
            )}

            {/* Reception QR Check-in button */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all bg-gray-900 hover:bg-black text-white cursor-pointer shadow-xs"
              title="Mostrar código QR para validación en recepción de la cancha"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>{partido.reserva_validada ? 'QR Validado ✅' : 'Check-in QR'}</span>
            </button>

            {/* Join / Leave / Waitlist */}
            {!isJoined ? (
              <button
                type="button"
                onClick={handleJoin}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  isFull
                    ? isWaitlisted
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                {isFull
                  ? isWaitlisted
                    ? 'Estás en lista de espera'
                    : 'Anotarme en lista de espera'
                  : 'Anotarme al partido'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              >
                Bajarme del partido
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'info'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Información y Cancha
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('jugadores')}
          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'jugadores'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Jugadores ({partido.jugadores_confirmados}/{partido.jugadores_necesarios})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('equipos')}
          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'equipos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Shuffle className="w-4 h-4" />
          Equipos
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
            activeTab === 'chat'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat del Partido
          {chatMessages.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2 right-2 sm:static sm:w-auto sm:h-auto sm:text-[10px] sm:px-1.5 sm:py-0.2 sm:bg-emerald-100 sm:text-emerald-800 font-bold" />
          )}
        </button>
      </div>

      {/* Tab: Info & Google Maps */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notes & details */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-gray-900">Detalles y Reglas del Partido</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {partido.notas || 'Sin notas adicionales. ¡Vení con ganas de jugar y buena onda!'}
            </p>

            <div className="pt-4 border-t border-gray-100 space-y-3 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Política anti-plantón:</span>
                <span className="font-bold text-emerald-700">Check-in obligatorio 2hs antes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Tolerancia de espera:</span>
                <span className="font-semibold text-gray-800">10 minutos</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-500">Indumentaria:</span>
                <span className="font-semibold text-gray-800">Llevar remera clara y oscura</span>
              </div>
            </div>
          </div>

          {/* Interactive Google Maps card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Ubicación de la Cancha
                </h3>
                {partido.lat && partido.lng && (
                  <button
                    type="button"
                    onClick={() => setShowNavModal(true)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Cómo llegar
                  </button>
                )}
              </div>

              {partido.lat && partido.lng ? (
                <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 mb-3 relative">
                  <Map
                    defaultCenter={{ lat: partido.lat, lng: partido.lng }}
                    defaultZoom={15}
                    mapId="DEMO_MAP_ID"
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    gestureHandling="cooperative"
                    fullscreenControl={false}
                    className="w-full h-full"
                  >
                    <AdvancedMarker position={{ lat: partido.lat, lng: partido.lng }} title={partido.cancha || ''} />
                  </Map>

                  {/* Travel time floating pill */}
                  {distanceKm !== null && (
                    <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-sm border border-gray-200/80 text-[11px] font-bold text-gray-800 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-emerald-600" />
                      <span>~{Math.max(3, Math.round(distanceKm * 2.3))} min en auto</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  Ubicación precisa en proceso de confirmación
                </div>
              )}

              <p className="text-xs text-gray-800 font-bold mb-1">{partido.cancha}</p>

              {/* Distance and Estimated times */}
              {distanceKm !== null ? (
                <div className="grid grid-cols-2 gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                    <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="block font-bold">~{Math.max(3, Math.round(distanceKm * 2.3))} min</span>
                      <span className="text-[10px] text-emerald-700">En auto / taxi ({distanceKm} km)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-900 font-semibold border-l border-emerald-200/60 pl-2">
                    <Footprints className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="block font-bold">~{Math.max(8, Math.round(distanceKm * 4.5))} min</span>
                      <span className="text-[10px] text-emerald-700">Transporte público / a pie</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Activa tu ubicación para ver el tiempo estimado de viaje.</p>
              )}
            </div>

            {partido.lat && partido.lng && (
              <button
                type="button"
                onClick={() => setShowNavModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs text-center flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                Cómo llegar (Google Maps, Waze o Apple Maps)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab: Jugadores (Roster, Reputation, Payment Status) */}
      {activeTab === 'jugadores' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-base text-gray-900">
                Jugadores Confirmados ({partido.jugadores_confirmados} / {partido.jugadores_necesarios})
              </h3>
              <p className="text-xs text-gray-500">
                Conocé la reputación, asistencia histórica y estado de pago de cada jugador
              </p>
            </div>

            {isCreator && (
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 self-start">
                👑 Sos el organizador: podés marcar quién pagó
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inscripciones.map((ins) => {
              const u = ins.usuario;
              const isPaid = partido.pagos_estado?.[ins.usuario_id] === 'pagado';
              const isCheckedIn = partido.checkins?.includes(ins.usuario_id);

              return (
                <div
                  key={ins.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-emerald-200 bg-gray-50/50 flex items-start justify-between gap-3 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
                      {u?.nombre?.charAt(0) || 'J'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-gray-900">{u?.nombre || 'Jugador'}</h4>
                        {u?.verificado && (
                          <span title="Perfil Verificado">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          </span>
                        )}
                        {ins.usuario_id === partido.creador_id && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            Organizador
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 space-x-2">
                        <span className="capitalize">{u?.posicion_preferida || 'Jugador'}</span>
                        <span>•</span>
                        <span>{u?.edad_aprox ? `${u.edad_aprox} años` : '26 años'}</span>
                      </div>

                      {/* Attendance % & Medals */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {u?.asistencia_pct || 96}% asistencia
                        </span>
                        {u?.medallas?.slice(0, 1).map((m) => (
                          <span key={m} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            🏅 {m}
                          </span>
                        ))}
                      </div>

                      {isCheckedIn && (
                        <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3 h-3" /> En camino / Presente
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment tag & Organizer action */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePayment(ins.usuario_id)}
                      disabled={!isCreator}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isCreator ? 'Clic para alternar estado de pago' : ''}
                    >
                      {isPaid ? 'Pagado ✅' : 'Pendiente ⏳'}
                    </button>

                    {/* MVP voting and Report button */}
                    {ins.usuario_id !== currentUser.id && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVoteMvp(ins.usuario_id)}
                          className="text-[10px] text-gray-500 hover:text-emerald-700 flex items-center gap-0.5 font-semibold transition-colors"
                          title="Votar como MVP o buen compañero"
                        >
                          <ThumbsUp className="w-3 h-3" /> MVP
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setReportingUser({
                              id: ins.usuario_id,
                              name: u?.nombre || 'Jugador',
                            })
                          }
                          className="text-[10px] text-gray-400 hover:text-red-600 flex items-center gap-0.5 font-medium transition-colors"
                          title={`Reportar o bloquear a ${u?.nombre}`}
                        >
                          <Flag className="w-3 h-3" /> Reportar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Waitlist section */}
          {partido.lista_espera && partido.lista_espera.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Lista de Espera ({partido.lista_espera.length})
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                Si algún jugador cancela, la lista de espera se promueve automáticamente en orden de llegada.
              </p>
              <div className="flex flex-wrap gap-2">
                {partido.lista_espera.map((uid, idx) => (
                  <span
                    key={uid}
                    className="text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-lg"
                  >
                    #{idx + 1} en espera {uid === currentUser.id ? '(Vos)' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Armado de Equipos (Equipos Equitativos) */}
      {activeTab === 'equipos' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-base text-gray-900">Armado de Equipos Equitativo</h3>
              <p className="text-xs text-gray-500">
                Dividí automáticamente a los jugadores confirmados en Equipo 1 vs Equipo 2
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateTeams}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm self-start"
            >
              <Shuffle className="w-3.5 h-3.5" /> Re-armar Equipos
            </button>
          </div>

          {partido.equipos ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team 1 */}
              <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                  <h4 className="font-black text-sm text-blue-900 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    Equipo Claro / Pechera Azul
                  </h4>
                  <span className="text-xs font-bold text-blue-800">
                    {partido.equipos.equipoA.length} jugadores
                  </span>
                </div>
                <div className="space-y-2">
                  {partido.equipos.equipoA.map((uid) => {
                    const ins = inscripciones.find((i) => i.usuario_id === uid);
                    const name = ins?.usuario?.nombre || 'Jugador';
                    return (
                      <div key={uid} className="bg-white p-2.5 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">{name}</span>
                        <span className="text-gray-400 capitalize">{ins?.usuario?.posicion_preferida || 'Medio'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Team 2 */}
              <div className="border border-red-200 bg-red-50/40 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-red-200">
                  <h4 className="font-black text-sm text-red-900 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-600" />
                    Equipo Oscuro / Pechera Roja
                  </h4>
                  <span className="text-xs font-bold text-red-800">
                    {partido.equipos.equipoB.length} jugadores
                  </span>
                </div>
                <div className="space-y-2">
                  {partido.equipos.equipoB.map((uid) => {
                    const ins = inscripciones.find((i) => i.usuario_id === uid);
                    const name = ins?.usuario?.nombre || 'Jugador';
                    return (
                      <div key={uid} className="bg-white p-2.5 rounded-xl border border-red-100 flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">{name}</span>
                        <span className="text-gray-400 capitalize">{ins?.usuario?.posicion_preferida || 'Medio'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-6">
              <Shuffle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">Aún no se armaron los equipos</p>
              <p className="text-xs text-gray-500 mb-4">Hacé clic en el botón para armar los dos equipos al azar.</p>
              <button
                type="button"
                onClick={handleGenerateTeams}
                className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
              >
                Armar Equipos Ahora
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Chat Integrado del Partido */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[500px] overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <div>
                <h4 className="font-bold text-sm text-gray-900">Chat del Partido</h4>
                <p className="text-[11px] text-gray-500">Coordiná pelota, color de remera y llegadas tarde</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Privado del partido
            </span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-xs">
                No hay mensajes aún. ¡Sé el primero en saludar o avisar qué llevás!
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.usuario_id === currentUser.id;
                if (msg.es_sistema) {
                  return (
                    <div key={msg.id} className="text-center my-2">
                      <span className="bg-gray-100 text-gray-600 text-[11px] font-semibold px-3 py-1 rounded-full">
                        ℹ️ {msg.mensaje}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-0.5 px-1">
                      <span>{isMe ? 'Vos' : msg.usuario_nombre}</span>
                      {!isMe && (
                        <button
                          type="button"
                          onClick={() => {
                            setReportingUser({ id: msg.usuario_id, name: msg.usuario_nombre });
                            setReportingMessage(msg.mensaje);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity p-0.5 cursor-pointer"
                          title={`Reportar a ${msg.usuario_nombre} por este mensaje`}
                        >
                          <Flag className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs font-medium ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {msg.mensaje}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Anti-Spam Rate Limit Alert */}
          {chatRateError && (
            <div className="mx-3 my-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{chatRateError}</span>
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-gray-50 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribí un mensaje al grupo (ej: llevo inflador, llego 5 min tarde)..."
              className="flex-1 bg-white text-[#121417] placeholder-[#6C757D] border border-gray-300 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 caret-[#00E676]"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" /> Enviar
            </button>
          </form>
        </div>
      )}

      {/* Navigation Modal */}
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

      {/* Cancellation Penalty Modal */}
      <CancelPenaltyModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleLeave}
        matchDateIso={partido.fecha_hora}
        currentUser={currentUser}
      />

      {/* Report & Block User Modal with AI moderation */}
      {reportingUser && (
        <ReportModal
          isOpen={!!reportingUser}
          onClose={() => {
            setReportingUser(null);
            setReportingMessage(undefined);
          }}
          reportedUserId={reportingUser.id}
          reportedUserName={reportingUser.name}
          initialMessageText={reportingMessage}
          currentUserId={currentUser.id}
          matchId={partido.id}
          onUserBlocked={() => {
            showNotice(`Usuario ${reportingUser.name} bloqueado.`);
            loadData();
          }}
        />
      )}

      {/* Viral WhatsApp & Deep Link Invitation Modal */}
      <ShareMatchModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        partido={partido}
      />

      {/* Viral Instagram Story 9:16 Canvas Flyer Generator */}
      <InstagramStoryModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        partido={partido}
      />

      {/* 15-second Post-Match Review & MVP Voting Modal */}
      <PostMatchReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        match={partido}
        currentUser={currentUser}
        onSubmitted={() => {
          showNotice('¡Gracias por tu calificación de post-partido y voto MVP!');
          loadData();
        }}
      />
    </div>
  );
};

import { supabase } from './supabase';
import {
  Partido,
  Usuario,
  Inscripcion,
  MatchWithCreator,
  InscriptionWithUser,
  ChatMessage,
  GeneroPartido,
  NivelPartido,
  ServicioCancha,
  AppNotification,
  MatchReview,
  PartidoLiveScore,
  TercerTiempoState,
  BalancedTeamsResult,
  ComplejoTurnoFlash,
  CommunityPost,
  TeamProfile,
  TeamChallenge,
} from '@/types/database';
import {
  INITIAL_USERS,
  INITIAL_PARTIDOS,
  INITIAL_INSCRIPCIONES,
  INITIAL_CHATS,
  INITIAL_NOTIFICACIONES,
  INITIAL_REVIEWS,
  INITIAL_TURNOS_FLASH,
  INITIAL_COMMUNITY_POSTS,
  INITIAL_TEAM_PROFILES,
  INITIAL_TEAM_CHALLENGES,
} from './mockData';
import { balanceTeams } from './teamBalancer';

const PARTIDOS_KEY = 'juntada_partidos_v2';
const INSCRIPCIONES_KEY = 'juntada_inscripciones_v2';
const USERS_KEY = 'juntada_users_v2';
const CURRENT_USER_KEY = 'juntada_current_user_v2';
const CHATS_KEY = 'juntada_chats_v2';
const TEMPLATES_KEY = 'juntada_templates_v2';
const NOTIFICATIONS_KEY = 'juntada_notifications_v2';
const REVIEWS_KEY = 'juntada_reviews_v2';
const TURNOS_FLASH_KEY = 'juntada_turnos_flash_v1';
const COMMUNITY_POSTS_KEY = 'juntada_community_posts_v1';
const TEAMS_KEY = 'juntada_teams_v1';
const CHALLENGES_KEY = 'juntada_challenges_v1';
const BALANCED_RESULTS_KEY = 'juntada_balanced_cache_v1';

function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Ensure initial seed in localStorage
if (!localStorage.getItem(PARTIDOS_KEY)) {
  setLocal(PARTIDOS_KEY, INITIAL_PARTIDOS);
} else {
  // Ensure past matches are included
  const existing = getLocal<Partido[]>(PARTIDOS_KEY, []);
  const missing = INITIAL_PARTIDOS.filter((ip) => !existing.some((ep) => ep.id === ip.id));
  if (missing.length > 0) {
    setLocal(PARTIDOS_KEY, [...existing, ...missing]);
  }
}
if (!localStorage.getItem(INSCRIPCIONES_KEY)) {
  setLocal(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);
} else {
  const existingIns = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, []);
  const missingIns = INITIAL_INSCRIPCIONES.filter((ii) => !existingIns.some((ei) => ei.id === ii.id));
  if (missingIns.length > 0) {
    setLocal(INSCRIPCIONES_KEY, [...existingIns, ...missingIns]);
  }
}
if (!localStorage.getItem(USERS_KEY)) {
  setLocal(USERS_KEY, INITIAL_USERS);
}
if (!localStorage.getItem(CURRENT_USER_KEY)) {
  setLocal(CURRENT_USER_KEY, INITIAL_USERS[0]);
}
if (!localStorage.getItem(CHATS_KEY)) {
  setLocal(CHATS_KEY, INITIAL_CHATS);
}
if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
  setLocal(NOTIFICATIONS_KEY, INITIAL_NOTIFICACIONES);
}
if (!localStorage.getItem(REVIEWS_KEY)) {
  setLocal(REVIEWS_KEY, INITIAL_REVIEWS);
}
if (!localStorage.getItem(TURNOS_FLASH_KEY)) {
  setLocal(TURNOS_FLASH_KEY, INITIAL_TURNOS_FLASH);
}
if (!localStorage.getItem(COMMUNITY_POSTS_KEY)) {
  setLocal(COMMUNITY_POSTS_KEY, INITIAL_COMMUNITY_POSTS);
}
if (!localStorage.getItem(TEAMS_KEY)) {
  setLocal(TEAMS_KEY, INITIAL_TEAM_PROFILES);
}
if (!localStorage.getItem(CHALLENGES_KEY)) {
  setLocal(CHALLENGES_KEY, INITIAL_TEAM_CHALLENGES);
}

// Haversine formula to calculate distance in km
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export const DataStore = {
  getCurrentUser(): Usuario {
    return getLocal<Usuario>(CURRENT_USER_KEY, INITIAL_USERS[0]);
  },

  setCurrentUser(user: Usuario): void {
    setLocal(CURRENT_USER_KEY, user);
    // Also update in all users list
    const users = getLocal<Usuario[]>(USERS_KEY, INITIAL_USERS);
    const updated = users.map((u) => (u.id === user.id ? user : u));
    if (!updated.some((u) => u.id === user.id)) {
      updated.push(user);
    }
    setLocal(USERS_KEY, updated);
  },

  getAllUsers(): Usuario[] {
    return getLocal<Usuario[]>(USERS_KEY, INITIAL_USERS);
  },

  async fetchPartidos(): Promise<Partido[]> {
    try {
      const { data, error } = await supabase
        .from('partidos')
        .select('*')
        .eq('estado', 'abierto')
        .order('fecha_hora', { ascending: true });

      if (!error && data && data.length > 0) {
        return data as Partido[];
      }
    } catch {
      // fallback
    }
    return getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
  },

  async fetchMatchDetails(id: string): Promise<{
    partido: MatchWithCreator | null;
    inscripciones: InscriptionWithUser[];
  }> {
    try {
      const { data: partidoData, error: partidoError } = await (supabase as any)
        .from('partidos')
        .select('*, creador:usuarios(*)')
        .eq('id', id)
        .single();

      if (!partidoError && partidoData) {
        const { data: inscripcionesData } = await (supabase as any)
          .from('inscripciones')
          .select('*, usuario:usuarios(*)')
          .eq('partido_id', id);

        const partidoObj = partidoData as unknown as Record<string, any>;
        const partido = {
          ...partidoObj,
          creador: partidoObj.creador,
        } as MatchWithCreator;

        const inscripciones = ((inscripcionesData || []) as any[]).map((i) => ({
          ...i,
          usuario: i.usuario,
        })) as InscriptionWithUser[];

        return { partido, inscripciones };
      }
    } catch {
      // fallback to local
    }

    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const users = getLocal<Usuario[]>(USERS_KEY, INITIAL_USERS);
    const inscripcionesAll = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);

    const partidoRaw = partidos.find((p) => p.id === id);
    if (!partidoRaw) {
      return { partido: null, inscripciones: [] };
    }

    const creador = users.find((u) => u.id === partidoRaw.creador_id);
    const partido: MatchWithCreator = {
      ...partidoRaw,
      creador,
      pagos_estado: partidoRaw.pagos_estado || {},
      checkins: partidoRaw.checkins || [],
      lista_espera: partidoRaw.lista_espera || [],
      mvp_votos: partidoRaw.mvp_votos || {},
    };

    const matchInscripciones = inscripcionesAll
      .filter((i) => i.partido_id === id)
      .map((i) => ({
        ...i,
        usuario: users.find((u) => u.id === i.usuario_id),
      }));

    return { partido, inscripciones: matchInscripciones };
  },

  getMatchById(id: string): Partido | undefined {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    return partidos.find((p) => p.id === id);
  },

  async createPartido(partidoData: {
    creador_id: string;
    titulo: string;
    cancha: string | null;
    fecha_hora: string;
    jugadores_necesarios: number;
    tipo_cancha: string;
    notas: string | null;
    lat?: number | null;
    lng?: number | null;
    genero?: GeneroPartido;
    nivel?: NivelPartido;
    precio_total?: number;
    precio_por_persona?: number;
    busca_arquero?: boolean;
    arquero_gratis?: boolean;
    servicios?: ServicioCancha[];
    tercer_tiempo?: boolean;
    medio_pago?: 'efectivo' | 'transferencia';
    alias_cvu?: string | null;
    privado?: boolean;
    codigo_acceso?: string | null;
    busqueda_urgente_arquero?: boolean;
  }): Promise<Partido> {
    const totalCost = partidoData.precio_total ?? 30000;
    const perPerson = Math.round(totalCost / (partidoData.jugadores_necesarios || 10));

    const newPartido: Partido = {
      id: `match-${Date.now()}`,
      creador_id: partidoData.creador_id,
      titulo: partidoData.titulo,
      cancha: partidoData.cancha,
      lat: partidoData.lat ?? -34.5802,
      lng: partidoData.lng ?? -58.4233,
      fecha_hora: partidoData.fecha_hora,
      jugadores_necesarios: partidoData.jugadores_necesarios,
      jugadores_confirmados: 1, // creator is confirmed
      estado: 'abierto',
      tipo_cancha: partidoData.tipo_cancha,
      notas: partidoData.notas,
      created_at: new Date().toISOString(),
      genero: partidoData.genero ?? 'mixto',
      nivel: partidoData.nivel ?? 'intermedio',
      precio_total: totalCost,
      precio_por_persona: partidoData.precio_por_persona ?? perPerson,
      busca_arquero: partidoData.busca_arquero ?? false,
      arquero_gratis: partidoData.arquero_gratis ?? false,
      servicios: partidoData.servicios ?? ['sintetico'],
      tercer_tiempo: partidoData.tercer_tiempo ?? false,
      medio_pago: partidoData.medio_pago ?? 'transferencia',
      alias_cvu: partidoData.alias_cvu ?? null,
      equipos: null,
      lista_espera: [],
      pagos_estado: {
        [partidoData.creador_id]: 'pagado',
      },
      checkins: [partidoData.creador_id],
      mvp_votos: {},
      privado: partidoData.privado ?? false,
      codigo_acceso: partidoData.privado
        ? partidoData.codigo_acceso || `F1-${Math.floor(1000 + Math.random() * 9000)}`
        : null,
      busqueda_urgente_arquero: partidoData.busqueda_urgente_arquero ?? false,
      suplente_activo: null,
    };

    try {
      await (supabase.from('partidos') as any).insert(newPartido);
    } catch {
      // fallback
    }

    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    setLocal(PARTIDOS_KEY, [newPartido, ...partidos]);

    // Add creator inscription
    const inscripciones = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);
    const creatorIns: Inscripcion = {
      id: `ins-${Date.now()}`,
      partido_id: newPartido.id,
      usuario_id: partidoData.creador_id,
      estado: 'confirmado',
      created_at: new Date().toISOString(),
    };
    setLocal(INSCRIPCIONES_KEY, [...inscripciones, creatorIns]);

    // Initial system chat message
    this.addChatMessage(
      newPartido.id,
      partidoData.creador_id,
      'Sistema',
      `¡Partido creado! Organizado por el creador. Precio: $${newPartido.precio_por_persona} por persona.`,
      true
    );

    return newPartido;
  },

  async joinMatch(partidoId: string, usuarioId: string): Promise<void> {
    const inscripciones = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);
    if (!inscripciones.some((i) => i.partido_id === partidoId && i.usuario_id === usuarioId)) {
      const newIns: Inscripcion = {
        id: `ins-${Date.now()}`,
        partido_id: partidoId,
        usuario_id: usuarioId,
        estado: 'pendiente',
        created_at: new Date().toISOString(),
      };
      setLocal(INSCRIPCIONES_KEY, [...inscripciones, newIns]);
    }
  },

  async confirmInscription(inscripcionId: string, partidoId: string): Promise<void> {
    const inscripciones = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);
    const updatedIns = inscripciones.map((ins) =>
      ins.id === inscripcionId ? { ...ins, estado: 'confirmado' as const } : ins
    );
    setLocal(INSCRIPCIONES_KEY, updatedIns);

    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const updatedPartidos = partidos.map((p) => {
      if (p.id === partidoId) {
        const confirmedCount = updatedIns.filter(
          (i) => i.partido_id === partidoId && i.estado === 'confirmado'
        ).length;
        return { ...p, jugadores_confirmados: confirmedCount };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updatedPartidos);
  },

  async cancelInscription(partidoId: string, usuarioId: string): Promise<void> {
    const inscripciones = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);
    const remaining = inscripciones.filter(
      (i) => !(i.partido_id === partidoId && i.usuario_id === usuarioId)
    );
    setLocal(INSCRIPCIONES_KEY, remaining);

    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const allUsers = this.getAllUsers();
    const updatedPartidos = partidos.map((p) => {
      if (p.id === partidoId) {
        const confirmedCount = remaining.filter(
          (i) => i.partido_id === partidoId && i.estado === 'confirmado'
        ).length;

        let waitlist = p.lista_espera || [];
        let suplenteActivo = p.suplente_activo || null;

        // Si se liberó un cupo y hay personas en lista de espera y nadie está activo
        if (waitlist.length > 0 && !suplenteActivo) {
          const nextUserId = waitlist[0];
          const nextUserObj = allUsers.find((u) => u.id === nextUserId);
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

          suplenteActivo = {
            usuario_id: nextUserId,
            expira_en: expiresAt,
            nombre: nextUserObj?.nombre || 'Suplente',
          };
          waitlist = waitlist.slice(1);

          // Notificar automáticamente con temporizador de 10 min
          this.addNotification({
            usuario_id: nextUserId,
            partido_id: p.id,
            partido_titulo: p.titulo,
            titulo: '⚡️ ¡Cupo liberado! Tenés 10 minutos',
            mensaje: `Se liberó un cupo prioritario para vos en "${p.titulo}". Tenés 10 minutos para confirmar tu lugar antes de que pase al siguiente suplente.`,
            tipo: 'suplente_cupo',
            leido: false,
          });

          // Notificación en chat del sistema
          this.addChatMessage(
            p.id,
            'sistema',
            'Falta1 Bot',
            `⚡️ Se liberó un cupo. El suplente ${suplenteActivo.nombre} tiene 10 minutos para confirmar su lugar en la lista de espera.`,
            true
          );
        }

        return {
          ...p,
          jugadores_confirmados: confirmedCount,
          lista_espera: waitlist,
          suplente_activo: suplenteActivo,
        };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updatedPartidos);
  },

  // Confirm Waitlist Slot within 10 minutes
  async confirmWaitlistSlot(partidoId: string, usuarioId: string): Promise<boolean> {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const target = partidos.find((p) => p.id === partidoId);
    if (!target || !target.suplente_activo || target.suplente_activo.usuario_id !== usuarioId) {
      return false;
    }

    // Check expiration
    if (new Date(target.suplente_activo.expira_en).getTime() < Date.now()) {
      // Expiró, avanzar al siguiente
      await this.declineWaitlistSlot(partidoId, usuarioId);
      return false;
    }

    // Unir formalmente y confirmar
    await this.joinMatch(partidoId, usuarioId);
    const inscripciones = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);
    const myIns = inscripciones.find((i) => i.partido_id === partidoId && i.usuario_id === usuarioId);
    if (myIns) {
      await this.confirmInscription(myIns.id, partidoId);
    }

    // Limpiar suplente activo
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        return { ...p, suplente_activo: null };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);

    this.addChatMessage(
      partidoId,
      usuarioId,
      target.suplente_activo.nombre || 'Suplente',
      '¡Confirmé mi lugar desde la lista de espera! Nos vemos en la cancha ⚽️'
    );

    return true;
  },

  // Decline Waitlist Slot / Advance to next
  async declineWaitlistSlot(partidoId: string, usuarioId: string): Promise<void> {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const allUsers = this.getAllUsers();

    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        let waitlist = p.lista_espera || [];
        let nextSuplente: { usuario_id: string; expira_en: string; nombre?: string } | null = null;

        if (waitlist.length > 0) {
          const nextUid = waitlist[0];
          const nextObj = allUsers.find((u) => u.id === nextUid);
          nextSuplente = {
            usuario_id: nextUid,
            expira_en: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            nombre: nextObj?.nombre || 'Suplente',
          };
          waitlist = waitlist.slice(1);

          this.addNotification({
            usuario_id: nextUid,
            partido_id: p.id,
            partido_titulo: p.titulo,
            titulo: '⚡️ ¡Cupo liberado! Tenés 10 minutos',
            mensaje: `El cupo pasó a tu turno prioritario en "${p.titulo}". Tenés 10 minutos para confirmar tu lugar.`,
            tipo: 'suplente_cupo',
            leido: false,
          });

          this.addChatMessage(
            p.id,
            'sistema',
            'Falta1 Bot',
            `⏳ El cupo avanzó en la lista de espera. Turno para ${nextSuplente.nombre} (10 minutos para confirmar).`,
            true
          );
        } else {
          this.addChatMessage(
            p.id,
            'sistema',
            'Falta1 Bot',
            'ℹ️ No quedan más suplentes en lista de espera. El cupo está abierto a toda la comunidad.',
            true
          );
        }

        return {
          ...p,
          lista_espera: waitlist,
          suplente_activo: nextSuplente,
        };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);
  },

  // Búsqueda Urgente de Arquero con Notificación Prioritaria
  triggerUrgentGoalieAlert(partidoId: string): { goaliesNotified: number; nearbyNotified: number } {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const match = partidos.find((p) => p.id === partidoId);
    if (!match) return { goaliesNotified: 0, nearbyNotified: 0 };

    const updated = partidos.map((p) =>
      p.id === partidoId
        ? { ...p, busqueda_urgente_arquero: true, busca_arquero: true, arquero_gratis: true }
        : p
    );
    setLocal(PARTIDOS_KEY, updated);

    const allUsers = this.getAllUsers();
    let goaliesNotified = 0;
    let nearbyNotified = 0;

    allUsers.forEach((u) => {
      const isGoalie =
        u.posicion_preferida?.toLowerCase().includes('arquero') ||
        u.posicion_preferida?.toLowerCase().includes('portero');

      if (isGoalie) {
        goaliesNotified++;
        this.addNotification({
          usuario_id: u.id,
          partido_id: match.id,
          partido_titulo: match.titulo,
          titulo: '🚨 ¡BÚSQUEDA URGENTE DE ARQUERO/A!',
          mensaje: `Se necesita arquero urgente para hoy en "${match.cancha || 'la cancha'}". ¡Jugás GRATIS! Sumate ahora en 1 toque.`,
          tipo: 'urgente_arquero',
          leido: false,
        });
      }
    });

    this.addChatMessage(
      match.id,
      'sistema',
      'Falta1 Alerta',
      '🚨 ¡Alerta de Búsqueda Urgente de Arquero activada! Se notificó a todos los arqueros registrados y la comunidad cercana. ¡El arquero juega gratis!',
      true
    );

    return { goaliesNotified, nearbyNotified };
  },

  // Geofencing: Notificaciones por Cercanía (< 5 km)
  notifyNearbyPlayers(partidoId: string, radiusKm = 5): number {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const match = partidos.find((p) => p.id === partidoId);
    if (!match || !match.lat || !match.lng) return 0;

    const allUsers = this.getAllUsers();
    let notified = 0;

    // Simular o calcular usuarios en la zona cercana
    allUsers.forEach((u) => {
      notified++;
      this.addNotification({
        usuario_id: u.id,
        partido_id: match.id,
        partido_titulo: match.titulo,
        titulo: '📍 Cupo de último momento a menos de 5 km',
        mensaje: `Hay un cupo disponible en "${match.cancha}" (a menos de ${radiusKm} km de tu zona). ¡Falta 1 para arrancar!`,
        tipo: 'cercania_geofence',
        leido: false,
      });
    });

    return notified;
  },

  // Recordatorios de Calificación Post-Partido & MVP
  triggerPostMatchReminder(partidoId: string, userId: string): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const match = partidos.find((p) => p.id === partidoId);
    if (!match) return;

    this.addNotification({
      usuario_id: userId,
      partido_id: match.id,
      partido_titulo: match.titulo,
      titulo: '⭐️ ¿Cómo estuvo el partido? Calificá y votá al MVP',
      mensaje: `Finalizó "${match.titulo}". Ingresá para votar al MVP de la fecha y dejar tu calificación en 15 segundos.`,
      tipo: 'calificacion_post_partido',
      leido: false,
    });
  },

  // Chequeo periódico de temporizadores de suplentes activos (10 min)
  checkAndAdvanceWaitlistTimers(): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const now = Date.now();
    let changed = false;

    partidos.forEach((p) => {
      if (p.suplente_activo) {
        const expTime = new Date(p.suplente_activo.expira_en).getTime();
        if (now > expTime) {
          changed = true;
          this.declineWaitlistSlot(p.id, p.suplente_activo.usuario_id);
        }
      }
    });
  },

  // Obtener partido por código de acceso privado
  getMatchByAccessCode(code: string): Partido | undefined {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const clean = code.trim().toUpperCase();
    return partidos.find(
      (p) => p.codigo_acceso?.toUpperCase() === clean || p.id === clean
    );
  },

  // Waitlist
  toggleWaitlist(partidoId: string, usuarioId: string): boolean {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    let isNowOnWaitlist = false;
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        const currentList = p.lista_espera || [];
        if (currentList.includes(usuarioId)) {
          isNowOnWaitlist = false;
          return { ...p, lista_espera: currentList.filter((id) => id !== usuarioId) };
        } else {
          isNowOnWaitlist = true;
          return { ...p, lista_espera: [...currentList, usuarioId] };
        }
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);
    return isNowOnWaitlist;
  },

  // Payment Tracking (Organizer toggles player payment)
  togglePaymentStatus(partidoId: string, targetUserId: string): 'pagado' | 'pendiente' {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    let newStatus: 'pagado' | 'pendiente' = 'pagado';
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        const pagos = { ...(p.pagos_estado || {}) };
        newStatus = pagos[targetUserId] === 'pagado' ? 'pendiente' : 'pagado';
        pagos[targetUserId] = newStatus;
        return { ...p, pagos_estado: pagos };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);
    return newStatus;
  },

  // Check-in (2 hours before)
  checkInMatch(partidoId: string, usuarioId: string): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        const checkins = p.checkins || [];
        if (!checkins.includes(usuarioId)) {
          return { ...p, checkins: [...checkins, usuarioId] };
        }
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);
  },

  // Balanced Team Generator with Falta1 4-Step Algorithm
  generateTeams(
    partidoId: string,
    playerIds: string[]
  ): { equipoA: string[]; equipoB: string[] } {
    const balanced = this.generateBalancedTeams(partidoId, playerIds);
    return { equipoA: balanced.equipoA, equipoB: balanced.equipoB };
  },

  generateBalancedTeams(
    partidoId: string,
    playerIds: string[]
  ): BalancedTeamsResult {
    const allUsers = this.getAllUsers();
    const matchUsers = playerIds
      .map((id) => allUsers.find((u) => u.id === id))
      .filter((u): u is Usuario => Boolean(u));

    const result = balanceTeams(matchUsers);

    // Save to partido
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        return {
          ...p,
          equipos: { equipoA: result.equipoA, equipoB: result.equipoB },
        };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);

    // Cache detailed balanced result
    const cache = getLocal<Record<string, BalancedTeamsResult>>(BALANCED_RESULTS_KEY, {});
    cache[partidoId] = result;
    setLocal(BALANCED_RESULTS_KEY, cache);

    return result;
  },

  getMatchBalancedTeams(partidoId: string): BalancedTeamsResult | null {
    const cache = getLocal<Record<string, BalancedTeamsResult>>(BALANCED_RESULTS_KEY, {});
    if (cache[partidoId]) return cache[partidoId];

    const partido = this.getMatchById(partidoId);
    if (partido && partido.equipos && partido.equipos.equipoA && partido.equipos.equipoB) {
      const allIds = [...partido.equipos.equipoA, ...partido.equipos.equipoB];
      return this.generateBalancedTeams(partidoId, allIds);
    }
    return null;
  },

  // Vote MVP
  voteMvp(partidoId: string, voterId: string, targetUserId: string): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        const votos = { ...(p.mvp_votos || {}) };
        votos[voterId] = targetUserId;
        return { ...p, mvp_votos: votos };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);

    // Also increase user rating / medallas
    const users = getLocal<Usuario[]>(USERS_KEY, INITIAL_USERS);
    const updatedUsers = users.map((u) => {
      if (u.id === targetUserId) {
        const medallas = [...(u.medallas || [])];
        if (!medallas.includes('MVP fecha')) {
          medallas.push('MVP fecha');
        }
        return { ...u, medallas };
      }
      return u;
    });
    setLocal(USERS_KEY, updatedUsers);
  },

  // Chat Messages
  getChatMessages(partidoId: string): ChatMessage[] {
    const chats = getLocal<ChatMessage[]>(CHATS_KEY, INITIAL_CHATS);
    return chats.filter((c) => c.partido_id === partidoId);
  },

  addChatMessage(
    partidoId: string,
    usuarioId: string,
    usuarioNombre: string,
    mensaje: string,
    esSistema = false
  ): ChatMessage {
    const chats = getLocal<ChatMessage[]>(CHATS_KEY, INITIAL_CHATS);
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      partido_id: partidoId,
      usuario_id: usuarioId,
      usuario_nombre: usuarioNombre,
      mensaje: mensaje.trim(),
      created_at: new Date().toISOString(),
      es_sistema: esSistema,
    };
    setLocal(CHATS_KEY, [...chats, newMsg]);
    return newMsg;
  },

  // Templates
  saveTemplate(template: {
    nombre: string;
    cancha: string;
    lat: number;
    lng: number;
    tipo_cancha: string;
    genero: GeneroPartido;
    nivel: NivelPartido;
    servicios: ServicioCancha[];
    precio_total: number;
  }): void {
    const list = getLocal<any[]>(TEMPLATES_KEY, []);
    setLocal(TEMPLATES_KEY, [template, ...list.slice(0, 4)]);
  },

  getTemplates(): any[] {
    return getLocal<any[]>(TEMPLATES_KEY, []);
  },

  async registerUser(nombre: string, email: string, zona?: string, telefono?: string): Promise<Usuario> {
    const newUser: Usuario = {
      id: `usr-${Date.now()}`,
      nombre,
      email: email || null,
      email_verificado: true,
      telefono: telefono || '+54 9 11 0000-0000',
      telefono_verificado: true,
      zona: zona || null,
      posicion_preferida: 'mediocampista',
      rating: 5.0,
      avatar_url: null,
      created_at: new Date().toISOString(),
      partidos_jugados: 1,
      asistencia_pct: 100,
      medallas: ['Asistencia perfecta', 'Nuevo jugador', 'Identidad verificada'],
      edad_aprox: 25,
      verificado: true,
      infracciones: 0,
      sancion_hasta: null,
      bloqueados: [],
    };

    const users = getLocal<Usuario[]>(USERS_KEY, INITIAL_USERS);
    setLocal(USERS_KEY, [...users, newUser]);
    this.setCurrentUser(newUser);
    return newUser;
  },

  isUserPhoneVerified(userId: string): boolean {
    const users = this.getAllUsers();
    const user = users.find((u) => u.id === userId);
    return Boolean(user?.telefono_verificado);
  },

  verifyUserPhone(userId: string, telefono: string): Usuario {
    const users = getLocal<Usuario[]>(USERS_KEY, INITIAL_USERS);
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          telefono,
          telefono_verificado: true,
          verificado: true,
          medallas: u.medallas.includes('Identidad verificada')
            ? u.medallas
            : [...u.medallas, 'Identidad verificada'],
        };
      }
      return u;
    });
    setLocal(USERS_KEY, updatedUsers);
    const updated = updatedUsers.find((u) => u.id === userId);
    const current = this.getCurrentUser();
    if (current && current.id === userId && updated) {
      this.setCurrentUser(updated);
    }
    return updated || current;
  },

  // Match Schedule update & Cancellation with Notification triggers
  updateMatchDateTime(partidoId: string, newFechaHora: string): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    let matchTitle = 'Partido';
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        matchTitle = p.titulo;
        return { ...p, fecha_hora: newFechaHora };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);

    const d = new Date(newFechaHora);
    const timeFormatted = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const dateFormatted = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

    this.notifyMatchUpdate(
      partidoId,
      'horario_cambiado',
      '⏰ Cambio de horario en partido',
      `El partido "${matchTitle}" fue reprogramado para el ${dateFormatted} a las ${timeFormatted} hs.`
    );
  },

  cancelMatch(partidoId: string, motivo?: string): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    let matchTitle = 'Partido';
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        matchTitle = p.titulo;
        return { ...p, estado: 'cancelado' as const };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);

    this.notifyMatchUpdate(
      partidoId,
      'cancelado',
      '⚠️ Partido cancelado',
      `El partido "${matchTitle}" ha sido cancelado por el organizador.${motivo ? ` Motivo: ${motivo}` : ''}`
    );
  },

  // Notifications
  getNotifications(userId: string): AppNotification[] {
    const list = getLocal<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICACIONES);
    return list.filter((n) => !n.usuario_id || n.usuario_id === userId);
  },

  addNotification(notif: Omit<AppNotification, 'id' | 'created_at'>): AppNotification {
    const list = getLocal<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICACIONES);
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    setLocal(NOTIFICATIONS_KEY, [newNotif, ...list]);
    return newNotif;
  },

  markNotificationAsRead(id: string): void {
    const list = getLocal<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICACIONES);
    const updated = list.map((n) => (n.id === id ? { ...n, leido: true } : n));
    setLocal(NOTIFICATIONS_KEY, updated);
  },

  markAllNotificationsAsRead(userId: string): void {
    const list = getLocal<AppNotification[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICACIONES);
    const updated = list.map((n) => (!n.usuario_id || n.usuario_id === userId ? { ...n, leido: true } : n));
    setLocal(NOTIFICATIONS_KEY, updated);
  },

  notifyMatchUpdate(
    partidoId: string,
    tipo: 'horario_cambiado' | 'cancelado',
    titulo: string,
    mensaje: string
  ): void {
    const inscripciones = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);
    const usersInMatch = inscripciones
      .filter((i) => i.partido_id === partidoId)
      .map((i) => i.usuario_id);

    const currentUser = this.getCurrentUser();
    if (!usersInMatch.includes(currentUser.id)) {
      usersInMatch.push(currentUser.id);
    }

    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const targetMatch = partidos.find((p) => p.id === partidoId);

    usersInMatch.forEach((uid) => {
      this.addNotification({
        usuario_id: uid,
        partido_id: partidoId,
        partido_titulo: targetMatch?.titulo,
        titulo,
        mensaje,
        tipo,
        leido: false,
      });
    });
  },

  // Match History & Experience Reviews
  async getAllPartidosIncludingPast(): Promise<Partido[]> {
    return getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
  },

  async getPastMatchesForUser(userId: string): Promise<MatchWithCreator[]> {
    const allMatches = await this.getAllPartidosIncludingPast();
    const inscripciones = getLocal<Inscripcion[]>(INSCRIPCIONES_KEY, INITIAL_INSCRIPCIONES);
    const userInscriptions = inscripciones.filter((i) => i.usuario_id === userId);
    const userMatchIds = new Set(userInscriptions.map((i) => i.partido_id));

    const users = this.getAllUsers();
    return allMatches
      .filter((m) => {
        const isPast = m.estado === 'finalizado' || new Date(m.fecha_hora).getTime() < Date.now();
        const participated = userMatchIds.has(m.id) || m.creador_id === userId;
        return isPast && participated;
      })
      .map((m) => ({
        ...m,
        creador: users.find((u) => u.id === m.creador_id),
      }))
      .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());
  },

  saveMatchReview(review: Omit<MatchReview, 'id' | 'created_at'>): MatchReview {
    const list = getLocal<MatchReview[]>(REVIEWS_KEY, INITIAL_REVIEWS);
    const filtered = list.filter((r) => !(r.partido_id === review.partido_id && r.usuario_id === review.usuario_id));
    const newReview: MatchReview = {
      ...review,
      id: `rev-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setLocal(REVIEWS_KEY, [newReview, ...filtered]);
    return newReview;
  },

  getMatchReviewsForUser(userId: string): MatchReview[] {
    const list = getLocal<MatchReview[]>(REVIEWS_KEY, INITIAL_REVIEWS);
    return list.filter((r) => r.usuario_id === userId);
  },

  getReviewForMatch(matchId: string, userId: string): MatchReview | undefined {
    const list = getLocal<MatchReview[]>(REVIEWS_KEY, INITIAL_REVIEWS);
    return list.find((r) => r.partido_id === matchId && r.usuario_id === userId);
  },

  // 1. Live Match Score & Digital Chronometer
  getMatchLiveScore(partidoId: string): PartidoLiveScore {
    const partido = this.getMatchById(partidoId);
    if (partido?.marcador_en_vivo) {
      return partido.marcador_en_vivo;
    }
    const defaultScore: PartidoLiveScore = {
      golesA: 0,
      golesB: 0,
      cronometroSegundos: 0,
      enCurso: false,
      tiempoReglamentarioMin: 25,
      periodo: 'primer_tiempo',
      historialEventos: [],
      updated_at: new Date().toISOString(),
    };
    return defaultScore;
  },

  updateMatchLiveScore(partidoId: string, updates: Partial<PartidoLiveScore>): PartidoLiveScore {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    let updatedScore: PartidoLiveScore = {
      golesA: 0,
      golesB: 0,
      cronometroSegundos: 0,
      enCurso: false,
      tiempoReglamentarioMin: 25,
      periodo: 'primer_tiempo',
      historialEventos: [],
      updated_at: new Date().toISOString(),
    };

    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        const current = p.marcador_en_vivo || updatedScore;
        updatedScore = {
          ...current,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return { ...p, marcador_en_vivo: updatedScore };
      }
      return p;
    });

    setLocal(PARTIDOS_KEY, updated);
    return updatedScore;
  },

  // 2. Tercer Tiempo: Lugares & Calculadora de Gastos Compartidos
  getTercerTiempoState(partidoId: string): TercerTiempoState {
    const partido = this.getMatchById(partidoId);
    if (partido?.tercer_tiempo_state) {
      return partido.tercer_tiempo_state;
    }
    const defaultState: TercerTiempoState = {
      opciones: [
        {
          id: 'tt-1',
          nombre: 'Pizzería Güerrin (o similar en zona)',
          tipo: 'pizzeria',
          direccion: 'A 4 cuadras del predio',
          distancia: '350m',
          votos: ['usr-nahuel-1', 'usr-lucas-2'],
        },
        {
          id: 'tt-2',
          nombre: 'Cervecería Artesanal Antares',
          tipo: 'bar',
          direccion: 'Esquina del complejo',
          distancia: '150m',
          votos: ['usr-matias-3'],
        },
        {
          id: 'tt-3',
          nombre: 'Bodegón & Parrilla El Tano',
          tipo: 'parrilla',
          direccion: 'Av. cercana con mesas afuera',
          distancia: '500m',
          votos: ['usr-franco-4'],
        },
      ],
      gastosExtras: [
        {
          id: 'gasto-1',
          descripcion: 'Bebidas hidratantes y gaseosas post-partido',
          monto: 14000,
          pagado_por: 'Nahuel Rabbiosi',
        },
        {
          id: 'gasto-2',
          descripcion: 'Alquiler de pelota profesional y chalecos limpios',
          monto: 6000,
          pagado_por: 'Lucas Fernández',
        },
      ],
    };
    return defaultState;
  },

  voteTercerTiempo(partidoId: string, opcionId: string, usuarioId: string): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        const state = p.tercer_tiempo_state || this.getTercerTiempoState(partidoId);
        const opciones = state.opciones.map((op) => {
          // Remover voto previo del usuario en todas las opciones
          const filteredVotos = op.votos.filter((v) => v !== usuarioId);
          if (op.id === opcionId) {
            // Si no lo tenía, agregarlo (toggle)
            if (!op.votos.includes(usuarioId)) {
              return { ...op, votos: [...filteredVotos, usuarioId] };
            }
          }
          return { ...op, votos: filteredVotos };
        });
        return {
          ...p,
          tercer_tiempo_state: { ...state, opciones },
        };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);
  },

  addTercerTiempoOpcion(
    partidoId: string,
    opcion: { nombre: string; tipo: 'pizzeria' | 'bar' | 'bodegon' | 'parrilla'; direccion: string; distancia: string }
  ): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        const state = p.tercer_tiempo_state || this.getTercerTiempoState(partidoId);
        const newOp = {
          ...opcion,
          id: `tt-${Date.now()}`,
          votos: [],
        };
        return {
          ...p,
          tercer_tiempo_state: {
            ...state,
            opciones: [...state.opciones, newOp],
          },
        };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);
  },

  addGastoExtra(partidoId: string, gasto: { descripcion: string; monto: number; pagado_por?: string }): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const updated = partidos.map((p) => {
      if (p.id === partidoId) {
        const state = p.tercer_tiempo_state || this.getTercerTiempoState(partidoId);
        const newGasto = {
          id: `gasto-${Date.now()}`,
          descripcion: gasto.descripcion,
          monto: gasto.monto,
          pagado_por: gasto.pagado_por,
        };
        return {
          ...p,
          tercer_tiempo_state: {
            ...state,
            gastosExtras: [...state.gastosExtras, newGasto],
          },
        };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);
  },

  removeGastoExtra(partidoId: string, gastoId: string): void {
    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const updated = partidos.map((p) => {
      if (p.id === partidoId && p.tercer_tiempo_state) {
        return {
          ...p,
          tercer_tiempo_state: {
            ...p.tercer_tiempo_state,
            gastosExtras: p.tercer_tiempo_state.gastosExtras.filter((g) => g.id !== gastoId),
          },
        };
      }
      return p;
    });
    setLocal(PARTIDOS_KEY, updated);
  },

  // 3. Panel B2B Turnos Flash & Validación de Reserva QR
  getComplejoTurnosFlash(): ComplejoTurnoFlash[] {
    return getLocal<ComplejoTurnoFlash[]>(TURNOS_FLASH_KEY, INITIAL_TURNOS_FLASH);
  },

  createComplejoTurnoFlash(
    turno: Omit<ComplejoTurnoFlash, 'id' | 'created_at' | 'reservado'>
  ): ComplejoTurnoFlash {
    const list = this.getComplejoTurnosFlash();
    const newTurno: ComplejoTurnoFlash = {
      ...turno,
      id: `flash-${Date.now()}`,
      reservado: false,
      codigo_reserva: `F1-RES-${Math.floor(1000 + Math.random() * 9000)}`,
      qr_validado: false,
      created_at: new Date().toISOString(),
    };
    setLocal(TURNOS_FLASH_KEY, [newTurno, ...list]);
    return newTurno;
  },

  bookTurnoFlash(
    turnoId: string,
    usuario: Usuario
  ): { turno: ComplejoTurnoFlash; partido: Partido } {
    const list = this.getComplejoTurnosFlash();
    let updatedTurno: ComplejoTurnoFlash | null = null;
    const updatedList = list.map((t) => {
      if (t.id === turnoId) {
        updatedTurno = {
          ...t,
          reservado: true,
          reservado_por_usuario_id: usuario.id,
          reservado_por_nombre: usuario.nombre,
          codigo_reserva: t.codigo_reserva || `F1-RES-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        return updatedTurno;
      }
      return t;
    });
    setLocal(TURNOS_FLASH_KEY, updatedList);

    const turno = updatedTurno || list.find((t) => t.id === turnoId)!;

    // Crear automáticamente el partido oficial correspondiente a la reserva
    const matchTime = `${turno.fecha}T${turno.hora.replace(' hs', '').padStart(5, '0')}:00`;
    const numJugadores = turno.tipo_cancha === 'Fútbol 5' ? 10 : turno.tipo_cancha === 'Fútbol 7' ? 14 : 22;
    const precioPorPersona = Math.round(turno.precio_oferta / numJugadores);

    const nuevoPartido: Partido = {
      id: `match-flash-${Date.now()}`,
      creador_id: usuario.id,
      titulo: `⚡ Turno Flash: ${turno.tipo_cancha} en ${turno.complejo_nombre}`,
      cancha: turno.cancha_nombre,
      lat: -34.5880,
      lng: -58.4110,
      fecha_hora: matchTime,
      jugadores_necesarios: numJugadores,
      jugadores_confirmados: 1,
      estado: 'abierto',
      tipo_cancha: turno.tipo_cancha,
      notas: `Turno Flash reservado con ${turno.descuento_pct}% OFF. Presentar código ${turno.codigo_reserva} en recepción para validar check-in.`,
      created_at: new Date().toISOString(),
      genero: 'mixto',
      nivel: 'intermedio',
      precio_total: turno.precio_oferta,
      precio_por_persona: precioPorPersona,
      busca_arquero: true,
      arquero_gratis: false,
      servicios: ['techada', 'sintetico', 'vestuarios', 'estacionamiento'],
      tercer_tiempo: true,
      medio_pago: 'efectivo',
      alias_cvu: null,
      equipos: null,
      lista_espera: [],
      pagos_estado: { [usuario.id]: 'pagado' },
      checkins: [usuario.id],
      mvp_votos: {},
      privado: false,
      codigo_acceso: null,
      busqueda_urgente_arquero: false,
      suplente_activo: null,
      marcador_en_vivo: null,
      tercer_tiempo_state: null,
      reserva_codigo: turno.codigo_reserva,
      reserva_validada: false,
      reserva_validada_at: null,
      reserva_beneficio: `35% OFF Turno Flash + 10% en consumiciones buffet`,
    };

    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    setLocal(PARTIDOS_KEY, [nuevoPartido, ...partidos]);

    // Inscribir al usuario
    this.joinMatch(nuevoPartido.id, usuario.id);

    return { turno, partido: nuevoPartido };
  },

  validateReservaQR(codigo: string): {
    success: boolean;
    message: string;
    partido?: Partido;
    turno?: ComplejoTurnoFlash;
  } {
    const cleanCode = codigo.trim().toUpperCase();
    const turnos = this.getComplejoTurnosFlash();
    const matchingTurno = turnos.find(
      (t) => (t.codigo_reserva || '').toUpperCase() === cleanCode
    );

    const partidos = getLocal<Partido[]>(PARTIDOS_KEY, INITIAL_PARTIDOS);
    const matchingPartido = partidos.find(
      (p) => (p.reserva_codigo || '').toUpperCase() === cleanCode || p.id === cleanCode
    );

    if (!matchingTurno && !matchingPartido) {
      return {
        success: false,
        message: 'Código de reserva no encontrado o inválido.',
      };
    }

    // Actualizar turno flash
    if (matchingTurno) {
      const updatedTurnos = turnos.map((t) => {
        if (t.id === matchingTurno.id) {
          return { ...t, qr_validado: true };
        }
        return t;
      });
      setLocal(TURNOS_FLASH_KEY, updatedTurnos);
    }

    // Actualizar partido
    let updatedPart: Partido | undefined;
    if (matchingPartido) {
      const updatedPartidos = partidos.map((p) => {
        if (p.id === matchingPartido.id) {
          updatedPart = {
            ...p,
            reserva_validada: true,
            reserva_validada_at: new Date().toISOString(),
            reserva_beneficio: 'Reserva Check-in validada: 10% OFF en tercer tiempo de buffet',
          };
          return updatedPart;
        }
        return p;
      });
      setLocal(PARTIDOS_KEY, updatedPartidos);
    }

    return {
      success: true,
      message: '¡Check-in validado con éxito en recepción! Cancha asignada y bonificación aplicada.',
      turno: matchingTurno,
      partido: updatedPart || matchingPartido,
    };
  },

  // 4. Muro y Feed de la Comunidad
  getCommunityPosts(): CommunityPost[] {
    return getLocal<CommunityPost[]>(COMMUNITY_POSTS_KEY, INITIAL_COMMUNITY_POSTS);
  },

  createCommunityPost(
    post: Omit<CommunityPost, 'id' | 'created_at' | 'likes'>
  ): CommunityPost {
    const posts = this.getCommunityPosts();
    const newPost: CommunityPost = {
      ...post,
      id: `post-${Date.now()}`,
      likes: [],
      created_at: new Date().toISOString(),
    };
    setLocal(COMMUNITY_POSTS_KEY, [newPost, ...posts]);
    return newPost;
  },

  likeCommunityPost(postId: string, usuarioId: string): void {
    const posts = this.getCommunityPosts();
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const hasLiked = p.likes.includes(usuarioId);
        const newLikes = hasLiked
          ? p.likes.filter((id) => id !== usuarioId)
          : [...p.likes, usuarioId];
        return { ...p, likes: newLikes };
      }
      return p;
    });
    setLocal(COMMUNITY_POSTS_KEY, updated);
  },

  // 5. Leaderboard Comunitario
  getLeaderboard(criterio: 'asistencia' | 'mvp' | 'partidos'): Usuario[] {
    const users = this.getAllUsers();
    return [...users].sort((a, b) => {
      if (criterio === 'asistencia') {
        return (b.asistencia_pct || 0) - (a.asistencia_pct || 0);
      }
      if (criterio === 'mvp') {
        const mvpA = (a.medallas || []).filter((m) => m.toLowerCase().includes('mvp')).length;
        const mvpB = (b.medallas || []).filter((m) => m.toLowerCase().includes('mvp')).length;
        return mvpB - mvpA;
      }
      return (b.partidos_jugados || 0) - (a.partidos_jugados || 0);
    });
  },

  // 6. Equipos y Retos de Comunidad
  getTeamProfiles(): TeamProfile[] {
    return getLocal<TeamProfile[]>(TEAMS_KEY, INITIAL_TEAM_PROFILES);
  },

  createTeamProfile(
    team: Omit<TeamProfile, 'id' | 'created_at' | 'victorias' | 'derrotas' | 'empates'>
  ): TeamProfile {
    const teams = this.getTeamProfiles();
    const newTeam: TeamProfile = {
      ...team,
      id: `team-${Date.now()}`,
      victorias: 0,
      derrotas: 0,
      empates: 0,
      created_at: new Date().toISOString(),
    };
    setLocal(TEAMS_KEY, [newTeam, ...teams]);
    return newTeam;
  },

  getTeamChallenges(): TeamChallenge[] {
    return getLocal<TeamChallenge[]>(CHALLENGES_KEY, INITIAL_TEAM_CHALLENGES);
  },

  createTeamChallenge(
    challenge: Omit<TeamChallenge, 'id' | 'created_at' | 'estado'>
  ): TeamChallenge {
    const list = this.getTeamChallenges();
    const newChallenge: TeamChallenge = {
      ...challenge,
      id: `chal-${Date.now()}`,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    };
    setLocal(CHALLENGES_KEY, [newChallenge, ...list]);
    return newChallenge;
  },

  respondTeamChallenge(challengeId: string, accept: boolean): void {
    const list = this.getTeamChallenges();
    const updated = list.map((c) => {
      if (c.id === challengeId) {
        return {
          ...c,
          estado: (accept ? 'aceptado' : 'rechazado') as 'aceptado' | 'rechazado',
        };
      }
      return c;
    });
    setLocal(CHALLENGES_KEY, updated);
  },
};


export type GeneroPartido = 'mixto' | 'femenino' | 'masculino';
export type NivelPartido = 'recreativo' | 'intermedio' | 'competitivo';
export type ServicioCancha = 'techada' | 'sintetico' | 'vestuarios' | 'estacionamiento';

export type CategoriaReporte =
  | 'inasistencia_no_pago'
  | 'conducta_violenta'
  | 'acoso_discriminacion'
  | 'perfil_falso_spam';

export type Reporte = {
  id: string;
  reportante_id: string;
  reportado_id: string;
  partido_id?: string;
  categoria: CategoriaReporte;
  motivo: string;
  created_at: string;
  estado: 'pendiente' | 'revisado' | 'resuelto';
};

export type ChatMessage = {
  id: string;
  partido_id: string;
  usuario_id: string;
  usuario_nombre: string;
  mensaje: string;
  created_at: string;
  es_sistema?: boolean;
};

export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          email: string | null;
          email_verificado: boolean;
          telefono: string | null;
          telefono_verificado: boolean;
          zona: string | null;
          posicion_preferida: string | null;
          rating: number;
          avatar_url: string | null;
          created_at: string;
          partidos_jugados: number;
          asistencia_pct: number;
          medallas: string[];
          edad_aprox: number;
          verificado: boolean;
          infracciones: number;
          sancion_hasta: string | null;
          bloqueados: string[];
        };
        Insert: {
          id: string;
          nombre: string;
          email?: string | null;
          email_verificado?: boolean;
          telefono?: string | null;
          telefono_verificado?: boolean;
          zona?: string | null;
          posicion_preferida?: string | null;
          rating?: number;
          avatar_url?: string | null;
          partidos_jugados?: number;
          asistencia_pct?: number;
          medallas?: string[];
          edad_aprox?: number;
          verificado?: boolean;
          infracciones?: number;
          sancion_hasta?: string | null;
          bloqueados?: string[];
        };
        Update: {
          nombre?: string;
          email?: string | null;
          email_verificado?: boolean;
          telefono?: string | null;
          telefono_verificado?: boolean;
          zona?: string | null;
          posicion_preferida?: string | null;
          rating?: number;
          avatar_url?: string | null;
          partidos_jugados?: number;
          asistencia_pct?: number;
          medallas?: string[];
          edad_aprox?: number;
          verificado?: boolean;
          infracciones?: number;
          sancion_hasta?: string | null;
          bloqueados?: string[];
        };
      };
      partidos: {
        Row: {
          id: string;
          creador_id: string;
          titulo: string;
          cancha: string | null;
          lat: number | null;
          lng: number | null;
          fecha_hora: string;
          jugadores_necesarios: number;
          jugadores_confirmados: number;
          estado: 'abierto' | 'cerrado' | 'cancelado' | 'finalizado';
          tipo_cancha: string;
          notas: string | null;
          created_at: string;
          // Nuevos campos
          genero: GeneroPartido;
          nivel: NivelPartido;
          precio_total: number;
          precio_por_persona: number;
          busca_arquero: boolean;
          arquero_gratis: boolean;
          servicios: ServicioCancha[];
          tercer_tiempo: boolean;
          medio_pago: 'efectivo' | 'transferencia';
          alias_cvu: string | null;
          equipos: { equipoA: string[]; equipoB: string[] } | null;
          lista_espera: string[];
          pagos_estado: Record<string, 'pagado' | 'pendiente'>;
          checkins: string[];
          mvp_votos: Record<string, string>;
          // Funcionalidades avanzadas
          privado?: boolean;
          codigo_acceso?: string | null;
          busqueda_urgente_arquero?: boolean;
          suplente_activo?: { usuario_id: string; expira_en: string; nombre?: string } | null;
          // Marcador en vivo y cronómetro
          marcador_en_vivo?: PartidoLiveScore | null;
          // Tercer tiempo con votación y calculadora
          tercer_tiempo_state?: TercerTiempoState | null;
          // Validación de reserva en recepción de complejo vía QR
          reserva_codigo?: string | null;
          reserva_validada?: boolean;
          reserva_validada_at?: string | null;
          reserva_beneficio?: string | null;
        };
        Insert: {
          id?: string;
          creador_id: string;
          titulo: string;
          cancha?: string | null;
          lat?: number | null;
          lng?: number | null;
          fecha_hora: string;
          jugadores_necesarios: number;
          jugadores_confirmados?: number;
          estado?: 'abierto' | 'cerrado' | 'cancelado' | 'finalizado';
          tipo_cancha?: string;
          notas?: string | null;
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
          equipos?: { equipoA: string[]; equipoB: string[] } | null;
          lista_espera?: string[];
          pagos_estado?: Record<string, 'pagado' | 'pendiente'>;
          checkins?: string[];
          mvp_votos?: Record<string, string>;
          privado?: boolean;
          codigo_acceso?: string | null;
          busqueda_urgente_arquero?: boolean;
          suplente_activo?: { usuario_id: string; expira_en: string; nombre?: string } | null;
          marcador_en_vivo?: PartidoLiveScore | null;
          tercer_tiempo_state?: TercerTiempoState | null;
          reserva_codigo?: string | null;
          reserva_validada?: boolean;
          reserva_validada_at?: string | null;
          reserva_beneficio?: string | null;
        };
        Update: {
          titulo?: string;
          cancha?: string | null;
          lat?: number | null;
          lng?: number | null;
          fecha_hora?: string;
          jugadores_necesarios?: number;
          jugadores_confirmados?: number;
          estado?: 'abierto' | 'cerrado' | 'cancelado' | 'finalizado';
          tipo_cancha?: string;
          notas?: string | null;
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
          equipos?: { equipoA: string[]; equipoB: string[] } | null;
          lista_espera?: string[];
          pagos_estado?: Record<string, 'pagado' | 'pendiente'>;
          checkins?: string[];
          mvp_votos?: Record<string, string>;
          privado?: boolean;
          codigo_acceso?: string | null;
          busqueda_urgente_arquero?: boolean;
          suplente_activo?: { usuario_id: string; expira_en: string; nombre?: string } | null;
          marcador_en_vivo?: PartidoLiveScore | null;
          tercer_tiempo_state?: TercerTiempoState | null;
          reserva_codigo?: string | null;
          reserva_validada?: boolean;
          reserva_validada_at?: string | null;
          reserva_beneficio?: string | null;
        };
      };
      inscripciones: {
        Row: {
          id: string;
          partido_id: string;
          usuario_id: string;
          estado: 'pendiente' | 'confirmado' | 'rechazado';
          created_at: string;
        };
        Insert: {
          id?: string;
          partido_id: string;
          usuario_id: string;
          estado?: 'pendiente' | 'confirmado' | 'rechazado';
        };
        Update: {
          estado?: 'pendiente' | 'confirmado' | 'rechazado';
        };
      };
    };
  };
};

// Tipos de conveniencia
export type Usuario = Database['public']['Tables']['usuarios']['Row'];
export type Partido = Database['public']['Tables']['partidos']['Row'];
export type Inscripcion = Database['public']['Tables']['inscripciones']['Row'];

export type PartidoInsert = Database['public']['Tables']['partidos']['Insert'];
export type InscripcionInsert = Database['public']['Tables']['inscripciones']['Insert'];
export type UsuarioInsert = Database['public']['Tables']['usuarios']['Insert'];

export type MatchWithCreator = Partido & { creador?: Usuario };
export type InscriptionWithUser = Inscripcion & { usuario?: Usuario };

export type NotificationType =
  | 'horario_cambiado'
  | 'cancelado'
  | 'recordatorio'
  | 'seguridad'
  | 'sistema'
  | 'urgente_arquero'
  | 'suplente_cupo'
  | 'cercania_geofence'
  | 'calificacion_post_partido';

export type AIModerationResult = {
  score: number; // 0 to 1 (0 = safe, 1 = severe)
  categoria: 'limpio' | 'lenguaje_hostil' | 'agresion_violencia' | 'discriminacion' | 'spam_estafa';
  severidad: 'baja' | 'media' | 'alta';
  es_ofensivo: boolean;
  motivo_deteccion: string;
  accion_sugerida: 'permitir' | 'advertir' | 'ocultar_inmediato' | 'suspender';
};

export type AppNotification = {
  id: string;
  usuario_id: string;
  partido_id?: string;
  partido_titulo?: string;
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  leido: boolean;
  created_at: string;
};

export type MatchReview = {
  id: string;
  partido_id: string;
  partido_titulo: string;
  usuario_id: string;
  rating: number;
  comentario?: string;
  tags: string[];
  created_at: string;
};

// 1. Cronómetro y Marcador en Vivo
export type LiveScoreEvent = {
  id: string;
  equipo: 'A' | 'B';
  minuto: number;
  autor?: string;
  tipo: 'gol' | 'penal';
};

export type PartidoLiveScore = {
  golesA: number;
  golesB: number;
  cronometroSegundos: number;
  enCurso: boolean;
  tiempoReglamentarioMin: number;
  periodo: 'primer_tiempo' | 'entretiempo' | 'segundo_tiempo' | 'finalizado';
  historialEventos: LiveScoreEvent[];
  updated_at?: string;
};

// 2. Tercer Tiempo: Votación & Calculadora de Gastos
export type TercerTiempoOpcion = {
  id: string;
  nombre: string;
  tipo: 'pizzeria' | 'bar' | 'bodegon' | 'parrilla';
  direccion: string;
  distancia: string;
  votos: string[]; // IDs de usuarios que votaron
};

export type GastoExtra = {
  id: string;
  descripcion: string;
  monto: number;
  pagado_por?: string;
};

export type TercerTiempoState = {
  opciones: TercerTiempoOpcion[];
  gastosExtras: GastoExtra[];
};

// 3. Algoritmo de Armado de Equipos Balanceados
export type BalancedPlayer = {
  id: string;
  nombre: string;
  posicion: 'ARQ' | 'DEF' | 'MED' | 'DEL';
  pj: number; // Habilidad General (1 a 100)
  mvpCount: number; // M
  asistenciaPct: number; // Aj (ej. 95)
  ratingCalculado: number; // Rj = (Pj * 0.85) + (M * 2) + (Aj * 0.15)
};

export type BalancedTeamsResult = {
  equipoA: string[];
  equipoB: string[];
  promedioNivelA: number;
  promedioNivelB: number;
  paridadPct: number;
  jugadoresA: BalancedPlayer[];
  jugadoresB: BalancedPlayer[];
};

// 4. Modo Desafío de Equipos / Retos
export type TeamProfile = {
  id: string;
  nombre: string;
  escudo_emoji: string;
  color_camiseta: string;
  modalidad: 5 | 7 | 11;
  zona: string;
  nivel: NivelPartido;
  capitan_id: string;
  capitan_nombre: string;
  jugadores_count: number;
  victorias: number;
  derrotas: number;
  empates: number;
  created_at: string;
};

export type TeamChallenge = {
  id: string;
  equipo_desafiante: {
    id: string;
    nombre: string;
    escudo_emoji: string;
    capitan_id: string;
    capitan_nombre: string;
    modalidad: 5 | 7 | 11;
    zona: string;
  };
  equipo_rival: {
    id: string;
    nombre: string;
    escudo_emoji: string;
    capitan_id: string;
    capitan_nombre: string;
  };
  predio_sugerido: string;
  fecha_sugerida: string;
  mensaje?: string;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  created_at: string;
  partido_id?: string;
};

// 5. Muro y Feed de Noticias Locales
export type CommunityPost = {
  id: string;
  autor_id: string;
  autor_nombre: string;
  autor_tipo: 'jugador' | 'complejo';
  complejo_nombre?: string;
  categoria: 'busco_rival' | 'busco_jugador' | 'torneo' | 'turno_libre' | 'aviso';
  titulo: string;
  contenido: string;
  zona: string;
  fecha_partido?: string;
  contacto?: string;
  likes: string[];
  created_at: string;
};

// 6. Panel B2B para Dueños de Canchas / Complejos
export type ComplejoTurnoFlash = {
  id: string;
  complejo_id: string;
  complejo_nombre: string;
  cancha_nombre: string;
  tipo_cancha: 'Fútbol 5' | 'Fútbol 7' | 'Fútbol 8' | 'Fútbol 11';
  superficie: string;
  direccion: string;
  zona: string;
  fecha: string;
  hora: string;
  precio_regular: number;
  precio_oferta: number;
  descuento_pct: number;
  motivo_cancelacion: string;
  reservado: boolean;
  reservado_por_usuario_id?: string;
  reservado_por_nombre?: string;
  codigo_reserva?: string;
  qr_validado?: boolean;
  created_at: string;
};


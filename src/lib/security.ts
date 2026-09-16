import { Usuario, CategoriaReporte, Reporte } from '@/types/database';

/**
  * Ciberseguridad, Privacidad y Control de Acceso para Juntada Fútbol
  */

// 1. Data Masking (Ocultamiento de Datos Sensibles)
// Regla: Nunca exponer emails ni números telefónicos completos públicamente en interfaz ni en el chat.
export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'Sin email';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.com';
  const name = parts[0];
  const domain = parts[1];
  const visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return 'Sin teléfono vinculado';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 6) return '***-***';
  const start = clean.slice(0, 5);
  const end = clean.slice(-2);
  return `${start} ****-${end}`;
}

// 2. Password Strength & Rules Validation
// Mínimo 8 caracteres, al menos un número y un símbolo
export function validatePassword(password: string): {
  valid: boolean;
  score: number; // 0 to 4
  label: 'Muy débil' | 'Débil' | 'Media' | 'Fuerte';
  errors: string[];
} {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  } else {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    errors.push('Al menos un número (0-9)');
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    errors.push('Al menos un símbolo especial (!@#$...)');
  }

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
    score += 1;
  }

  let label: 'Muy débil' | 'Débil' | 'Media' | 'Fuerte' = 'Muy débil';
  if (score === 1) label = 'Débil';
  if (score === 2) label = 'Media';
  if (score >= 3 && errors.length === 0) label = 'Fuerte';

  return {
    valid: errors.length === 0,
    score,
    label,
    errors,
  };
}

// 3. Rate Limiting en Cliente / Memoria (Anti-Spam & Anti-DDoS)
// Limita peticiones por ventana de tiempo (ej. max 5 mensajes en 10 seg, max 3 OTPs en 5 min)
const rateLimits: Record<string, { count: number; resetAt: number }> = {};

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): { allowed: boolean; remainingSeconds: number } {
  const now = Date.now();
  const existing = rateLimits[key];

  if (!existing || now > existing.resetAt) {
    rateLimits[key] = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    return { allowed: true, remainingSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    const remainingSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, remainingSeconds };
  }

  existing.count += 1;
  return { allowed: true, remainingSeconds: 0 };
}

// 4. Session Token Simulation (JWT with TLS 1.3 / Inactivity timeout)
export type SessionToken = {
  token: string;
  userId: string;
  issuedAt: number;
  expiresAt: number;
  securityProtocol: 'TLS_1_3';
};

export function createSecureSession(userId: string): SessionToken {
  const now = Date.now();
  const session: SessionToken = {
    token: `jwt_sec_${userId}_${Math.random().toString(36).substring(2)}${Date.now()}`,
    userId,
    issuedAt: now,
    expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
    securityProtocol: 'TLS_1_3',
  };
  try {
    localStorage.setItem('juntada_session_jwt', JSON.stringify(session));
  } catch {
    // ignore
  }
  return session;
}

export function getActiveSession(): SessionToken | null {
  try {
    const item = localStorage.getItem('juntada_session_jwt');
    if (!item) return null;
    const session: SessionToken = JSON.parse(item);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('juntada_session_jwt');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// 5. Políticas de Cancelación y Penalizaciones (Sección 3 del Reglamento)
/**
 * A. Políticas de Cancelación (Bajas):
 * - Baja Anticipada (>4 horas antes): Sin penalización.
 * - Baja Tardía (entre 4 y 2 horas antes): -5% en el Índice de Asistencia.
 * - Baja Crítica (<2 horas antes): "Plantón", -15% en el Índice de Asistencia y suspensión 7 días.
 */
export type CancellationPolicyResult = {
  type: 'anticipada' | 'tardia' | 'critica';
  title: string;
  description: string;
  penaltyPct: number;
  suspensionDays: number;
  isAllowed: boolean;
  hoursRemaining: number;
};

export function evaluateCancellation(matchDateIso: string): CancellationPolicyResult {
  const now = Date.now();
  const matchTime = new Date(matchDateIso).getTime();
  const diffHours = (matchTime - now) / (1000 * 60 * 60);

  if (diffHours > 4) {
    return {
      type: 'anticipada',
      title: 'Baja Anticipada (Sin Penalización)',
      description:
        'Cancelás con más de 4 horas de anticipación. Tu lugar se liberará inmediatamente a la lista de espera sin afectar tu reputación.',
      penaltyPct: 0,
      suspensionDays: 0,
      isAllowed: true,
      hoursRemaining: Number(diffHours.toFixed(1)),
    };
  } else if (diffHours >= 2) {
    return {
      type: 'tardia',
      title: 'Baja Tardía (-5% de Asistencia)',
      description:
        'Cancelás entre 4 y 2 horas antes del partido. De acuerdo al Reglamento de Convivencia, se aplicará una reducción del 5% a tu Índice de Asistencia histórico.',
      penaltyPct: 5,
      suspensionDays: 0,
      isAllowed: true,
      hoursRemaining: Number(diffHours.toFixed(1)),
    };
  } else {
    return {
      type: 'critica',
      title: 'Baja Crítica / Plantón (-15% de Asistencia y Sanción)',
      description:
        'Faltan menos de 2 horas para el inicio (Cierre de Lista). Se considera inasistencia ("Plantón"). Reducirá un 15% tu Índice de Asistencia y suspenderá tu cuenta por 7 días para unirte a nuevos partidos.',
      penaltyPct: 15,
      suspensionDays: 7,
      isAllowed: true,
      hoursRemaining: Math.max(0, Number(diffHours.toFixed(1))),
    };
  }
}

// 6. Reports and Moderation System (Sección 6)
const REPORTS_KEY = 'juntada_reports_v1';
const BLOCKED_KEY = 'juntada_blocked_users_v1';

export function saveReport(report: Omit<Reporte, 'id' | 'created_at' | 'estado'>): Reporte {
  const newReport: Reporte = {
    ...report,
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    estado: 'pendiente',
  };

  try {
    const list: Reporte[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    list.push(newReport);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  return newReport;
}

export function blockUser(currentUserId: string, targetUserId: string): void {
  try {
    const map: Record<string, string[]> = JSON.parse(localStorage.getItem(BLOCKED_KEY) || '{}');
    const userBlocks = map[currentUserId] || [];
    if (!userBlocks.includes(targetUserId)) {
      userBlocks.push(targetUserId);
      map[currentUserId] = userBlocks;
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(map));
    }
  } catch {
    // ignore
  }
}

export function isUserBlocked(currentUserId: string, targetUserId: string): boolean {
  try {
    const map: Record<string, string[]> = JSON.parse(localStorage.getItem(BLOCKED_KEY) || '{}');
    const userBlocks = map[currentUserId] || [];
    return userBlocks.includes(targetUserId);
  } catch {
    return false;
  }
}

export function unblockUser(currentUserId: string, targetUserId: string): void {
  try {
    const map: Record<string, string[]> = JSON.parse(localStorage.getItem(BLOCKED_KEY) || '{}');
    const userBlocks = (map[currentUserId] || []).filter((id) => id !== targetUserId);
    map[currentUserId] = userBlocks;
    localStorage.setItem(BLOCKED_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getBlockedUserIds(currentUserId: string): string[] {
  try {
    const map: Record<string, string[]> = JSON.parse(localStorage.getItem(BLOCKED_KEY) || '{}');
    return map[currentUserId] || [];
  } catch {
    return [];
  }
}

// 7. Moderación Asistida por IA (Detección de Lenguaje Ofensivo & Convivencia)
import { AIModerationResult } from '@/types/database';

const OFFENSIVE_KEYWORDS = [
  'puto', 'pelotudo', 'mierda', 'forro', 'hijo de puta', 'la concha', 'concha de tu madre',
  'estafador', 'te voy a cagar', 'te voy a romper', 'negro de mierda', 'maricon', 'mogolico',
  'inutil', 'tarado', 'cagador', 'ladron', 'gordo trolo', 'muerto de hambre', 'te mato',
];

const SPAM_PATTERNS = [
  /casino\s*online/i,
  /cripto\s*ganancias/i,
  /hace\s*dinero\s*facil/i,
  /telegram\.me/i,
  /wa\.me\/\+/i,
  /bit\.ly\//i,
  /gana\s*dolares\s*ya/i,
];

export function analyzeOffensiveContent(text: string): AIModerationResult {
  const normalized = text.toLowerCase().trim();
  if (!normalized) {
    return {
      score: 0,
      categoria: 'limpio',
      severidad: 'baja',
      es_ofensivo: false,
      motivo_deteccion: 'Contenido limpio y apropiado para la comunidad.',
      accion_sugerida: 'permitir',
    };
  }

  // Check for spam / scam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        score: 0.9,
        categoria: 'spam_estafa',
        severidad: 'alta',
        es_ofensivo: true,
        motivo_deteccion: 'Detección de enlaces no autorizados, spam o publicidad fraudulenta.',
        accion_sugerida: 'ocultar_inmediato',
      };
    }
  }

  // Check for hate speech / violence / discrimination
  const foundKeywords = OFFENSIVE_KEYWORDS.filter((kw) => normalized.includes(kw));

  if (foundKeywords.length >= 2 || /te mato|te voy a romper|te cago a piñas/i.test(normalized)) {
    return {
      score: 0.95,
      categoria: 'agresion_violencia',
      severidad: 'alta',
      es_ofensivo: true,
      motivo_deteccion: `Amenaza explícita o agresión verbal grave detectada (${foundKeywords.join(', ')}).`,
      accion_sugerida: 'ocultar_inmediato',
    };
  }

  if (foundKeywords.length === 1) {
    return {
      score: 0.65,
      categoria: 'lenguaje_hostil',
      severidad: 'media',
      es_ofensivo: true,
      motivo_deteccion: `Uso de insultos o lenguaje antideportivo detectado (${foundKeywords[0]}).`,
      accion_sugerida: 'advertir',
    };
  }

  return {
    score: 0.05,
    categoria: 'limpio',
    severidad: 'baja',
    es_ofensivo: false,
    motivo_deteccion: 'Mensaje revisado con moderación automática: lenguaje conforme a las normas de convivencia.',
    accion_sugerida: 'permitir',
  };
}

// 7. Verificación de Identidad por Teléfono Celular & OTP
export function validatePhoneNumber(phone: string): {
  valid: boolean;
  formatted: string;
  error?: string;
} {
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '');

  if (digits.length < 8) {
    return {
      valid: false,
      formatted: clean,
      error: 'El número debe contener al menos 8 dígitos (ej: +54 9 11 4567-8901 o 11 4567 8901)',
    };
  }

  let formatted = clean;
  // If no international prefix is given, format nicely for Argentina (+54 9 ...)
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('15')) {
      formatted = `+54 9 11 ${formatted.slice(2).trim()}`;
    } else if (formatted.startsWith('11') || formatted.startsWith('9')) {
      formatted = `+54 9 ${formatted}`;
    } else {
      formatted = `+54 ${formatted}`;
    }
  }

  return { valid: true, formatted };
}

export function generateSecureOtp(): string {
  // Generate random 6-digit numeric string
  return Math.floor(100000 + Math.random() * 900000).toString();
}

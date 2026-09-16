import { format, formatDistanceToNow, isToday, isTomorrow, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Ensures any date input (string, timestamp or Date) is serialized
 * in strict ISO 8601 format (UTC) for database persistence.
 */
export function toISOUTC(dateInput: Date | string | number): string {
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number'
      ? new Date(dateInput)
      : dateInput;
    if (!isValid(d)) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Returns the local timezone of the user's device (e.g. 'America/Argentina/Buenos_Aires')
 * and the standard GMT offset (e.g. 'GMT-3').
 */
export function getDeviceTimezone(): { timezone: string; offsetLabel: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offsetMin) / 60);
    const offsetLabel = `GMT${sign}${hours}`;
    return { timezone: tz, offsetLabel };
  } catch {
    return { timezone: 'America/Argentina/Buenos_Aires', offsetLabel: 'GMT-3' };
  }
}

export interface MatchTimeInfo {
  displayDate: string;       // e.g. "Miércoles 17 de Septiembre"
  displayTime: string;       // e.g. "20:00 hs"
  relativeLabel: string;     // e.g. "Hoy", "Mañana", "En 2 días"
  fullFormatted: string;     // e.g. "Miércoles 17 de Septiembre, 20:00 hs (GMT-3)"
  deviceTimezone: string;
  offsetLabel: string;
}

/**
 * Converts a stored ISO 8601 UTC date string into the device's local time,
 * handling international users booking or viewing from different countries.
 */
export function formatMatchDateTime(isoString: string): MatchTimeInfo {
  const d = new Date(isoString);
  const { timezone, offsetLabel } = getDeviceTimezone();

  if (!isValid(d)) {
    return {
      displayDate: isoString,
      displayTime: '',
      relativeLabel: '',
      fullFormatted: isoString,
      deviceTimezone: timezone,
      offsetLabel,
    };
  }

  let relativeLabel = '';
  if (isToday(d)) {
    relativeLabel = 'Hoy';
  } else if (isTomorrow(d)) {
    relativeLabel = 'Mañana';
  } else {
    try {
      relativeLabel = formatDistanceToNow(d, { addSuffix: true, locale: es });
    } catch {
      relativeLabel = '';
    }
  }

  const displayDate = format(d, "EEEE d 'de' MMMM", { locale: es });
  const displayTime = `${format(d, 'HH:mm')} hs`;
  const fullFormatted = `${displayDate}, ${displayTime} (${offsetLabel})`;

  return {
    displayDate,
    displayTime,
    relativeLabel,
    fullFormatted,
    deviceTimezone: timezone,
    offsetLabel,
  };
}

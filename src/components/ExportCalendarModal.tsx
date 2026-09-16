import React, { useState } from 'react';
import {
  Calendar,
  Download,
  ExternalLink,
  X,
  Check,
  Clock,
  MapPin,
  CalendarPlus,
} from 'lucide-react';

interface ExportCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  location: string;
  notes?: string | null;
  startDateIso: string;
}

export const ExportCalendarModal: React.FC<ExportCalendarModalProps> = ({
  isOpen,
  onClose,
  title,
  location,
  notes,
  startDateIso,
}) => {
  const [downloadedIcs, setDownloadedIcs] = useState(false);

  const startDate = new Date(startDateIso);
  const durationMinutes = 90;
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatUtc = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const description = `${title}\nLugar: ${location}\n${notes || 'Partido organizado en Juntada Fútbol.'}`;

  // Google Calendar URL
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${formatUtc(startDate)}/${formatUtc(endDate)}&details=${encodeURIComponent(
    description
  )}&location=${encodeURIComponent(location)}`;

  // Download .ics file
  const handleDownloadIcs = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Juntada Futbol//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `SUMMARY:${title.replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${location.replace(/[,;]/g, ' ')}`,
      `DTSTART:${formatUtc(startDate)}`,
      `DTEND:${formatUtc(endDate)}`,
      `DTSTAMP:${formatUtc(new Date())}`,
      `UID:match-${Date.now()}@juntadafutbol.com`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}.ics`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedIcs(true);
    setTimeout(() => setDownloadedIcs(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-sm sm:max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Exportar a Calendario
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Guardá el partido en tu agenda personal
            </p>
          </div>
        </div>

        {/* Match summary card */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 mb-5 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
          <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{title}</p>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Clock className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span>
              {startDate.toLocaleDateString('es-AR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              a las{' '}
              {startDate.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              hs
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Options buttons */}
        <div className="space-y-2.5">
          {/* Google Calendar */}
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center justify-between transition-colors shadow-sm cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Google Calendar
            </span>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          {/* Apple Calendar / Outlook / iCal */}
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="w-full py-3 px-4 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white font-bold rounded-2xl text-xs flex items-center justify-between transition-colors shadow-sm cursor-pointer"
          >
            <span className="flex items-center gap-2">
              {downloadedIcs ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloadedIcs ? '¡Archivo .ics descargado!' : 'Descargar iCal (.ics) / Apple / Outlook'}
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md">.ICS</span>
          </button>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-4">
          El archivo .ics es compatible con iPhone, Mac, Outlook, Samsung Calendar y Google Calendar.
        </p>
      </div>
    </div>
  );
};

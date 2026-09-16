import React from 'react';
import {
  Bell,
  X,
  Clock,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  CheckCheck,
  ChevronRight,
  Info,
  Zap,
  MapPin,
  Star,
  Users,
} from 'lucide-react';
import { AppNotification, NotificationType } from '@/types/database';
import { DataStore } from '@/lib/store';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onSelectMatch: (matchId: string) => void;
  onNotificationsUpdated: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onSelectMatch,
  onNotificationsUpdated,
}) => {
  const notifications = DataStore.getNotifications(currentUserId);
  const unreadCount = notifications.filter((n) => !n.leido).length;

  const handleMarkAllRead = () => {
    DataStore.markAllNotificationsAsRead(currentUserId);
    onNotificationsUpdated();
  };

  const handleClickNotification = (n: AppNotification) => {
    if (!n.leido) {
      DataStore.markNotificationAsRead(n.id);
      onNotificationsUpdated();
    }
    if (n.partido_id) {
      onSelectMatch(n.partido_id);
      onClose();
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'urgente_arquero':
        return <Zap className="w-5 h-5 text-red-500 fill-red-500/20" />;
      case 'suplente_cupo':
        return <Clock className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
      case 'cercania_geofence':
        return <MapPin className="w-5 h-5 text-emerald-500" />;
      case 'calificacion_post_partido':
        return <Star className="w-5 h-5 text-amber-400 fill-amber-400" />;
      case 'horario_cambiado':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'cancelado':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'recordatorio':
        return <Calendar className="w-5 h-5 text-sky-500" />;
      case 'seguridad':
        return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: NotificationType) => {
    switch (type) {
      case 'urgente_arquero':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
            🧤 Urgente Arquero
          </span>
        );
      case 'suplente_cupo':
        return (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            ⚡️ Cupo Prioritario (10 min)
          </span>
        );
      case 'cercania_geofence':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            📍 En tu Zona (&lt;5 km)
          </span>
        );
      case 'calificacion_post_partido':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300">
            ⭐️ Votar MVP
          </span>
        );
      default:
        return null;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Recién';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays} d`;
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                Notificaciones
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {unreadCount} nuevas
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avisos de partidos, cambios de horario y cancelaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <div className="py-2.5 flex justify-end">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas como leídas
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-semibold">No tenés notificaciones pendientes</p>
              <p className="text-xs text-gray-400">Te avisaremos cuando haya cambios en tus convocatorias.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  n.leido
                    ? 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800/60 opacity-80 hover:opacity-100'
                    : 'bg-white dark:bg-gray-800/90 border-emerald-200 dark:border-emerald-800/60 shadow-xs'
                }`}
              >
                <div className="mt-0.5 p-2 rounded-xl bg-gray-100 dark:bg-gray-700/60 shrink-0">
                  {getNotificationIcon(n.tipo)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                        {n.titulo}
                      </h4>
                      {getNotificationBadge(n.tipo)}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                    {n.mensaje}
                  </p>
                  {n.partido_id && (
                    <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>Ver partido</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
                {!n.leido && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

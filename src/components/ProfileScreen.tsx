import React, { useState, useEffect } from 'react';
import {
  Star,
  MapPin,
  ShieldCheck,
  Award,
  Users,
  Check,
  Edit2,
  TrendingUp,
  Lock,
  FileText,
  Phone,
  Mail,
  Moon,
  Sun,
  History,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react';
import { Usuario, MatchWithCreator, MatchReview } from '@/types/database';
import { DataStore } from '@/lib/store';
import { maskEmail, maskPhone } from '@/lib/security';
import { useTheme } from '@/context/ThemeContext';
import { TermsModal } from './TermsModal';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export type ProfileScreenProps = {
  currentUser: Usuario;
  onUserChanged: (user: Usuario) => void;
  onLogout: () => void;
  onOpenAuthModal?: (mode?: 'login' | 'register' | 'verify_phone') => void;
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  onUserChanged,
  onOpenAuthModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const allUsers = DataStore.getAllUsers();
  const [editing, setEditing] = useState(false);
  const [zona, setZona] = useState(currentUser.zona || '');
  const [posicion, setPosicion] = useState(currentUser.posicion_preferida || 'mediocampista');
  const [edad, setEdad] = useState(currentUser.edad_aprox || 28);
  const [savedMessage, setSavedMessage] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // History and reviews state
  const [pastMatches, setPastMatches] = useState<MatchWithCreator[]>([]);
  const [activeReviewMatchId, setActiveReviewMatchId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewTags, setReviewTags] = useState<string[]>(['Puntualidad', 'Buen nivel']);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    DataStore.getPastMatchesForUser(currentUser.id).then((matches) => {
      setPastMatches(matches);
    });
  }, [currentUser.id]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Usuario = {
      ...currentUser,
      zona: zona.trim() || null,
      posicion_preferida: posicion,
      edad_aprox: Number(edad) || 28,
    };
    DataStore.setCurrentUser(updated);
    onUserChanged(updated);
    setEditing(false);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  const handleSwitchUser = (user: Usuario) => {
    DataStore.setCurrentUser(user);
    setZona(user.zona || '');
    setPosicion(user.posicion_preferida || 'mediocampista');
    setEdad(user.edad_aprox || 28);
    onUserChanged(user);
    DataStore.getPastMatchesForUser(user.id).then((matches) => {
      setPastMatches(matches);
    });
  };

  const handleSaveReview = (match: MatchWithCreator) => {
    DataStore.saveMatchReview({
      partido_id: match.id,
      partido_titulo: match.titulo,
      usuario_id: currentUser.id,
      rating: reviewRating,
      comentario: reviewComment.trim() || '¡Excelente partido y gran grupo de personas!',
      tags: reviewTags,
    });
    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setActiveReviewMatchId(null);
      setReviewComment('');
    }, 1500);
  };

  const availableTags = [
    'Puntualidad',
    'Buen nivel',
    'Tercer tiempo copado',
    'Cancha 10/10',
    'Fair Play',
    'Excelente arquero',
  ];

  return (
    <div id="profile-screen-container" className="max-w-xl mx-auto pb-16 space-y-6">
      {/* Profile Card Header */}
      <div className="bg-[#1E2228] rounded-3xl p-6 sm:p-8 border border-[#2A2F37] shadow-lg text-center relative overflow-hidden">
        {/* Subtle dark green accent glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-20 bg-[#0F4C3A]/20 blur-3xl pointer-events-none" />

        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-[#0F4C3A] border-2 border-[#00F0FF] text-white font-black text-3xl sm:text-4xl flex items-center justify-center shadow-lg mb-3">
          {currentUser.nombre?.charAt(0).toUpperCase() || '?'}
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser.nombre}</h1>
          {currentUser.verificado && (
            <span title="Jugador Verificado de la Comunidad">
              <ShieldCheck className="w-5 h-5 text-[#00F0FF]" />
            </span>
          )}
        </div>

        <p className="text-xs text-[#A0AAB4] mb-5">
          {currentUser.edad_aprox ? `${currentUser.edad_aprox} años` : '28 años'} •{' '}
          {currentUser.zona || 'Buenos Aires, CABA'}
        </p>

        {/* Attendance & Reputation Stats */}
        <div className="grid grid-cols-3 gap-2 bg-[#121417] rounded-2xl p-3 mb-5 border border-[#2A2F37]">
          <div className="text-center">
            <span className="text-lg sm:text-xl font-black text-[#00F0FF] block">
              {currentUser.asistencia_pct || 98}%
            </span>
            <span className="text-[10px] uppercase font-bold text-[#A0AAB4]">Asistencia</span>
          </div>

          <div className="text-center border-x border-[#2A2F37]">
            <span className="text-lg sm:text-xl font-black text-white block">
              {currentUser.partidos_jugados || 25}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#A0AAB4]">Partidos</span>
          </div>

          <div className="text-center">
            <span className="text-lg sm:text-xl font-black text-amber-400 block flex items-center justify-center gap-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
              {currentUser.rating ? Number(currentUser.rating).toFixed(1) : '5.0'}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#A0AAB4]">Reputación</span>
          </div>
        </div>

        {/* Medallas y Reconocimientos */}
        <div className="text-left mb-6">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#00F0FF]" />
            Medallas y Reconocimientos
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(currentUser.medallas && currentUser.medallas.length > 0
              ? currentUser.medallas
              : ['Asistencia perfecta', 'Buen compañero', 'Juego limpio']
            ).map((m) => (
              <span
                key={m}
                className="text-xs font-semibold px-3 py-1 rounded-xl bg-[#121417] text-gray-200 border border-[#2A2F37] flex items-center gap-1"
              >
                🏅 {m}
              </span>
            ))}
          </div>
        </div>

        {savedMessage && (
          <div className="mb-4 text-xs font-bold text-emerald-300 bg-[#0F4C3A]/40 py-2 px-3 rounded-xl border border-[#0F4C3A] flex items-center justify-center gap-1">
            <Check className="w-3.5 h-3.5" /> ¡Perfil actualizado con éxito!
          </div>
        )}

        {/* Profile details form / display */}
        {!editing ? (
          <div className="border-t border-[#2A2F37] pt-5 text-left space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#A0AAB4] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#00F0FF]" /> Zona habitual:
              </span>
              <span className="font-bold text-white">{currentUser.zona || 'Sin especificar'}</span>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#A0AAB4] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#00F0FF]" /> Posición preferida:
              </span>
              <span className="font-bold text-white capitalize">
                {currentUser.posicion_preferida || 'mediocampista'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEditing(true)}
              className="w-full mt-4 py-2.5 px-4 rounded-xl border border-[#2A2F37] hover:border-[#00F0FF]/40 bg-[#121417] text-xs font-bold text-gray-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#00F0FF]" /> Editar Datos Personales
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSaveProfile}
            className="border-t border-[#2A2F37] pt-5 text-left space-y-3"
          >
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                Zona Habitual
              </label>
              <input
                type="text"
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                placeholder="Ej: Palermo, CABA"
                className="w-full bg-[#121417] border border-[#2A2F37] rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-[#A0AAB4] focus:outline-none focus:border-[#00F0FF] caret-[#00E676]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                Posición en la cancha
              </label>
              <select
                value={posicion}
                onChange={(e) => setPosicion(e.target.value)}
                className="w-full bg-[#121417] border border-[#2A2F37] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#00F0FF] caret-[#00E676]"
              >
                <option value="arquero">Arquero / Arquera</option>
                <option value="defensor">Defensor / Defensora</option>
                <option value="mediocampista">Mediocampista</option>
                <option value="delantero">Delantero / Delantera</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                Edad Aproximada
              </label>
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(Number(e.target.value))}
                min="16"
                max="80"
                className="w-full bg-[#121417] border border-[#2A2F37] rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-[#A0AAB4] focus:outline-none focus:border-[#00F0FF] caret-[#00E676]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-2 rounded-xl border border-[#2A2F37] text-xs font-bold text-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#0F4C3A] hover:bg-[#135f49] text-white text-xs font-bold border border-[#1b6a52]"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Theme Settings Toggle (Dark Mode) */}
      <div className="bg-[#1E2228] rounded-3xl p-5 border border-[#2A2F37] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#121417] border border-[#2A2F37] flex items-center justify-center text-[#00F0FF]">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Modo Visual / Tema
            </h3>
            <p className="text-xs text-[#A0AAB4]">
              {theme === 'dark' ? 'Estilo Premium Falta1 (Dark Mode)' : 'Modo Claro'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl bg-[#121417] hover:bg-[#252B33] border border-[#2A2F37] text-xs font-bold text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Cambiar a Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Cambiar a Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* Match History & Reviews */}
      <div className="bg-[#1E2228] rounded-3xl p-6 border border-[#2A2F37] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2F37]">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#00F0FF]" />
            Historial de Partidos Jugados
          </h3>
          <span className="text-[10px] font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded-full border border-[#00F0FF]/30">
            {pastMatches.length} Jugados
          </span>
        </div>

        <p className="text-xs text-[#A0AAB4]">
          Calificá a tus compañeros de partido, reportá cómo estuvo la cancha y destacá el Fair Play.
        </p>

        <div className="space-y-3">
          {pastMatches.map((match) => {
            const rawDate = new Date(match.fecha_hora);
            const displayDate = isValid(rawDate)
              ? format(rawDate, "d 'de' MMMM, HH:mm'hs'", { locale: es })
              : match.fecha_hora;
            const existingReview = DataStore.getReviewForMatch(match.id, currentUser.id);
            const isReviewing = activeReviewMatchId === match.id;

            return (
              <div
                key={match.id}
                className="p-3.5 rounded-2xl bg-[#121417] border border-[#2A2F37] space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{match.titulo}</h4>
                    <p className="text-[11px] text-[#A0AAB4]">
                      📍 {match.cancha} • {displayDate}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F4C3A] text-emerald-200 border border-[#1b6a52]">
                    Completado
                  </span>
                </div>

                {existingReview ? (
                  <div className="pt-2 border-t border-[#2A2F37] text-xs">
                    <div className="flex items-center gap-1 text-amber-400 font-bold mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= existingReview.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-[11px] text-gray-300">
                        {existingReview.rating}/5
                      </span>
                    </div>
                    {existingReview.comentario && (
                      <p className="text-[11px] text-[#A0AAB4] italic">
                        "{existingReview.comentario}"
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {existingReview.tags?.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-medium bg-[#1E2228] text-gray-300 px-2 py-0.5 rounded-md border border-[#2A2F37]"
                        >
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : isReviewing ? (
                  <div className="pt-2 border-t border-[#2A2F37] space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-300 font-bold">Puntaje:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="cursor-pointer"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= reviewRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {availableTags.map((tag) => {
                        const isSelected = reviewTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setReviewTags((prev) =>
                                isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                              )
                            }
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40'
                                : 'bg-[#1E2228] text-gray-400 border-[#2A2F37]'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Opinión breve (ej: Partidazo parejo, puntual)..."
                      className="w-full bg-[#1E2228] border border-[#2A2F37] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#A0AAB4] focus:outline-none focus:border-[#00F0FF] caret-[#00E676]"
                    />

                    {reviewSuccess && (
                      <span className="text-[11px] font-bold text-emerald-400 block">
                        ✓ Calificación guardada
                      </span>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveReviewMatchId(null)}
                        className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveReview(match)}
                        className="px-3 py-1 bg-[#0F4C3A] hover:bg-[#135f49] text-white text-xs font-bold rounded-lg border border-[#1b6a52] cursor-pointer"
                      >
                        Publicar Reseña
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReviewMatchId(match.id);
                      setReviewRating(5);
                    }}
                    className="text-xs font-bold text-[#00F0FF] hover:underline flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Dejar calificación y opinión
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Security, Privacy & Verified Identity Card */}
      <div className="bg-[#1E2228] rounded-3xl p-6 border border-[#2A2F37] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2F37]">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[#00F0FF]" />
            Privacidad e Identidad Verificada
          </h3>
          <span className="text-[10px] font-bold bg-[#0F4C3A] text-emerald-200 border border-[#1b6a52] px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Blindaje Activo
          </span>
        </div>

        <p className="text-xs text-[#A0AAB4] leading-relaxed">
          Tus datos de contacto reales están protegidos. Nunca son expuestos a otros jugadores en la comunidad ni en chats abiertos.
        </p>

        <div className="space-y-2.5">
          <div className="bg-[#121417] p-3 rounded-2xl border border-[#2A2F37] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A0AAB4] block">Email Vinculado</span>
                <span className="text-xs font-mono font-semibold text-gray-200">
                  {maskEmail(currentUser.email)}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-300 bg-[#0F4C3A]/50 px-2 py-0.5 rounded-md border border-[#0F4C3A]">
              Verificado ✓
            </span>
          </div>

          <div className="bg-[#121417] p-3 rounded-2xl border border-[#2A2F37] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A0AAB4] block">Celular OTP Único</span>
                <span className="text-xs font-mono font-semibold text-gray-200">
                  {maskPhone(currentUser.telefono)}
                </span>
              </div>
            </div>
            {currentUser.telefono_verificado ? (
              <span className="text-[10px] font-bold text-emerald-300 bg-[#0F4C3A]/50 px-2 py-0.5 rounded-md border border-[#0F4C3A]">
                SMS/WhatsApp Verificado ✓
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal?.('verify_phone')}
                className="text-[10px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/40 transition-colors cursor-pointer"
              >
                ⚠️ Validar OTP Ahora
              </button>
            )}
          </div>
        </div>

        {/* Legal & Terms Trigger */}
        <button
          type="button"
          onClick={() => setShowTermsModal(true)}
          className="w-full mt-2 py-2.5 px-4 bg-[#121417] hover:bg-[#252B33] text-gray-300 hover:text-white border border-[#2A2F37] rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00F0FF]" />
            Términos de Servicio y Reglas de Convivencia
          </span>
          <span className="text-[#00F0FF] font-bold text-[11px]">Leer documento →</span>
        </button>
      </div>

      {/* Switch Persona Test Sandbox */}
      <div className="bg-[#1E2228] rounded-3xl p-6 border border-[#2A2F37] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#00F0FF]" />
          Cambiar de Jugador de Prueba (Demo Persona)
        </h3>
        <p className="text-xs text-[#A0AAB4]">
          Probá la experiencia desde la perspectiva de organizadores, arqueros o jugadoras:
        </p>

        <div className="space-y-2">
          {allUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSwitchUser(user)}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                currentUser.id === user.id
                  ? 'border-[#00F0FF]/50 bg-[#121417] shadow-sm'
                  : 'border-[#2A2F37] hover:border-gray-600 bg-[#121417]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0F4C3A] text-white font-bold flex items-center justify-center text-sm border border-[#1b6a52]">
                  {user.nombre.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1">
                    {user.nombre}
                    {user.id === currentUser.id && (
                      <span className="text-[10px] bg-[#00F0FF] text-black font-extrabold px-1.5 py-0.2 rounded">
                        Activo
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#A0AAB4] capitalize">
                    {user.posicion_preferida || 'Jugador'} • {user.asistencia_pct || 96}% asistencia
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px] font-bold text-amber-400">
                ⭐ {user.rating}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Full Legal Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
};

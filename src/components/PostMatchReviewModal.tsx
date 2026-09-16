import React, { useState, useEffect } from 'react';
import { X, Star, Trophy, Award, CheckCircle2, ThumbsUp, ShieldCheck } from 'lucide-react';
import { Partido, Usuario } from '@/types/database';
import { DataStore } from '@/lib/store';

export type PostMatchReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  match: Partido;
  currentUser: Usuario;
  onSubmitted?: () => void;
};

export const PostMatchReviewModal: React.FC<PostMatchReviewModalProps> = ({
  isOpen,
  onClose,
  match,
  currentUser,
  onSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedMvpId, setSelectedMvpId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Gran nivel', 'Puntuales']);
  const [players, setPlayers] = useState<Usuario[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allUsers = DataStore.getAllUsers();
      // Get players from inscriptions
      try {
        const inscripciones = JSON.parse(
          localStorage.getItem('juntada_inscripciones_v1') || '[]'
        ) as Array<{ partido_id: string; usuario_id: string; estado: string }>;
        const matchUsers = inscripciones
          .filter((i) => i.partido_id === match.id && i.estado === 'confirmado')
          .map((i) => i.usuario_id);

        if (!matchUsers.includes(match.creador_id)) {
          matchUsers.push(match.creador_id);
        }

        const candidateUsers = allUsers.filter(
          (u) => matchUsers.includes(u.id) && u.id !== currentUser.id
        );
        setPlayers(candidateUsers);
        if (candidateUsers.length > 0) {
          setSelectedMvpId(candidateUsers[0].id);
        }
      } catch {
        setPlayers(allUsers.filter((u) => u.id !== currentUser.id).slice(0, 4));
      }
    }
  }, [isOpen, match.id, currentUser.id]);

  if (!isOpen) return null;

  const availableTags = [
    '⚽️ Gran nivel de juego',
    '⏰ Puntuales',
    '🌱 Cancha impecable',
    '🤝 Juego limpio y deportivo',
    '🍻 Excelente tercer tiempo',
    '🧤 Atajadas clave',
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Save match review
    DataStore.saveMatchReview({
      partido_id: match.id,
      partido_titulo: match.titulo,
      usuario_id: currentUser.id,
      rating,
      comentario: selectedTags.join(' • '),
      tags: selectedTags,
    });

    // 2. Register MVP vote if chosen
    if (selectedMvpId) {
      DataStore.voteMvp(match.id, currentUser.id, selectedMvpId);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      if (onSubmitted) onSubmitted();
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100 relative max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  ¡Calificación en 15 segundos!
                </span>
                <h3 className="text-base font-black text-gray-900 leading-tight">
                  ¿Cómo estuvo el partido?
                </h3>
                <p className="text-xs text-gray-500">{match.titulo}</p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="text-center py-2 bg-gray-50 rounded-2xl border border-gray-200/80">
              <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">
                Puntaje general del partido
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (hoverRating || rating) >= star
                          ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-gray-700 mt-1 block">
                {rating === 5 ? '¡Excelente partido!' : rating === 4 ? 'Muy bueno' : rating === 3 ? 'Bueno' : 'Regular'}
              </span>
            </div>

            {/* MVP Vote */}
            {players.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-2 flex items-center justify-between">
                  <span>Votar al MVP de la fecha ⭐️</span>
                  <span className="text-[10px] font-semibold text-emerald-600">1 voto = +Medalla MVP</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {players.slice(0, 6).map((player) => {
                    const isSelected = selectedMvpId === player.id;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedMvpId(player.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-50/70 shadow-xs ring-2 ring-amber-400/20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                          {player.nombre.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {player.nombre}
                          </p>
                          <p className="text-[10px] text-gray-500 capitalize truncate">
                            {player.posicion_preferida || 'Jugador'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Feedback Tags */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1.5">
                Aspectos destacados (Tocar para marcar)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-md text-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Calificación y MVP</span>
            </button>
          </form>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-gray-900">¡Calificación Registrada!</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Gracias por sumar a la comunidad de Falta1. Tu voto de MVP fue computado exitosamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

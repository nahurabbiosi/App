import React, { useState } from 'react';
import {
  Trophy,
  Users,
  Shield,
  MessageSquare,
  Plus,
  Heart,
  Calendar,
  MapPin,
  Flame,
  Award,
  Swords,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { CommunityPost, TeamProfile, TeamChallenge, Usuario } from '@/types/database';
import { DataStore } from '@/lib/store';

export type CommunityScreenProps = {
  currentUser: Usuario;
  onOpenMatch?: (matchId: string) => void;
};

export const CommunityScreen: React.FC<CommunityScreenProps> = ({
  currentUser,
  onOpenMatch,
}) => {
  const [subTab, setSubTab] = useState<'feed' | 'leaderboard' | 'retos'>('feed');

  // Feed State
  const [posts, setPosts] = useState<CommunityPost[]>(() => DataStore.getCommunityPosts());
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postCategory, setPostCategory] = useState<CommunityPost['categoria']>('busco_rival');
  const [postZona, setPostZona] = useState('Palermo, CABA');

  // Leaderboard State
  const [allUsers, setAllUsers] = useState<Usuario[]>(() => DataStore.getAllUsers());
  const [leaderboardFilter, setLeaderboardFilter] = useState<'asistencia' | 'mvps' | 'partidos'>('asistencia');

  // Teams & Challenges State
  const [teams, setTeams] = useState<TeamProfile[]>(() => DataStore.getTeams());
  const [challenges, setChallenges] = useState<TeamChallenge[]>(() => DataStore.getTeamChallenges());
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamFormat, setNewTeamFormat] = useState<'Fútbol 5' | 'Fútbol 7' | 'Fútbol 11'>('Fútbol 5');
  const [newTeamZone, setNewTeamZone] = useState('Palermo');
  const [newTeamColor, setNewTeamColor] = useState('Verde / Negro');

  // Challenge modal
  const [targetTeam, setTargetTeam] = useState<TeamProfile | null>(null);
  const [challengeComplex, setChallengeComplex] = useState('Complejo El Predio');
  const [challengeDate, setChallengeDate] = useState('2026-09-20T20:00');
  const [challengeMsg, setChallengeMsg] = useState('');

  // 1. Feed Handlers
  const handleLikePost = (postId: string) => {
    const updated = DataStore.likeCommunityPost(postId, currentUser.id);
    setPosts(updated);
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postDesc.trim()) return;

    const newP: CommunityPost = {
      id: `post-${Date.now()}`,
      autor_id: currentUser.id,
      autor_nombre: currentUser.nombre,
      categoria: postCategory,
      titulo: postTitle.trim(),
      descripcion: postDesc.trim(),
      zona: postZona.trim(),
      likes: [],
      created_at: new Date().toISOString(),
    };

    const updated = DataStore.createCommunityPost(newP);
    setPosts(updated);
    setPostTitle('');
    setPostDesc('');
    setShowNewPostModal(false);
  };

  const filteredPosts = posts.filter((p) => {
    if (selectedCategory === 'todas') return true;
    return p.categoria === selectedCategory;
  });

  // 2. Leaderboard Sorting
  const sortedUsers = [...allUsers].sort((a, b) => {
    if (leaderboardFilter === 'asistencia') {
      return (b.asistencia_pct || 0) - (a.asistencia_pct || 0);
    }
    if (leaderboardFilter === 'mvps') {
      return (b.medallas?.length || 0) - (a.medallas?.length || 0);
    }
    return (b.partidos_jugados || 0) - (a.partidos_jugados || 0);
  });

  // 3. Teams Handlers
  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const newT: TeamProfile = {
      id: `team-${Date.now()}`,
      nombre: newTeamName.trim(),
      capitan_id: currentUser.id,
      capitan_nombre: currentUser.nombre,
      formato: newTeamFormat,
      zona: newTeamZone,
      color_camiseta: newTeamColor,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      rating_promedio: 80,
      miembros: [currentUser.id],
      created_at: new Date().toISOString(),
    };

    const updated = DataStore.createTeam(newT);
    setTeams(updated);
    setNewTeamName('');
    setShowCreateTeamModal(false);
  };

  const handleSendChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeam) return;

    const myTeam = teams.find((t) => t.capitan_id === currentUser.id) || teams[0];

    const challenge: TeamChallenge = {
      id: `ch-${Date.now()}`,
      desafiante_equipo_id: myTeam.id,
      desafiante_equipo_nombre: myTeam.nombre,
      desafiado_equipo_id: targetTeam.id,
      desafiado_equipo_nombre: targetTeam.nombre,
      fecha_propuesta: challengeDate,
      cancha_propuesta: challengeComplex,
      estado: 'pendiente',
      mensaje: challengeMsg.trim() || '¡Los desafiamos a un partidazo de fútbol con tercer tiempo!',
      created_at: new Date().toISOString(),
    };

    const updated = DataStore.createTeamChallenge(challenge);
    setChallenges(updated);
    setTargetTeam(null);
    setChallengeMsg('');
  };

  const handleRespondChallenge = (challengeId: string, accept: boolean) => {
    const updated = DataStore.respondTeamChallenge(challengeId, accept);
    setChallenges(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Subtabs Header */}
      <div className="bg-[#121417] p-2 rounded-2xl border border-[#2A2F37] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSubTab('feed')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'feed'
              ? 'bg-[#00E676] text-[#121417] shadow-sm font-black'
              : 'text-[#A0AAB4] hover:text-white hover:bg-[#1E2228]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Muro de la Comunidad</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('leaderboard')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'leaderboard'
              ? 'bg-[#00E676] text-[#121417] shadow-sm font-black'
              : 'text-[#A0AAB4] hover:text-white hover:bg-[#1E2228]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Tabla de Posiciones</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('retos')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'retos'
              ? 'bg-[#00E676] text-[#121417] shadow-sm font-black'
              : 'text-[#A0AAB4] hover:text-white hover:bg-[#1E2228]'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>Desafíos de Equipos</span>
        </button>
      </div>

      {/* 1. Muro de Avisos y Novedades */}
      {subTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'todas', label: 'Todos' },
                { id: 'busco_rival', label: '⚔️ Busco Rival' },
                { id: 'busco_arquero', label: '🧤 Busco Arquero' },
                { id: 'torneo', label: '🏆 Torneo' },
                { id: 'turno_libre', label: '⚡ Turno Libre' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowNewPostModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Aviso</span>
            </button>
          </div>

          {/* Posts list */}
          <div className="space-y-3">
            {filteredPosts.map((p) => {
              const isLiked = p.likes.includes(currentUser.id);
              const badgeColors: Record<string, string> = {
                busco_rival: 'bg-amber-100 text-amber-900 border-amber-200',
                busco_arquero: 'bg-blue-100 text-blue-900 border-blue-200',
                torneo: 'bg-purple-100 text-purple-900 border-purple-200',
                turno_libre: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                aviso: 'bg-gray-100 text-gray-800 border-gray-200',
              };

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3 hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                        {p.autor_nombre.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{p.autor_nombre}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {p.zona}
                          </span>
                          <span>•</span>
                          <span>{new Date(p.created_at).toLocaleDateString('es-AR')}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${
                        badgeColors[p.categoria] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {p.categoria.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-gray-900 mb-1">{p.titulo}</h5>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {p.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleLikePost(p.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        isLiked
                          ? 'text-red-600 bg-red-50'
                          : 'text-gray-500 hover:text-red-500 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{p.likes.length} me interesa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert(`Conectando con ${p.autor_nombre}... ¡Enviá mensaje directo en el chat!`)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      💬 Responder al autor
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Leaderboard / Tabla de Posiciones */}
      {subTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-3 gap-3 pt-4 items-end">
            {/* 2nd Place */}
            {sortedUsers[1] && (
              <div className="bg-[#181C22] text-white p-4 rounded-2xl border border-gray-400/30 text-center space-y-1 relative order-1">
                <div className="w-7 h-7 mx-auto rounded-full bg-gray-300 text-gray-900 font-black text-xs flex items-center justify-center shadow-md">
                  2
                </div>
                <h5 className="font-bold text-xs truncate">{sortedUsers[1].nombre}</h5>
                <span className="text-[10px] text-[#00F0FF] block font-mono font-bold">
                  {sortedUsers[1].asistencia_pct}% Asistencia
                </span>
                <span className="text-[9px] text-[#A0AAB4] block">
                  {sortedUsers[1].partidos_jugados} partidos
                </span>
              </div>
            )}

            {/* 1st Place */}
            {sortedUsers[0] && (
              <div className="bg-[#121417] text-white p-5 rounded-2xl border border-[#00E676] text-center space-y-1.5 relative shadow-lg shadow-[#00E676]/10 order-2 -mt-4">
                <div className="w-9 h-9 mx-auto rounded-full bg-amber-400 text-gray-950 font-black text-sm flex items-center justify-center shadow-lg">
                  👑 1
                </div>
                <h5 className="font-black text-sm text-white truncate">{sortedUsers[0].nombre}</h5>
                <span className="text-xs text-[#00E676] block font-mono font-black">
                  {sortedUsers[0].asistencia_pct}% Asistencia
                </span>
                <span className="text-[10px] text-amber-300 block font-semibold">
                  🏆 {sortedUsers[0].medallas?.length || 3} Medallas MVP
                </span>
              </div>
            )}

            {/* 3rd Place */}
            {sortedUsers[2] && (
              <div className="bg-[#181C22] text-white p-4 rounded-2xl border border-amber-700/40 text-center space-y-1 relative order-3">
                <div className="w-7 h-7 mx-auto rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">
                  3
                </div>
                <h5 className="font-bold text-xs truncate">{sortedUsers[2].nombre}</h5>
                <span className="text-[10px] text-[#00F0FF] block font-mono font-bold">
                  {sortedUsers[2].asistencia_pct}% Asistencia
                </span>
                <span className="text-[9px] text-[#A0AAB4] block">
                  {sortedUsers[2].partidos_jugados} partidos
                </span>
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between gap-2 shadow-xs">
            <span className="text-xs font-bold text-gray-700">Ordenar por:</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'asistencia', label: 'Tasa de Asistencia' },
                { id: 'mvps', label: 'Medallas & MVPs' },
                { id: 'partidos', label: 'Partidos Jugados' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLeaderboardFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    leaderboardFilter === f.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ranking Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="divide-y divide-gray-100">
              {sortedUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className={`p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors ${
                    u.id === currentUser.id ? 'bg-emerald-50/50 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-mono font-bold text-xs text-gray-500">
                      #{idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {u.nombre.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                        {u.nombre}
                        {u.id === currentUser.id && (
                          <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-black">
                            Vos
                          </span>
                        )}
                      </h5>
                      <span className="text-[11px] text-gray-500 capitalize">
                        {u.posicion_preferida || 'Mediocampista'} • {u.zona || 'CABA'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-xs font-mono font-bold text-emerald-700 block">
                      {u.asistencia_pct}% Asis.
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      {u.partidos_jugados} PJ • {u.medallas?.length || 0} MVPs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Desafíos de Equipos / Retos */}
      {subTab === 'retos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-gray-900">Equipos de la Comunidad</h3>
              <p className="text-xs text-gray-500">
                Armá tu equipo con tus amigos y desafiá a otros grupos para jugar por los puntos
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateTeamModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Mi Equipo</span>
            </button>
          </div>

          {/* Active Challenges List */}
          {challenges.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Desafíos y Retos Recientes ({challenges.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {challenges.map((ch) => (
                  <div
                    key={ch.id}
                    className="bg-[#121417] text-white p-4 rounded-2xl border border-[#2A2F37] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#2A2F37]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00E676] flex items-center gap-1">
                        <Swords className="w-3 h-3" /> Desafío Entre Equipos
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ch.estado === 'aceptado'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ch.estado === 'rechazado'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {ch.estado.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="font-black text-white">{ch.desafiante_equipo_nombre}</div>
                      <span className="text-gray-500 font-bold">VS</span>
                      <div className="font-black text-[#00F0FF]">{ch.desafiado_equipo_nombre}</div>
                    </div>

                    <p className="text-[11px] text-[#A0AAB4] italic">"{ch.mensaje}"</p>

                    <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-[#2A2F37]">
                      <span>📍 {ch.cancha_propuesta}</span>
                      <span>📅 {new Date(ch.fecha_propuesta).toLocaleDateString('es-AR')}</span>
                    </div>

                    {/* Actions if pending */}
                    {ch.estado === 'pendiente' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleRespondChallenge(ch.id, true)}
                          className="flex-1 py-1.5 rounded-lg bg-[#00E676] hover:bg-[#00c968] text-[#121417] text-xs font-black transition-colors cursor-pointer"
                        >
                          Aceptar Reto
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondChallenge(ch.id, false)}
                          className="px-3 py-1.5 rounded-lg bg-[#252B33] hover:bg-[#303844] text-gray-400 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registered Teams Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Equipos Disponibles para Desafiar
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3 hover:border-emerald-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className="font-black text-sm text-gray-900">{t.nombre}</h5>
                      <span className="text-xs text-gray-500">
                        Capitán: {t.capitan_nombre} • {t.formato}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg">
                      Nivel {t.rating_promedio}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-xl flex items-center justify-between text-xs text-gray-600">
                    <span>PJ: {t.pj}</span>
                    <span className="text-emerald-700 font-bold">PG: {t.pg}</span>
                    <span>PE: {t.pe}</span>
                    <span className="text-red-600">PP: {t.pp}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTargetTeam(t)}
                    className="w-full py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Swords className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lanzar Desafío</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Publicar Nuevo Aviso en Muro */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#181C22] border border-[#2A2F37] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <span>📢</span> Publicar Aviso en el Muro Local
            </h4>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Categoría</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white border border-[#2A2F37] text-xs focus:outline-hidden [caret-color:#00E676]"
                >
                  <option value="busco_rival">⚔️ Busco Rival (Equipo)</option>
                  <option value="busco_arquero">🧤 Busco Arquero/a</option>
                  <option value="torneo">🏆 Torneo / Cuadrangular</option>
                  <option value="turno_libre">⚡ Turno Libre</option>
                  <option value="aviso">💬 Aviso General</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Título del Aviso</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Ej. Buscamos equipo para F5 este viernes"
                  className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white placeholder-[#A0AAB4] border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Zona / Barrio</label>
                <input
                  type="text"
                  value={postZona}
                  onChange={(e) => setPostZona(e.target.value)}
                  placeholder="Ej. Palermo / Belgrano"
                  className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white placeholder-[#A0AAB4] border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                />
              </div>

              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Detalles / Mensaje</label>
                <textarea
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  rows={3}
                  placeholder="Indicá el nivel, día y detalles de la cancha..."
                  className="w-full p-3 rounded-xl bg-[#1E2228] text-white placeholder-[#A0AAB4] border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A0AAB4] hover:text-white bg-[#1E2228]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00E676] hover:bg-[#00c968] text-[#121417]"
                >
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Mi Equipo */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#181C22] border border-[#2A2F37] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00E676]" /> Inscribir Nuevo Equipo
            </h4>

            <form onSubmit={handleCreateTeam} className="space-y-3">
              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Nombre del Equipo</label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ej. Aston Birra F.C."
                  className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white placeholder-[#A0AAB4] border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#A0AAB4] block mb-1">Formato</label>
                  <select
                    value={newTeamFormat}
                    onChange={(e) => setNewTeamFormat(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white border border-[#2A2F37] text-xs focus:outline-hidden [caret-color:#00E676]"
                  >
                    <option value="Fútbol 5">Fútbol 5</option>
                    <option value="Fútbol 7">Fútbol 7</option>
                    <option value="Fútbol 11">Fútbol 11</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#A0AAB4] block mb-1">Colores de Camiseta</label>
                  <input
                    type="text"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    placeholder="Ej. Negra y Roja"
                    className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white placeholder-[#A0AAB4] border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Zona Habitual</label>
                <input
                  type="text"
                  value={newTeamZone}
                  onChange={(e) => setNewTeamZone(e.target.value)}
                  placeholder="Ej. Palermo / Villa Urquiza"
                  className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white placeholder-[#A0AAB4] border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A0AAB4] hover:text-white bg-[#1E2228]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00E676] hover:bg-[#00c968] text-[#121417]"
                >
                  Confirmar y Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Lanzar Desafío */}
      {targetTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#181C22] border border-[#2A2F37] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <Swords className="w-4 h-4 text-[#00E676]" />
              Desafiar a: <span className="text-[#00E676]">{targetTeam.nombre}</span>
            </h4>

            <form onSubmit={handleSendChallenge} className="space-y-3">
              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Complejo / Predio Propuesto</label>
                <input
                  type="text"
                  value={challengeComplex}
                  onChange={(e) => setChallengeComplex(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Fecha y Hora Tentativa</label>
                <input
                  type="datetime-local"
                  value={challengeDate}
                  onChange={(e) => setChallengeDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1">Mensaje para el Capitán</label>
                <textarea
                  value={challengeMsg}
                  onChange={(e) => setChallengeMsg(e.target.value)}
                  placeholder="¡Vamos por el asado y las birras del perdedor!"
                  rows={2}
                  className="w-full p-3 rounded-xl bg-[#1E2228] text-white placeholder-[#A0AAB4] border border-[#2A2F37] text-xs focus:outline-hidden focus:border-[#00E676] [caret-color:#00E676]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetTeam(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A0AAB4] hover:text-white bg-[#1E2228]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00E676] hover:bg-[#00c968] text-[#121417]"
                >
                  Enviar Reto Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

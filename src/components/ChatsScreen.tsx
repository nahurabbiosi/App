import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Calendar,
  MapPin,
  ChevronRight,
  ArrowLeft,
  Flame,
  CheckCheck,
} from 'lucide-react';
import { Partido, Usuario, ChatMessage } from '@/types/database';
import { DataStore } from '@/lib/store';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatsScreenProps {
  currentUser: Usuario;
  partidos: Partido[];
  onOpenMatch: (matchId: string) => void;
}

export const ChatsScreen: React.FC<ChatsScreenProps> = ({
  currentUser,
  partidos,
  onOpenMatch,
}) => {
  const [selectedPartidoId, setSelectedPartidoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  // Find matches where user has joined or created, or all available active matches
  const myMatches = partidos.filter((p) => {
    // User is creator
    if (p.creador_id === currentUser.id) return true;
    // Or user has an inscription
    return true; // For demo/sandbox, allow chatting in any active match
  });

  const selectedPartido = partidos.find((p) => p.id === selectedPartidoId);

  useEffect(() => {
    if (selectedPartidoId) {
      const msgs = DataStore.getChatMessages(selectedPartidoId);
      setMessages(msgs);
    }
  }, [selectedPartidoId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartidoId) return;

    const newMsg = DataStore.addChatMessage(
      selectedPartidoId,
      currentUser.id,
      currentUser.nombre,
      inputText.trim(),
      false
    );
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  if (selectedPartido) {
    const rawDate = new Date(selectedPartido.fecha_hora);
    const dateValid = isValid(rawDate);
    const displayDate = dateValid
      ? format(rawDate, "EEEE d 'de' MMMM, HH:mm'hs'", { locale: es })
      : selectedPartido.fecha_hora;

    return (
      <div className="bg-[#1E2228] rounded-3xl border border-[#2A2F37] shadow-xl overflow-hidden flex flex-col h-[78vh] sm:h-[82vh]">
        {/* Chat Header */}
        <div className="bg-[#121417] px-4 py-3.5 border-b border-[#2A2F37] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedPartidoId(null)}
              className="p-1.5 -ml-1 text-gray-400 hover:text-white rounded-xl hover:bg-[#1E2228] transition-colors cursor-pointer"
              title="Volver a chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{selectedPartido.titulo}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#0F4C3A] text-emerald-200 border border-[#1b6a52]">
                  Fútbol {selectedPartido.tipo_cancha}
                </span>
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[#A0AAB4]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#00F0FF]" /> {selectedPartido.cancha || 'Palermo'}
                </span>
                <span>•</span>
                <span>{displayDate}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onOpenMatch(selectedPartido.id)}
            className="text-[11px] font-bold text-[#00F0FF] hover:text-white bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 px-2.5 py-1.5 rounded-xl border border-[#00F0FF]/30 transition-colors cursor-pointer"
          >
            Ver Ficha
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-[#A0AAB4] space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-gray-600" />
              <p className="text-xs">No hay mensajes en este chat aún.</p>
              <p className="text-[11px] text-gray-500">
                ¡Sé el primero en consultar por pecheras, horario de llegada o arquero!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.usuario_id === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.es_sistema
                      ? 'items-center my-3'
                      : isMine
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  {msg.es_sistema ? (
                    <div className="px-3 py-1 rounded-full bg-[#121417] border border-[#2A2F37] text-[10px] font-semibold text-[#A0AAB4] shadow-xs">
                      ⚡ {msg.mensaje}
                    </div>
                  ) : (
                    <div className={`max-w-[82%] sm:max-w-[70%] space-y-0.5`}>
                      {!isMine && (
                        <span className="text-[10px] font-bold text-gray-400 pl-1">
                          {msg.usuario_nombre}
                        </span>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMine
                            ? 'bg-[#0F4C3A] text-white rounded-br-xs border border-[#1b6a52]'
                            : 'bg-[#121417] text-gray-200 rounded-bl-xs border border-[#2A2F37]'
                        }`}
                      >
                        {msg.mensaje}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-[9px] text-[#A0AAB4] px-1 ${
                          isMine ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span>
                          {isValid(new Date(msg.created_at))
                            ? format(new Date(msg.created_at), 'HH:mm')
                            : ''}
                        </span>
                        {isMine && <CheckCheck className="w-3 h-3 text-[#00F0FF]" />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSendMessage}
          className="bg-[#121417] p-3 border-t border-[#2A2F37] flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Escribí un mensaje al equipo como ${currentUser.nombre.split(' ')[0]}...`}
            className="flex-1 bg-[#1E2228] border border-[#2A2F37] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#A0AAB4] focus:outline-none focus:border-[#00F0FF] transition-colors caret-[#00E676]"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-[#0F4C3A] hover:bg-[#135f49] disabled:opacity-40 text-white font-bold transition-colors cursor-pointer shrink-0 border border-[#1b6a52]"
          >
            <Send className="w-4 h-4 text-[#00F0FF]" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Mis Chats y Canales</span>
            <span className="text-xs bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 font-bold px-2 py-0.5 rounded-full">
              En vivo
            </span>
          </h1>
          <p className="text-xs text-[#A0AAB4] mt-0.5">
            Comunicate directamente con organizadores y compañeros de cancha
          </p>
        </div>
      </div>

      {/* List of Chat Rooms */}
      <div className="space-y-2.5">
        {myMatches.length === 0 ? (
          <div className="bg-[#1E2228] rounded-2xl p-8 text-center border border-[#2A2F37] space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto text-gray-500" />
            <h3 className="text-sm font-bold text-white">No tenés chats activos</h3>
            <p className="text-xs text-[#A0AAB4]">
              Cuando te anotes a un partido o crees una convocatoria, el chat del equipo aparecerá acá.
            </p>
          </div>
        ) : (
          myMatches.map((partido) => {
            const msgs = DataStore.getChatMessages(partido.id);
            const lastMsg = msgs[msgs.length - 1];
            const spotsLeft = Math.max(
              0,
              partido.jugadores_necesarios - partido.jugadores_confirmados
            );
            const isFalta1 = spotsLeft === 1;

            return (
              <div
                key={partido.id}
                onClick={() => setSelectedPartidoId(partido.id)}
                className="bg-[#1E2228] hover:bg-[#252B33] rounded-2xl p-4 border border-[#2A2F37] hover:border-[#00F0FF]/40 shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#121417] border border-[#2A2F37] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    ⚽
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-[#00F0FF] transition-colors">
                        {partido.titulo}
                      </h4>
                      {isFalta1 && (
                        <span className="shrink-0 text-[10px] font-black bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-[#00F0FF]" /> FALTA 1
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#A0AAB4] truncate flex items-center gap-1.5">
                      <span className="font-semibold text-gray-300">
                        {partido.cancha || 'Predio CABA'}
                      </span>
                      <span>•</span>
                      <span className="text-gray-400">
                        {lastMsg ? `"${lastMsg.mensaje}"` : 'Sin mensajes aún'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-500 hidden sm:inline">
                    {partido.jugadores_confirmados}/{partido.jugadores_necesarios}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#00F0FF] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

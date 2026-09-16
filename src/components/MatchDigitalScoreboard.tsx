import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Flag, Award, Clock, Flame, CheckCircle } from 'lucide-react';
import { PartidoLiveScore, LiveScoreEvent } from '@/types/database';
import { DataStore } from '@/lib/store';

export type MatchDigitalScoreboardProps = {
  partidoId: string;
  isCreator: boolean;
  onMatchFinalized?: () => void;
};

export const MatchDigitalScoreboard: React.FC<MatchDigitalScoreboardProps> = ({
  partidoId,
  isCreator,
  onMatchFinalized,
}) => {
  const [scoreData, setScoreData] = useState<PartidoLiveScore>(() => {
    return DataStore.getMatchLiveScore(partidoId);
  });
  const [timerRunning, setTimerRunning] = useState(scoreData.enCurso);
  const [seconds, setSeconds] = useState(scoreData.cronometroSegundos);
  const [goalAuthor, setGoalAuthor] = useState('');
  const [scoringTeam, setScoringTeam] = useState<'A' | 'B'>('A');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  // Interval timer
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && scoreData.periodo !== 'finalizado') {
      interval = setInterval(() => {
        setSeconds((prev) => {
          const next = prev + 1;
          // Sync periodically to local storage
          if (next % 5 === 0) {
            DataStore.updateMatchLiveScore(partidoId, {
              cronometroSegundos: next,
              enCurso: true,
            });
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, partidoId, scoreData.periodo]);

  const toggleTimer = () => {
    if (!isCreator) return;
    const nextState = !timerRunning;
    setTimerRunning(nextState);
    DataStore.updateMatchLiveScore(partidoId, {
      enCurso: nextState,
      cronometroSegundos: seconds,
    });
  };

  const resetTimer = () => {
    if (!isCreator) return;
    setTimerRunning(false);
    setSeconds(0);
    DataStore.updateMatchLiveScore(partidoId, {
      cronometroSegundos: 0,
      enCurso: false,
    });
  };

  const handlePeriodChange = (period: PartidoLiveScore['periodo']) => {
    if (!isCreator) return;
    const updated = DataStore.updateMatchLiveScore(partidoId, { periodo: period });
    setScoreData(updated);
  };

  const handleQuickGoal = (team: 'A' | 'B', delta: number) => {
    if (!isCreator) return;
    const currentA = scoreData.golesA;
    const currentB = scoreData.golesB;
    const nextA = team === 'A' ? Math.max(0, currentA + delta) : currentA;
    const nextB = team === 'B' ? Math.max(0, currentB + delta) : currentB;

    let events = scoreData.historialEventos || [];
    if (delta > 0) {
      const currentMin = Math.max(1, Math.floor(seconds / 60));
      events = [
        ...events,
        {
          id: `ev-${Date.now()}`,
          equipo: team,
          minuto: currentMin,
          tipo: 'gol',
          autor: 'Gol de equipo',
        },
      ];
    }

    const updated = DataStore.updateMatchLiveScore(partidoId, {
      golesA: nextA,
      golesB: nextB,
      historialEventos: events,
    });
    setScoreData(updated);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreator) return;
    const currentMin = Math.max(1, Math.floor(seconds / 60));
    const nextA = scoringTeam === 'A' ? scoreData.golesA + 1 : scoreData.golesA;
    const nextB = scoringTeam === 'B' ? scoreData.golesB + 1 : scoreData.golesB;

    const newEvent: LiveScoreEvent = {
      id: `ev-${Date.now()}`,
      equipo: scoringTeam,
      minuto: currentMin,
      tipo: 'gol',
      autor: goalAuthor.trim() || undefined,
    };

    const updated = DataStore.updateMatchLiveScore(partidoId, {
      golesA: nextA,
      golesB: nextB,
      historialEventos: [...(scoreData.historialEventos || []), newEvent],
    });
    setScoreData(updated);
    setGoalAuthor('');
    setShowGoalModal(false);
  };

  const handleFinalizeMatch = () => {
    if (!isCreator) return;
    setTimerRunning(false);
    DataStore.updateMatchLiveScore(partidoId, {
      periodo: 'finalizado',
      enCurso: false,
    });
    // Finalize match status
    const partidos = DataStore.getPartidoById(partidoId);
    if (partidos) {
      // mark match closed/finalized
      DataStore.updateMatchStatus?.(partidoId, 'finalizado');
    }
    setConfirmFinalize(false);
    if (onMatchFinalized) onMatchFinalized();
  };

  const formatMinutes = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#121417] text-white rounded-2xl p-6 border border-[#2A2F37] space-y-6 shadow-xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-10 -left-10 w-44 h-44 bg-[#00E676]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A2F37]">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            {timerRunning && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                timerRunning ? 'bg-[#00E676]' : scoreData.periodo === 'finalizado' ? 'bg-red-500' : 'bg-amber-400'
              }`}
            />
          </span>
          <h3 className="font-black text-sm uppercase tracking-wider text-white">
            Tablero Digital & Cronómetro en Vivo
          </h3>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1.5 bg-[#1A1E24] p-1 rounded-xl border border-[#2A2F37] self-start">
          {(['primer_tiempo', 'entretiempo', 'segundo_tiempo', 'finalizado'] as const).map((p) => {
            const labels = {
              primer_tiempo: '1T',
              entretiempo: 'ET',
              segundo_tiempo: '2T',
              finalizado: 'Fin',
            };
            const active = scoreData.periodo === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                disabled={!isCreator}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  active
                    ? 'bg-[#00E676] text-[#121417]'
                    : 'text-[#A0AAB4] hover:text-white hover:bg-[#252B33]'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Score & Timer Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Team Verde Score */}
        <div className="bg-[#181C22] p-5 rounded-2xl border border-[#00E676]/30 text-center space-y-2 relative">
          <span className="text-xs font-black uppercase tracking-wider text-[#00E676] flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676]" />
            Equipo Verde
          </span>
          <div className="text-6xl font-black font-mono text-white tracking-tight">
            {scoreData.golesA}
          </div>

          {isCreator && scoreData.periodo !== 'finalizado' && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleQuickGoal('A', -1)}
                className="w-8 h-8 rounded-lg bg-[#252B33] hover:bg-[#303844] text-white font-bold flex items-center justify-center text-sm cursor-pointer"
                title="Restar gol"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickGoal('A', 1)}
                className="px-3 h-8 rounded-lg bg-[#00E676] hover:bg-[#00c968] text-[#121417] font-black flex items-center justify-center gap-1 text-xs cursor-pointer"
                title="Sumar gol"
              >
                <Plus className="w-3.5 h-3.5" /> Gol
              </button>
            </div>
          )}
        </div>

        {/* Digital Chronometer */}
        <div className="text-center space-y-3 p-4 bg-[#181C22] rounded-2xl border border-[#2A2F37]">
          <span className="text-[10px] font-bold text-[#A0AAB4] uppercase tracking-widest block">
            Tiempo de Juego
          </span>
          <div className="font-mono text-5xl font-black text-[#00E676] tracking-wider drop-shadow-[0_0_12px_rgba(0,230,118,0.25)]">
            {formatMinutes(seconds)}
          </div>

          {isCreator && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={toggleTimer}
                disabled={scoreData.periodo === 'finalizado'}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  timerRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-[#00E676] hover:bg-[#00c968] text-[#121417]'
                }`}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Iniciar
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetTimer}
                className="p-2 rounded-xl bg-[#252B33] hover:bg-[#303844] text-[#A0AAB4] hover:text-white transition-colors cursor-pointer"
                title="Reiniciar cronómetro a 00:00"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Team Cyan Score */}
        <div className="bg-[#181C22] p-5 rounded-2xl border border-[#00F0FF]/30 text-center space-y-2 relative">
          <span className="text-xs font-black uppercase tracking-wider text-[#00F0FF] flex items-center justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF]" />
            Equipo Cyan
          </span>
          <div className="text-6xl font-black font-mono text-white tracking-tight">
            {scoreData.golesB}
          </div>

          {isCreator && scoreData.periodo !== 'finalizado' && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleQuickGoal('B', -1)}
                className="w-8 h-8 rounded-lg bg-[#252B33] hover:bg-[#303844] text-white font-bold flex items-center justify-center text-sm cursor-pointer"
                title="Restar gol"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleQuickGoal('B', 1)}
                className="px-3 h-8 rounded-lg bg-[#00F0FF] hover:bg-[#00d0dd] text-[#121417] font-black flex items-center justify-center gap-1 text-xs cursor-pointer"
                title="Sumar gol"
              >
                <Plus className="w-3.5 h-3.5" /> Gol
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extra Action Buttons for Creator */}
      {isCreator && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#2A2F37]">
          <button
            type="button"
            onClick={() => setShowGoalModal(true)}
            className="text-xs font-bold text-white bg-[#1E2228] hover:bg-[#282F3A] border border-[#2A2F37] px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>⚽</span> Registrar Gol con Autor & Minuto
          </button>

          {scoreData.periodo !== 'finalizado' ? (
            <button
              type="button"
              onClick={() => setConfirmFinalize(true)}
              className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-900/50 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
            >
              <Flag className="w-3.5 h-3.5" /> Finalizar Partido
            </button>
          ) : (
            <span className="text-xs font-bold text-[#00E676] bg-[#00E676]/10 px-3 py-1.5 rounded-xl border border-[#00E676]/20 ml-auto flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Encuentro Finalizado
            </span>
          )}
        </div>
      )}

      {/* Goal Events Timeline */}
      {scoreData.historialEventos && scoreData.historialEventos.length > 0 && (
        <div className="pt-3 border-t border-[#2A2F37]">
          <span className="text-[11px] font-bold text-[#A0AAB4] uppercase tracking-wider block mb-2">
            Historial de Goles
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {scoreData.historialEventos.map((ev, idx) => (
              <div
                key={ev.id || idx}
                className="bg-[#181C22] px-3 py-1.5 rounded-lg border border-[#2A2F37] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#00E676] font-bold">
                    {ev.minuto}'
                  </span>
                  <span>⚽</span>
                  <span className="font-medium text-white">
                    {ev.autor || 'Gol en juego'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ev.equipo === 'A'
                      ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20'
                      : 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20'
                  }`}
                >
                  {ev.equipo === 'A' ? 'Equipo Verde' : 'Equipo Cyan'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#181C22] border border-[#2A2F37] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>⚽</span> Registrar Gol en Vivo
            </h4>

            <form onSubmit={handleSaveGoal} className="space-y-3">
              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1.5">
                  Equipo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScoringTeam('A')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      scoringTeam === 'A'
                        ? 'border-[#00E676] bg-[#00E676]/10 text-[#00E676]'
                        : 'border-[#2A2F37] bg-[#1E2228] text-white'
                    }`}
                  >
                    Equipo Verde
                  </button>
                  <button
                    type="button"
                    onClick={() => setScoringTeam('B')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      scoringTeam === 'B'
                        ? 'border-[#00F0FF] bg-[#00F0FF]/10 text-[#00F0FF]'
                        : 'border-[#2A2F37] bg-[#1E2228] text-white'
                    }`}
                  >
                    Equipo Cyan
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#A0AAB4] block mb-1.5">
                  Autor del Gol (Opcional)
                </label>
                <input
                  type="text"
                  value={goalAuthor}
                  onChange={(e) => setGoalAuthor(e.target.value)}
                  placeholder="Ej. Lucas Fernández"
                  className="w-full h-11 px-3 rounded-xl bg-[#1E2228] text-white placeholder-[#A0AAB4] border border-[#2A2F37] focus:outline-hidden focus:border-[#00E676] text-xs [caret-color:#00E676]"
                />
              </div>

              <div className="text-[11px] text-[#A0AAB4]">
                Minuto registrado en cronómetro: <strong className="text-white">{Math.max(1, Math.floor(seconds / 60))}'</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[#A0AAB4] hover:text-white bg-[#1E2228] border border-[#2A2F37]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00E676] hover:bg-[#00c968] text-[#121417]"
                >
                  Confirmar Gol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Finalize Modal */}
      {confirmFinalize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#181C22] border border-[#2A2F37] rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950/40 text-red-400 flex items-center justify-center text-xl border border-red-800/40">
              🏁
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">¿Finalizar el Partido?</h4>
              <p className="text-xs text-[#A0AAB4] mt-1">
                Marcador final: Equipo Verde {scoreData.golesA} - {scoreData.golesB} Equipo Cyan. Se habilitará el Tercer Tiempo y la votación de MVP.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmFinalize(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-[#A0AAB4] hover:text-white bg-[#1E2228] border border-[#2A2F37]"
              >
                Continuar Jugando
              </button>
              <button
                type="button"
                onClick={handleFinalizeMatch}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Sí, Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Shuffle, Shield, Zap, Settings, CheckCircle2, Award, Users } from 'lucide-react';
import { BalancedTeamsResult, BalancedPlayer } from '@/types/database';
import { DataStore } from '@/lib/store';

export type BalancedTeamsViewProps = {
  partidoId: string;
  playerIds: string[];
  isCreator: boolean;
  onTeamsUpdated?: () => void;
};

export const BalancedTeamsView: React.FC<BalancedTeamsViewProps> = ({
  partidoId,
  playerIds,
  isCreator,
  onTeamsUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [balancedData, setBalancedData] = useState<BalancedTeamsResult | null>(() => {
    return DataStore.getMatchBalancedTeams(partidoId);
  });

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const result = DataStore.generateBalancedTeams(partidoId, playerIds);
      setBalancedData(result);
      setLoading(false);
      if (onTeamsUpdated) onTeamsUpdated();
    }, 200);
  };

  const getPositionIcon = (pos: 'ARQ' | 'DEF' | 'MED' | 'DEL') => {
    switch (pos) {
      case 'ARQ':
        return '🧤';
      case 'DEF':
        return '🛡️';
      case 'MED':
        return '⚙️';
      case 'DEL':
        return '⚡';
      default:
        return '⚽';
    }
  };

  const getParityText = (pct: number) => {
    if (pct >= 98) return 'Partido muy parejo';
    if (pct >= 94) return 'Excelente equilibrio táctico';
    if (pct >= 90) return 'Paridad balanceada';
    return 'Diferencia moderada compensada';
  };

  if (!balancedData || balancedData.equipoA.length === 0) {
    return (
      <div className="bg-[#121417] text-white rounded-2xl p-8 border border-[#2A2F37] text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#1E2228] flex items-center justify-center text-2xl border border-[#2A2F37]">
          ⚖️
        </div>
        <div>
          <h4 className="text-lg font-bold text-white mb-1">Algoritmo de Armado de Equipos</h4>
          <p className="text-xs text-[#A0AAB4] max-w-md mx-auto">
            Equilibrio táctico inteligente en 4 etapas: Asignación estricta de arqueros, distribución de roles (DEF, MED, DEL), Snake Draft y permutaciones de mínima diferencia.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || playerIds.length < 2}
          className="inline-flex items-center gap-2 bg-[#00E676] hover:bg-[#00c968] text-[#121417] font-black text-sm px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-[#00E676]/20 cursor-pointer disabled:opacity-50"
        >
          <Shuffle className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Calculando paridad...' : 'Armar Equipos Parejos'}</span>
        </button>

        {playerIds.length < 2 && (
          <p className="text-[11px] text-amber-400">
            Se necesitan al menos 2 jugadores confirmados para balancear.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header & Re-balance Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#181C22] p-4 rounded-xl border border-[#2A2F37]">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-[#00E676]">⚡</span> Alineaciones Tácticas Equitativas
          </h3>
          <p className="text-xs text-[#A0AAB4]">
            Fórmula individual: $R_j = (P_j \times 0.85) + (M \times 2) + (A_j \times 0.15)$
          </p>
        </div>

        {isCreator && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-[#1E2228] hover:bg-[#2A2F37] text-white border border-[#2A2F37] hover:border-[#00E676] text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer self-start"
          >
            <Shuffle className={`w-3.5 h-3.5 text-[#00E676] ${loading ? 'animate-spin' : ''}`} />
            <span>Re-balancear Equipos</span>
          </button>
        )}
      </div>

      {/* Two Parallel Cards on Dark Canvas (#121417) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Equipo Verde */}
        <div className="bg-[#121417] rounded-2xl p-5 border border-[#00E676]/30 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E676]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2A2F37]">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#00E676] shadow-[0_0_8px_#00E676]" />
              <h4 className="font-black text-sm text-white tracking-wide">
                Equipo Verde
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#A0AAB4] uppercase block tracking-wider font-semibold">
                Promedio Nivel
              </span>
              <span className="text-base font-black text-[#00E676]">
                {balancedData.promedioNivelA}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {balancedData.jugadoresA.map((player) => (
              <div
                key={player.id}
                className="bg-[#1A1E24] hover:bg-[#21262E] p-3 rounded-xl border border-[#2A2F37] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0 select-none">
                    {getPositionIcon(player.posicion)}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {player.nombre}
                    </span>
                    <span className="text-[10px] text-[#A0AAB4] font-medium">
                      {player.posicion} • {player.asistenciaPct}% asis.
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded border border-[#00E676]/20">
                    {player.ratingCalculado}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-[#2A2F37] flex items-center justify-between text-[11px] text-[#A0AAB4]">
            <span>{balancedData.jugadoresA.length} Jugadores</span>
            <span className="font-mono text-gray-400">
              Total Rj: {Math.round(balancedData.jugadoresA.reduce((s, p) => s + p.ratingCalculado, 0))}
            </span>
          </div>
        </div>

        {/* Equipo Cyan */}
        <div className="bg-[#121417] rounded-2xl p-5 border border-[#00F0FF]/30 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2A2F37]">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
              <h4 className="font-black text-sm text-white tracking-wide">
                Equipo Cyan
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#A0AAB4] uppercase block tracking-wider font-semibold">
                Promedio Nivel
              </span>
              <span className="text-base font-black text-[#00F0FF]">
                {balancedData.promedioNivelB}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {balancedData.jugadoresB.map((player) => (
              <div
                key={player.id}
                className="bg-[#1A1E24] hover:bg-[#21262E] p-3 rounded-xl border border-[#2A2F37] flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0 select-none">
                    {getPositionIcon(player.posicion)}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {player.nombre}
                    </span>
                    <span className="text-[10px] text-[#A0AAB4] font-medium">
                      {player.posicion} • {player.asistenciaPct}% asis.
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20">
                    {player.ratingCalculado}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-[#2A2F37] flex items-center justify-between text-[11px] text-[#A0AAB4]">
            <span>{balancedData.jugadoresB.length} Jugadores</span>
            <span className="font-mono text-gray-400">
              Total Rj: {Math.round(balancedData.jugadoresB.reduce((s, p) => s + p.ratingCalculado, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Parity Indicator requested by user */}
      <div className="bg-[#1E2228] border border-[#2A2F37] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="text-lg">🔥</span>
          <span className="text-xs font-bold text-white">
            Paridad del encuentro:{' '}
            <strong className="text-[#00E676] font-extrabold">{balancedData.paridadPct}%</strong>{' '}
            <span className="text-[#A0AAB4] font-normal">({getParityText(balancedData.paridadPct)})</span>
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 text-[11px] text-[#A0AAB4]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00E676]" />
            Diferencia: {Math.abs(Math.round((balancedData.promedioNivelA - balancedData.promedioNivelB) * 10) / 10)} pts
          </span>
          <span>•</span>
          <span className="text-[#00E676] font-semibold">
            Swap Optimization OK
          </span>
        </div>
      </div>
    </div>
  );
};

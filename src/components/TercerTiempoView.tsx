import React, { useState } from 'react';
import { Beer, Pizza, Plus, Trash2, Check, Share2, Copy, Users, DollarSign, MapPin, Sparkles } from 'lucide-react';
import { TercerTiempoState, TercerTiempoOpcion, GastoExtra } from '@/types/database';
import { DataStore } from '@/lib/store';

export type TercerTiempoViewProps = {
  partidoId: string;
  confirmedPlayersCount: number;
  currentUserId: string;
  isCreator: boolean;
};

export const TercerTiempoView: React.FC<TercerTiempoViewProps> = ({
  partidoId,
  confirmedPlayersCount,
  currentUserId,
  isCreator,
}) => {
  const [state, setState] = useState<TercerTiempoState>(() => {
    return DataStore.getMatchTercerTiempo(partidoId);
  });

  // New venue state
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueType, setNewVenueType] = useState<TercerTiempoOpcion['tipo']>('cerveceria' as any || 'bar');
  const [newVenueAddress, setNewVenueAddress] = useState('');

  // New expense state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  const playersDividing = Math.max(1, confirmedPlayersCount || 10);

  const handleVote = (opcionId: string) => {
    const updated = DataStore.voteTercerTiempoOpcion(partidoId, opcionId, currentUserId);
    setState(updated);
  };

  const handleAddVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;

    const newOption: TercerTiempoOpcion = {
      id: `tt-op-${Date.now()}`,
      nombre: newVenueName.trim(),
      tipo: newVenueType as any,
      direccion: newVenueAddress.trim() || 'Cerca del complejo',
      distancia: 'A 4 cuadras',
      votos: [currentUserId],
    };

    const updated = DataStore.addTercerTiempoOpcion(partidoId, newOption);
    setState(updated);
    setNewVenueName('');
    setNewVenueAddress('');
    setShowAddVenue(false);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(expenseAmount, 10);
    if (!expenseDesc.trim() || isNaN(parsed) || parsed <= 0) return;

    const newGasto: GastoExtra = {
      id: `gasto-${Date.now()}`,
      descripcion: expenseDesc.trim(),
      monto: parsed,
      pagado_por: currentUserId,
    };

    const updated = DataStore.addGastoExtra(partidoId, newGasto);
    setState(updated);
    setExpenseDesc('');
    setExpenseAmount('');
    setShowAddExpense(false);
  };

  const handleRemoveExpense = (gastoId: string) => {
    const updated = DataStore.removeGastoExtra(partidoId, gastoId);
    setState(updated);
  };

  const totalGastosExtras = state.gastosExtras.reduce((acc, g) => acc + g.monto, 0);
  const totalPorPersona = Math.round(totalGastosExtras / playersDividing);

  const totalVotos = state.opciones.reduce((acc, o) => acc + o.votos.length, 0);

  const handleCopySummary = () => {
    const winnerVenue = [...state.opciones].sort((a, b) => b.votos.length - a.votos.length)[0];
    let text = `🍻 *TERCER TIEMPO - RESUMEN DE GASTOS Y JUNTADA*\n\n`;
    if (winnerVenue && winnerVenue.votos.length > 0) {
      text += `📍 *Lugar Más Votado:* ${winnerVenue.nombre} (${winnerVenue.direccion})\n`;
      text += `🗳️ Votos: ${winnerVenue.votos.length}\n\n`;
    }
    text += `💰 *Gastos Extras Compartidos:*\n`;
    state.gastosExtras.forEach((g) => {
      text += `• ${g.descripcion}: $${g.monto.toLocaleString('es-AR')}\n`;
    });
    text += `\n*TOTAL EXTRAS:* $${totalGastosExtras.toLocaleString('es-AR')}\n`;
    text += `👉 *POR PERSONA:* $${totalPorPersona.toLocaleString('es-AR')} (dividido entre ${playersDividing} jugadores)\n`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Votación de Lugar Post-Partido */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <span>🍻</span> Votación del Tercer Tiempo
            </h3>
            <p className="text-xs text-gray-500">
              Elegí entre las opciones cercanas dónde nos juntamos a comer pizzas o tomar algo después de jugar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddVenue(!showAddVenue)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Sugerir Nuevo Lugar</span>
          </button>
        </div>

        {/* Suggest Venue Form */}
        {showAddVenue && (
          <form
            onSubmit={handleAddVenue}
            className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                placeholder="Nombre del lugar (ej. Bar Antares)"
                className="h-10 px-3 rounded-lg bg-white text-gray-900 placeholder-[#6C757D] border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
                required
              />
              <select
                value={newVenueType}
                onChange={(e) => setNewVenueType(e.target.value as any)}
                className="h-10 px-3 rounded-lg bg-white text-gray-900 border border-gray-200 text-xs focus:outline-hidden"
              >
                <option value="pizzeria">🍕 Pizzería</option>
                <option value="bar">🍺 Bar / Cervecería</option>
                <option value="parrilla">🥩 Parrilla / Asado</option>
                <option value="bodegon">🍷 Bodegón</option>
              </select>
              <input
                type="text"
                value={newVenueAddress}
                onChange={(e) => setNewVenueAddress(e.target.value)}
                placeholder="Dirección o punto de referencia"
                className="h-10 px-3 rounded-lg bg-white text-gray-900 placeholder-[#6C757D] border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddVenue(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                Guardar y Votar
              </button>
            </div>
          </form>
        )}

        {/* Venues Voting List */}
        <div className="space-y-3">
          {state.opciones.map((op) => {
            const hasVoted = op.votos.includes(currentUserId);
            const pct = totalVotos > 0 ? Math.round((op.votos.length / totalVotos) * 100) : 0;

            return (
              <div
                key={op.id}
                className={`p-4 rounded-xl border transition-all ${
                  hasVoted
                    ? 'border-emerald-500 bg-emerald-50/40'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {op.tipo === 'pizzeria' ? '🍕' : op.tipo === 'parrilla' ? '🥩' : '🍺'}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900">{op.nombre}</h4>
                      {hasVoted && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Tu voto
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {op.direccion}
                      </span>
                      <span>•</span>
                      <span>{op.distancia}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVote(op.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      hasVoted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {hasVoted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Votado ({op.votos.length})</span>
                      </>
                    ) : (
                      <>
                        <span>Votar ({op.votos.length})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] font-semibold text-gray-500 mb-1">
                    <span>{op.votos.length} {op.votos.length === 1 ? 'voto' : 'votos'}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        hasVoted ? 'bg-emerald-600' : 'bg-gray-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Calculadora de Gastos Compartidos Extra */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Calculadora de Gastos Compartidos Extra
            </h3>
            <p className="text-xs text-gray-500">
              Desglose de bebidas, snacks, alquiler de pelotas o hielo extra. Se divide automáticamente entre los jugadores.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer self-start"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Gasto</span>
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <form
            onSubmit={handleAddExpense}
            className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  placeholder="Ej. Pack de Cervezas + Papas"
                  className="w-full h-10 px-3 rounded-lg bg-white text-gray-900 placeholder-[#6C757D] border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">
                  Monto Total ($ ARS)
                </label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Ej. 14000"
                  className="w-full h-10 px-3 rounded-lg bg-white text-gray-900 placeholder-[#6C757D] border border-gray-200 text-xs focus:outline-hidden focus:border-emerald-600 [caret-color:#00E676]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddExpense(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                Guardar Gasto
              </button>
            </div>
          </form>
        )}

        {/* Expenses List */}
        <div className="space-y-2">
          {state.gastosExtras.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              No hay gastos extras anotados aún. ¡Agregá las bebidas o snacks si compraron!
            </div>
          ) : (
            state.gastosExtras.map((gasto) => (
              <div
                key={gasto.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-gray-800">{gasto.descripcion}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 font-mono">
                    ${gasto.monto.toLocaleString('es-AR')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpense(gasto.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Eliminar gasto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Breakdown Summary Box */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
              Desglose Automático de Gastos Extras
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-950">
                ${totalPorPersona.toLocaleString('es-AR')}
              </span>
              <span className="text-xs font-semibold text-emerald-700">
                por jugador ({playersDividing} personas)
              </span>
            </div>
            <span className="text-xs text-emerald-800/80 block mt-1">
              Total acumulado en extras: ${totalGastosExtras.toLocaleString('es-AR')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>¡Copiado para WhatsApp!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copiar Resumen para el Grupo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

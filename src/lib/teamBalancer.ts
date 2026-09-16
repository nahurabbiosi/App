import { Usuario, BalancedPlayer, BalancedTeamsResult } from '@/types/database';

export function normalizePosition(pos?: string | null): 'ARQ' | 'DEF' | 'MED' | 'DEL' {
  if (!pos) return 'MED';
  const p = pos.toLowerCase().trim();
  if (p.includes('arq') || p.includes('portero') || p.includes('golero')) return 'ARQ';
  if (p.includes('def') || p.includes('central') || p.includes('lateral')) return 'DEF';
  if (p.includes('del') || p.includes('punta') || p.includes('extremo') || p.includes('atacante')) return 'DEL';
  return 'MED';
}

export function calculatePlayerPj(user: Usuario): number {
  // P_j: Habilidad General de 1 a 100.
  // Si tiene rating de 1 a 5, transformamos a escala 50 a 98.
  if (user.rating && user.rating <= 5) {
    return Math.round(50 + (user.rating - 3) * 20); // 3.0 -> 50, 4.0 -> 70, 4.8 -> 86, 5.0 -> 90
  }
  if (user.rating && user.rating > 5 && user.rating <= 100) {
    return Math.round(user.rating);
  }
  return 75; // Default nivel intermedio
}

export function calculatePlayerStats(user: Usuario): BalancedPlayer {
  const pos = normalizePosition(user.posicion_preferida);
  const pj = Math.min(100, Math.max(30, calculatePlayerPj(user)));
  const mvpCount = (user.medallas || []).filter((m) =>
    m.toLowerCase().includes('mvp') || m.toLowerCase().includes('estrella') || m.toLowerCase().includes('goleador')
  ).length;
  const asistenciaPct = typeof user.asistencia_pct === 'number' ? user.asistencia_pct : 95;

  // Fórmula R_j = (P_j * 0.85) + (M * 2) + (A_j * 0.15)
  const rawRj = pj * 0.85 + mvpCount * 2 + asistenciaPct * 0.15;
  const ratingCalculado = Math.round(rawRj * 10) / 10;

  return {
    id: user.id,
    nombre: user.nombre,
    posicion: pos,
    pj,
    mvpCount,
    asistenciaPct,
    ratingCalculado,
  };
}

/**
 * Algoritmo de Armado de Equipos Balanceados de Falta1
 * 4 Etapas:
 * Paso 1: Asignación Estricta de Arqueros (ARQ)
 * Paso 2: Distribución por Posición (DEF, MED, DEL) ordenados por Rj
 * Paso 3: Balanceo Numérico Draft Snake (Min-Difference)
 * Paso 4: Optimización de Intercambios (Swap Optimization) entre jugadores de igual posición
 */
export function balanceTeams(users: Usuario[]): BalancedTeamsResult {
  if (users.length === 0) {
    return {
      equipoA: [],
      equipoB: [],
      promedioNivelA: 0,
      promedioNivelB: 0,
      paridadPct: 100,
      jugadoresA: [],
      jugadoresB: [],
    };
  }

  const players = users.map(calculatePlayerStats);

  // Paso 1: Asignación Estricta de Arqueros
  const arqs = players.filter((p) => p.posicion === 'ARQ').sort((a, b) => b.ratingCalculado - a.ratingCalculado);
  const fieldPlayers = players.filter((p) => p.posicion !== 'ARQ');

  const teamA: BalancedPlayer[] = [];
  const teamB: BalancedPlayer[] = [];

  if (arqs.length >= 2) {
    // Si hay 2 o más arqueros, asigna uno a cada equipo
    teamA.push(arqs[0]);
    teamB.push(arqs[1]);
    // Si hubiese un 3er o 4to arquero, se tratan como jugadores de campo
    for (let i = 2; i < arqs.length; i++) {
      fieldPlayers.push(arqs[i]);
    }
  } else if (arqs.length === 1) {
    // Si hay 1 arquero solo, guardamos para asignarlo al equipo de menor promedio luego de los de campo
    // o al inicio provisionalmente
    teamA.push(arqs[0]);
  }

  // Paso 2: Distribución por Posiciones (DEF, MED, DEL)
  const defs = fieldPlayers.filter((p) => p.posicion === 'DEF').sort((a, b) => b.ratingCalculado - a.ratingCalculado);
  const meds = fieldPlayers.filter((p) => p.posicion === 'MED').sort((a, b) => b.ratingCalculado - a.ratingCalculado);
  const dels = fieldPlayers.filter((p) => p.posicion === 'DEL').sort((a, b) => b.ratingCalculado - a.ratingCalculado);

  const distributeBySnake = (group: BalancedPlayer[]) => {
    group.forEach((player) => {
      const sumA = teamA.reduce((acc, p) => acc + p.ratingCalculado, 0);
      const sumB = teamB.reduce((acc, p) => acc + p.ratingCalculado, 0);
      // Asignar al equipo con menor rating total o alternar si están iguales
      if (teamA.length <= teamB.length && (sumA <= sumB || teamA.length < teamB.length)) {
        teamA.push(player);
      } else {
        teamB.push(player);
      }
    });
  };

  // Distribuir defensores, luego mediocampistas, luego delanteros
  distributeBySnake(defs);
  distributeBySnake(meds);
  distributeBySnake(dels);

  // Si había solo 1 arquero y el equipo A quedó con más rating o jugadores,
  // verificar si corresponde pasarlo al B para compensar habilidad
  if (arqs.length === 1) {
    const fieldA = teamA.filter((p) => p.id !== arqs[0].id);
    const avgFieldA = fieldA.length ? fieldA.reduce((acc, p) => acc + p.ratingCalculado, 0) / fieldA.length : 0;
    const avgFieldB = teamB.length ? teamB.reduce((acc, p) => acc + p.ratingCalculado, 0) / teamB.length : 0;
    if (avgFieldA > avgFieldB && teamB.length < teamA.length) {
      // Reubicar arquero al equipo B
      const idx = teamA.findIndex((p) => p.id === arqs[0].id);
      if (idx !== -1) {
        teamA.splice(idx, 1);
        teamB.push(arqs[0]);
      }
    }
  }

  // Paso 4: Swap Optimization (Permutaciones entre jugadores de la misma posición)
  // Minimizar |sumA - sumB| intercambiando jugadores de la misma posición
  let bestDiff = Math.abs(
    teamA.reduce((acc, p) => acc + p.ratingCalculado, 0) - teamB.reduce((acc, p) => acc + p.ratingCalculado, 0)
  );

  let improved = true;
  let iterations = 0;
  while (improved && iterations < 20) {
    improved = false;
    iterations++;

    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        const pA = teamA[i];
        const pB = teamB[j];

        // Solo intercambiar si juegan en la misma posición (o ambos jugadores de campo)
        if (pA.posicion === pB.posicion) {
          // Evaluar diferencia tras swap
          const currentSumA = teamA.reduce((acc, p) => acc + p.ratingCalculado, 0);
          const currentSumB = teamB.reduce((acc, p) => acc + p.ratingCalculado, 0);

          const newSumA = currentSumA - pA.ratingCalculado + pB.ratingCalculado;
          const newSumB = currentSumB - pB.ratingCalculado + pA.ratingCalculado;
          const newDiff = Math.abs(newSumA - newSumB);

          if (newDiff < bestDiff - 0.1) {
            teamA[i] = pB;
            teamB[j] = pA;
            bestDiff = newDiff;
            improved = true;
            break;
          }
        }
      }
      if (improved) break;
    }
  }

  // Ordenar cada equipo por posición táctica para la UI: ARQ -> DEF -> MED -> DEL
  const posOrder: Record<string, number> = { ARQ: 1, DEF: 2, MED: 3, DEL: 4 };
  teamA.sort((a, b) => posOrder[a.posicion] - posOrder[b.posicion]);
  teamB.sort((a, b) => posOrder[a.posicion] - posOrder[b.posicion]);

  const sumA = teamA.reduce((acc, p) => acc + p.ratingCalculado, 0);
  const sumB = teamB.reduce((acc, p) => acc + p.ratingCalculado, 0);
  const avgA = teamA.length > 0 ? Math.round((sumA / teamA.length) * 10) / 10 : 0;
  const avgB = teamB.length > 0 ? Math.round((sumB / teamB.length) * 10) / 10 : 0;

  // Cálculo de paridad porcentual
  const maxAvg = Math.max(avgA, avgB, 1);
  const diffAvg = Math.abs(avgA - avgB);
  const paridadPct = Math.round(Math.max(85, Math.min(100, 100 - (diffAvg / maxAvg) * 100)) * 10) / 10;

  return {
    equipoA: teamA.map((p) => p.id),
    equipoB: teamB.map((p) => p.id),
    promedioNivelA: avgA,
    promedioNivelB: avgB,
    paridadPct,
    jugadoresA: teamA,
    jugadoresB: teamB,
  };
}

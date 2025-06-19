
"use client";

import { create } from 'zustand';
import type { Player, Team, Formation } from '@/types';
import { formations as defaultFormations } from '@/lib/formations';
import teamAData from '@/data/millos.json';
import teamBData from '@/data/santafe.json';

const LINEUP_STATE_KEY = 'lineupShowdownState_v1';

interface LineupState {
  teamA: Team;
  teamB: Team;
  formations: Formation[];
  selectedFormationKey: string | null;
  idealLineup: Record<string, Player | null>;
  isHydrated: boolean;

  loadInitialData: () => void;
  hydrateFromLocalStorage: () => void;
  setSelectedFormation: (formationKey: string) => void;
  setPlayerInLineup: (positionSlotKey: string, player: Player) => void;
  clearPlayerFromLineup: (positionSlotKey: string) => void;
  resetLineup: () => void;
  getEligiblePlayersForSlot: (positionSlotKey: string) => { teamAPlayers: Player[]; teamBPlayers: Player[] };
  getPlayerCountsInLineup: () => { teamACount: number, teamBCount: number, totalCount: number };
}

export const useLineupStore = create<LineupState>((set, get) => ({
  teamA: teamAData as Team,
  teamB: teamBData as Team,
  formations: defaultFormations,
  selectedFormationKey: defaultFormations.length > 0 ? defaultFormations[0].key : null,
  idealLineup: {},
  isHydrated: false,

  loadInitialData: () => {
    set({
      teamA: teamAData as Team,
      teamB: teamBData as Team,
      formations: defaultFormations,
    });
  },

  hydrateFromLocalStorage: () => {
    if (typeof window !== 'undefined') {
      const storedState = localStorage.getItem(LINEUP_STATE_KEY);
      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);
          const { selectedFormationKey, idealLineup } = parsedState;
          
          const formationExists = get().formations.some(f => f.key === selectedFormationKey);

          set({
            selectedFormationKey: formationExists ? selectedFormationKey : (get().formations.length > 0 ? get().formations[0].key : null),
            idealLineup: idealLineup || {},
            isHydrated: true,
          });
        } catch (e) {
          console.error("Error hydrating state from localStorage:", e);
          localStorage.removeItem(LINEUP_STATE_KEY);
          set({ isHydrated: true });
        }
      } else {
        set({ isHydrated: true });
      }
    }
  },

  setSelectedFormation: (formationKey: string) => {
    set({ selectedFormationKey: formationKey, idealLineup: {} });
    if (typeof window !== 'undefined') {
      const { selectedFormationKey: newKey } = get();
      localStorage.setItem(LINEUP_STATE_KEY, JSON.stringify({ selectedFormationKey: newKey, idealLineup: {} }));
    }
  },

  setPlayerInLineup: (positionSlotKey: string, player: Player) => {
    set((state) => ({
      idealLineup: {
        ...state.idealLineup,
        [positionSlotKey]: player,
      },
    }));
    if (typeof window !== 'undefined') {
      const { selectedFormationKey, idealLineup } = get();
      localStorage.setItem(LINEUP_STATE_KEY, JSON.stringify({ selectedFormationKey, idealLineup }));
    }
  },

  clearPlayerFromLineup: (positionSlotKey: string) => {
    set((state) => {
      const newIdealLineup = { ...state.idealLineup };
      delete newIdealLineup[positionSlotKey];
      return { idealLineup: newIdealLineup };
    });
    if (typeof window !== 'undefined') {
      const { selectedFormationKey, idealLineup } = get();
      localStorage.setItem(LINEUP_STATE_KEY, JSON.stringify({ selectedFormationKey, idealLineup }));
    }
  },

  resetLineup: () => {
    set({ idealLineup: {} });
    if (typeof window !== 'undefined') {
      const { selectedFormationKey } = get();
      localStorage.setItem(LINEUP_STATE_KEY, JSON.stringify({ selectedFormationKey, idealLineup: {} }));
    }
  },
  
  getEligiblePlayersForSlot: (positionSlotKey: string) => {
    const { teamA, teamB, formations, selectedFormationKey } = get();
    if (!selectedFormationKey) return { teamAPlayers: [], teamBPlayers: [] };

    const formation = formations.find(f => f.key === selectedFormationKey);
    if (!formation) return { teamAPlayers: [], teamBPlayers: [] };

    const positionSlot = formation.positions.find(p => p.key === positionSlotKey);
    if (!positionSlot) return { teamAPlayers: [], teamBPlayers: [] };

    const slotType = positionSlot.type;

    const filterBySlotType = (player: Player) => {
      if (slotType === "Mediocampista Ofensivo") {
        return player.position === "Mediocampista Ofensivo" || player.position === "Mediocampista";
      }
      return player.position === slotType;
    };

    return {
      teamAPlayers: teamA.players.filter(filterBySlotType),
      teamBPlayers: teamB.players.filter(filterBySlotType),
    };
  },

  getPlayerCountsInLineup: () => {
    const { idealLineup, teamA, teamB } = get();
    let teamACount = 0;
    let teamBCount = 0;
    let totalCount = 0;

    Object.values(idealLineup).forEach(player => {
      if (player) {
        totalCount++;
        if (player.teamId === teamA.id) {
          teamACount++;
        } else if (player.teamId === teamB.id) {
          teamBCount++;
        }
      }
    });
    return { teamACount, teamBCount, totalCount };
  }
}));

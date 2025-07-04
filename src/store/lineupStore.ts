
"use client";

import { create } from 'zustand';
import type { Player, Team, Formation, Coach } from '@/types';
import { formations as defaultFormations } from '@/lib/formations';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const LINEUP_STATE_KEY_PREFIX = '1vs1FutDraftState_v3_';

interface LineupState {
  teamA: Team | null;
  teamB: Team | null;
  formations: Formation[];
  selectedFormationKey: string | null;
  idealLineup: Record<string, Player | null>;
  isHydrated: boolean;
  isLoading: boolean;
  isComparisonMode: boolean;
  isBenchVisible: boolean;

  loadTeams: (teamAId: string, teamBId?: string) => Promise<void>;
  hydrateFromLocalStorage: (teamAId: string, teamBId?: string) => void;
  setSelectedFormation: (formationKey: string) => void;
  setPlayerInLineup: (positionSlotKey: string, player: Player) => void;
  clearPlayerFromLineup: (positionSlotKey: string) => void;
  resetLineup: () => void;
  toggleBenchVisibility: () => void;
  getEligiblePlayersForSlot: (positionSlotKey: string) => { teamAPlayers: Player[]; teamBPlayers: Player[] };
  getPlayerCountsInLineup: () => { teamACount: number, teamBCount: number, totalCount: number };
}

const getLineupStateKey = (teamAId: string, teamBId?: string) => {
    if (teamBId) {
        const ids = [teamAId, teamBId].sort();
        return `${LINEUP_STATE_KEY_PREFIX}compare_${ids[0]}_vs_${ids[1]}`;
    }
    return `${LINEUP_STATE_KEY_PREFIX}build_${teamAId}`;
};

const coachToPlayer = (coach: Coach, teamId: string): Player => ({
    id: `coach_${teamId}`,
    name: coach.name,
    jerseyNumber: 0,
    position: 'DT',
    stats: {},
    imageUrl: coach.imageUrl || '',
    imageFileId: coach.imageFileId,
    teamId: teamId,
});

export const useLineupStore = create<LineupState>((set, get) => ({
  teamA: null,
  teamB: null,
  formations: defaultFormations,
  selectedFormationKey: defaultFormations.length > 0 ? defaultFormations[0].key : null,
  idealLineup: {},
  isHydrated: false,
  isLoading: true,
  isComparisonMode: false,
  isBenchVisible: true,

  loadTeams: async (teamAId: string, teamBId?: string) => {
    set({ isLoading: true, isHydrated: false, idealLineup: {}, teamA: null, teamB: null, isComparisonMode: !!teamBId });
    
    try {
      const teamADocRef = doc(db, 'equipos', teamAId);
      const teamADoc = await getDoc(teamADocRef);
      const teamAData = teamADoc.exists() ? ({ id: teamADoc.id, ...teamADoc.data() } as Team) : null;
      
      let teamBData: Team | null = null;
      if (teamBId) {
        const teamBDocRef = doc(db, 'equipos', teamBId);
        const teamBDoc = await getDoc(teamBDocRef);
        teamBData = teamBDoc.exists() ? ({ id: teamBDoc.id, ...teamBDoc.data() } as Team) : null;
      }
      
      set({ teamA: teamAData, teamB: teamBData });

    } catch (error) {
      console.error("Error loading teams from Firestore:", error);
    } finally {
      set({ isLoading: false });
      get().hydrateFromLocalStorage(teamAId, teamBId);
    }
  },

  hydrateFromLocalStorage: (teamAId: string, teamBId?: string) => {
    if (typeof window !== 'undefined') {
      const key = getLineupStateKey(teamAId, teamBId);
      const storedState = localStorage.getItem(key);
      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);
          const { selectedFormationKey, idealLineup, isBenchVisible } = parsedState;
          
          const formationExists = get().formations.some(f => f.key === selectedFormationKey);

          set({
            selectedFormationKey: formationExists ? selectedFormationKey : (get().formations.length > 0 ? get().formations[0].key : null),
            idealLineup: idealLineup || {},
            isBenchVisible: isBenchVisible !== false,
          });
        } catch (e) {
          console.error("Error hydrating state from localStorage:", e);
          localStorage.removeItem(key);
        }
      }
      set({ isHydrated: true });
    }
  },
  
  setSelectedFormation: (formationKey: string) => {
    set({ selectedFormationKey: formationKey, idealLineup: {} });
    if (typeof window !== 'undefined') {
      const { teamA, teamB, selectedFormationKey: newKey, isBenchVisible } = get();
      if (teamA) {
        const key = getLineupStateKey(teamA.id, teamB?.id);
        localStorage.setItem(key, JSON.stringify({ selectedFormationKey: newKey, idealLineup: {}, isBenchVisible }));
      }
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
      const { teamA, teamB, selectedFormationKey, idealLineup, isBenchVisible } = get();
       if (teamA) {
        const key = getLineupStateKey(teamA.id, teamB?.id);
        localStorage.setItem(key, JSON.stringify({ selectedFormationKey, idealLineup, isBenchVisible }));
      }
    }
  },

  clearPlayerFromLineup: (positionSlotKey: string) => {
    set((state) => {
      const newIdealLineup = { ...state.idealLineup };
      delete newIdealLineup[positionSlotKey];
      return { idealLineup: newIdealLineup };
    });
    if (typeof window !== 'undefined') {
      const { teamA, teamB, selectedFormationKey, idealLineup, isBenchVisible } = get();
       if (teamA) {
        const key = getLineupStateKey(teamA.id, teamB?.id);
        localStorage.setItem(key, JSON.stringify({ selectedFormationKey, idealLineup, isBenchVisible }));
      }
    }
  },

  resetLineup: () => {
    set({ idealLineup: {}, isBenchVisible: true });
    if (typeof window !== 'undefined') {
      const { teamA, teamB, selectedFormationKey } = get();
       if (teamA) {
        const key = getLineupStateKey(teamA.id, teamB?.id);
        localStorage.setItem(key, JSON.stringify({ selectedFormationKey, idealLineup: {}, isBenchVisible: true }));
      }
    }
  },
  
  toggleBenchVisibility: () => {
    set((state) => ({ isBenchVisible: !state.isBenchVisible }));
    if (typeof window !== 'undefined') {
      const { teamA, teamB, selectedFormationKey, idealLineup, isBenchVisible } = get();
      if (teamA) {
        const key = getLineupStateKey(teamA.id, teamB?.id);
        localStorage.setItem(key, JSON.stringify({ selectedFormationKey, idealLineup, isBenchVisible }));
      }
    }
  },

  getEligiblePlayersForSlot: (positionSlotKey: string) => {
    const { teamA, teamB, formations, selectedFormationKey, idealLineup } = get();
    if (!teamA) return { teamAPlayers: [], teamBPlayers: [] };

    const otherSelectedPlayerIds = new Set(
        Object.entries(idealLineup)
            .filter(([key, p]) => p && key !== positionSlotKey)
            .map(([, p]) => p!.id)
    );

    if (positionSlotKey === 'COACH_SLOT') {
        const teamAPlayers: Player[] = [];
        if (teamA.coach && !otherSelectedPlayerIds.has(`coach_${teamA.id}`)) {
            teamAPlayers.push(coachToPlayer(teamA.coach, teamA.id));
        }
        const teamBPlayers: Player[] = [];
        if (teamB?.coach && !otherSelectedPlayerIds.has(`coach_${teamB.id}`)) {
             teamBPlayers.push(coachToPlayer(teamB.coach, teamB.id));
        }
        return { teamAPlayers, teamBPlayers };
    }

    if (positionSlotKey.startsWith('SUB_')) {
        const teamAPlayers = teamA.players.filter(p => !otherSelectedPlayerIds.has(p.id));
        const teamBPlayers = teamB ? teamB.players.filter(p => !otherSelectedPlayerIds.has(p.id)) : [];
        return { teamAPlayers, teamBPlayers };
    }

    if (!selectedFormationKey) return { teamAPlayers: [], teamBPlayers: [] };
    const formation = formations.find(f => f.key === selectedFormationKey);
    if (!formation) return { teamAPlayers: [], teamBPlayers: [] };
    const positionSlot = formation.positions.find(p => p.key === positionSlotKey);
    if (!positionSlot) return { teamAPlayers: [], teamBPlayers: [] };

    const slotType = positionSlot.type;

    const filterBySlotAndAvailability = (player: Player) => {
      return player.position === slotType && !otherSelectedPlayerIds.has(player.id);
    };

    return {
      teamAPlayers: teamA.players.filter(filterBySlotAndAvailability),
      teamBPlayers: teamB ? teamB.players.filter(filterBySlotAndAvailability) : [],
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
        if (teamA && player.teamId === teamA.id) {
          teamACount++;
        } else if (teamB && player.teamId === teamB.id) {
          teamBCount++;
        }
      }
    });
    return { teamACount, teamBCount, totalCount };
  }
}));

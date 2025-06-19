
export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  stats: {
    pace?: number;
    shooting?: number;
    passing?: number;
    dribbling?: number;
    defending?: number;
    physicality?: number;
    Partidos?: number;
    Goles?: number;
    Asistencia?: number;
    Sofascore?: number;
    'Arcos en cero'?: number;
    'Goles recibidos'?: number;
  };
  imageUrl: string; 
  teamId: 'teamA' | 'teamB';
}

export interface Team {
  id: 'teamA' | 'teamB';
  name: string;
  players: Player[];
}

export interface PositionSlot {
  key: string;
  label: string;
  type: "Portero" | "Defensa" | "Mediocampista" | "Mediocampista Ofensivo" | "Delantero";
  coordinates: { top: string; left: string };
}

export interface Formation {
  key: string;
  name: string;
  positions: PositionSlot[];
}

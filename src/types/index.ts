

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
  imageFileId?: string;
  teamId: string;
  needsPhotoUpdate?: boolean;
  nationality?: string;
  birthDate?: string;
  value?: number;
}

export interface Coach {
  name: string;
  imageUrl?: string;
  imageFileId?: string;
  nationality?: string;
}

export interface Team {
  id: string;
  name: string;
  coach?: Coach;
  players: Player[];
  logoUrl?: string;
  logoFileId?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  logoUrl: string;
  logoFileId?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface PositionSlot {
  key: string;
  label: string;
  type: "Portero" | "Defensa" | "Mediocampista" | "Delantero";
  coordinates: { top: string; left: string };
}

export interface Formation {
  key: string;
  name: string;
  positions: PositionSlot[];
}

export interface Country {
  value: string;
  label: string;
  flag: string;
}

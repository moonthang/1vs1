"use client";

import { useLineupStore } from '@/store/lineupStore';
import type { Formation } from '@/types';
import { PlayerSlot } from './PlayerSlot';
import { Card, CardContent } from './ui/card';

interface FootballPitchProps {
  onSlotClick: (positionSlotKey: string) => void;
}

export function FootballPitch({ onSlotClick }: FootballPitchProps) {
  const selectedFormationKey = useLineupStore((state) => state.selectedFormationKey);
  const formations = useLineupStore((state) => state.formations);
  const idealLineup = useLineupStore((state) => state.idealLineup);

  const currentFormation = formations.find(f => f.key === selectedFormationKey);

  if (!currentFormation) {
    return (
      <Card className="w-full h-[500px] md:h-[600px] flex items-center justify-center bg-green-700 border-4 border-white/50 shadow-xl rounded-lg">
        <p className="text-white text-xl font-headline">Selecciona una formación para ver el campo.</p>
      </Card>
    );
  }

  return (
    <Card id="football-pitch-container" className="w-full aspect-[3/4] max-w-lg mx-auto bg-green-600 border-4 border-white/50 shadow-2xl rounded-lg overflow-hidden">
      <CardContent className="relative w-full h-full p-0">
        
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] rounded-full border-2 border-white/50"></div>
        
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[2px] bg-white/50"></div>
        
        <div className="absolute top-[16.5%] left-1/2 -translate-x-1/2 w-[30%] h-[15%] rounded-b-full border-2 border-white/50 border-t-0"></div>
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[16.5%] border-2 border-white/50 border-t-0"></div>
         
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-[6.5%] border-2 border-white/50 border-t-0"></div>

        
        <div className="absolute bottom-[16.5%] left-1/2 -translate-x-1/2 w-[30%] h-[15%] rounded-t-full border-2 border-white/50 border-b-0"></div>
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[16.5%] border-2 border-white/50 border-b-0"></div>
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[30%] h-[6.5%] border-2 border-white/50 border-b-0"></div>


        {currentFormation.positions.map((pos) => (
          <PlayerSlot
            key={pos.key}
            positionSlot={pos}
            selectedPlayer={idealLineup[pos.key] || null}
            onSlotClick={onSlotClick}
          />
        ))}
      </CardContent>
    </Card>
  );
}

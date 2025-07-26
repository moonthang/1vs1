"use client";

import { useLineupStore } from '@/store/lineupStore';
import { PlayerSlot } from './PlayerSlot';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface FootballPitchProps {
  onSlotClick: (positionSlotKey: string) => void;
}

export function FootballPitch({ onSlotClick }: FootballPitchProps) {
  const { selectedFormationKey, formations, idealLineup, isBenchVisible } = useLineupStore(state => ({
    selectedFormationKey: state.selectedFormationKey,
    formations: state.formations,
    idealLineup: state.idealLineup,
    isBenchVisible: state.isBenchVisible,
  }));

  const currentFormation = formations.find(f => f.key === selectedFormationKey);
  const substituteSlots = Array.from({ length: 7 }, (_, i) => ({ key: `SUB_${i + 1}`, label: `S${i + 1}` }));
  
  if (!currentFormation) {
    return (
      <Card className="w-full h-[500px] md:h-[600px] flex items-center justify-center bg-green-700 border-4 border-white/50 shadow-xl rounded-lg">
        <p className="text-white text-xl font-headline">Selecciona una formación para ver el campo.</p>
      </Card>
    );
  }

  return (
    <div id="football-pitch-and-bench-container" className="w-full flex flex-col items-center pt-4">
      <Card className="w-full aspect-[4/5] max-w-3xl mx-auto bg-green-600 border-4 border-white/50 shadow-2xl rounded-lg overflow-hidden">
        <CardContent className="relative w-full h-full p-0">
          
          {/* Elementos para dibujar las líneas del campo de fútbol */}
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
              size="default"
            />
          ))}
        </CardContent>
      </Card>
      
      {isBenchVisible && (
        <Card className="w-full max-w-3xl mt-4 py-2 bg-card rounded-lg shadow-md">
          <CardHeader className="p-2 pt-0 pb-2">
              <CardTitle className="text-center text-primary font-headline text-base">Banquillo</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center gap-1 flex-wrap py-1 px-0">
              <PlayerSlot
                key="COACH_SLOT"
                positionSlot={{ 
                  key: 'COACH_SLOT', 
                  label: 'DT', 
                  type: 'Delantero', 
                  coordinates: { top: '0', left: '0' } 
                }}
                selectedPlayer={idealLineup['COACH_SLOT'] || null}
                onSlotClick={onSlotClick}
                size="small"
              />
            
            {substituteSlots.map(sub => (
              <PlayerSlot 
                key={sub.key} 
                positionSlot={{ 
                  key: sub.key, 
                  label: sub.label, 
                  type: 'Delantero', 
                  coordinates: { top: '0', left: '0' } 
                }}
                selectedPlayer={idealLineup[sub.key] || null}
                onSlotClick={onSlotClick}
                size="small"
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import type { Player } from '@/types';
import { PlayerCard } from '@/components/PlayerCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardDescription } from './ui/card';

interface TeamRosterContentProps {
  players: Player[] | undefined;
  teamName: string;
}

export function TeamRoster({ players, teamName }: TeamRosterContentProps) {
  if (!players || players.length === 0) {
    return (
      <CardDescription className="p-4 text-center">
        La información de los jugadores no pudo ser cargada para {teamName}.
      </CardDescription>
    );
  }

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-3">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} showStats={false} />
        ))}
      </div>
    </ScrollArea>
  );
}

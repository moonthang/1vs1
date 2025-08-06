
"use client";

import type { Player } from '@/types';
import { PlayerCard } from '@/components/PlayerCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CardDescription } from './ui/card';
import { useMemo } from 'react';

interface TeamRosterContentProps {
  players: Player[] | undefined;
  teamName: string;
}

export function TeamRoster({ players, teamName }: TeamRosterContentProps) {
  const positionOrder = useMemo(() => ['Portero', 'Defensa', 'Mediocampista', 'Delantero'], []);

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    
    return [...players].sort((a, b) => {
        const posA = positionOrder.indexOf(a.position);
        const posB = positionOrder.indexOf(b.position);
        if (posA !== posB) {
            return posA - posB;
        }
        return (a.jerseyNumber || 999) - (b.jerseyNumber || 999);
    });
  }, [players, positionOrder]);

  if (!players || players.length === 0) {
    return (
      <CardDescription className="p-4 text-center">
        La información de los jugadores no pudo ser cargada para {teamName}.
      </CardDescription>
    );
  }

  return (
    <div>
        <ScrollArea className="h-[350px] pr-4">
            {sortedPlayers.length > 0 ? (
                <div className="space-y-3">
                    {sortedPlayers.map((player) => (
                    <PlayerCard key={player.id} player={player} showStats={false} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground pt-4">No se encontraron jugadores.</p>
            )}
        </ScrollArea>
    </div>
  );
}


"use client";

import type { Player, PositionSlot as PositionSlotType } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLineupStore } from '@/store/lineupStore';
import { useState, useEffect } from 'react';
import { cn, getContrastingTextColor } from '@/lib/utils';
import { IMAGEKIT_URL_ENDPOINT } from '@/lib/imagekit';

interface PlayerSlotProps {
    positionSlot: PositionSlotType;
    selectedPlayer: Player | null;
    onSlotClick: (key: string) => void;
    size?: 'default' | 'small';
}

export function PlayerSlot({ positionSlot, selectedPlayer, onSlotClick, size = 'default' }: PlayerSlotProps) {
  const { key, label, coordinates } = positionSlot;
  const { teamA, teamB } = useLineupStore((state) => ({ teamA: state.teamA, teamB: state.teamB }));

  const teamAColor = teamA?.primaryColor || '#1A237E';
  const teamBColor = (() => {
    if (!teamB) return '#E53935';
    if (teamB.primaryColor && teamA?.primaryColor !== teamB.primaryColor) {
      return teamB.primaryColor;
    }
    return teamB.secondaryColor || '#E53935';
  })();

  const isTeamB = selectedPlayer && teamB && selectedPlayer.teamId === teamB.id;
  const playerColor = isTeamB ? teamBColor : teamAColor;

  const getImageUrl = () => {
    const placeholder = `https://placehold.co/64x64.png?text=${label.charAt(0) || 'P'}`;
    if (!selectedPlayer) return placeholder;
    
    const imageUrl = selectedPlayer.imageUrl;
    if (!imageUrl || imageUrl.startsWith('data:')) {
      return placeholder;
    }
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }

    const path = `/${selectedPlayer.teamId}/${imageUrl}`;
    return `${IMAGEKIT_URL_ENDPOINT}${path}`;
  };

  const calculatedImageUrl = getImageUrl();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [calculatedImageUrl]);

  const finalSrc = hasError 
    ? `https://placehold.co/64x64.png?text=Err` 
    : calculatedImageUrl;

  return (
    <div
      className={cn(
        "flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110",
        size === 'default' ? 'absolute -translate-x-1/2 -translate-y-1/2 w-16 sm:w-24' : 'relative w-14'
      )}
      style={size === 'default' ? { top: coordinates.top, left: coordinates.left } : {}}
      onClick={() => onSlotClick(key)}
      role="button"
      tabIndex={0}
      aria-label={`Seleccionar jugador para ${label}`}
      onKeyDown={(e) => e.key === 'Enter' && onSlotClick(key)}
    >
      {selectedPlayer ? (
        <div className="flex flex-col items-center text-center">
          <Image
            key={finalSrc}
            src={finalSrc}
            alt={selectedPlayer.name}
            width={72} 
            height={72}
            className={cn(
              `rounded-full border-2 object-cover shadow-md`,
              size === 'default' ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'
            )}
            style={{ borderColor: playerColor }}
            onError={() => setHasError(true)}
          />
          <span
            className={cn(
              `mt-1 text-[10px] leading-tight font-semibold px-1 py-0 sm:px-2 sm:py-0.5 rounded-full shadow`,
              size === 'small' && 'sm:px-1 text-[9px]'
            )}
            style={{ 
              backgroundColor: playerColor,
              color: getContrastingTextColor(playerColor) 
            }}
          >
            {selectedPlayer.name.split(' ').pop()}
          </span>
        </div>
      ) : (
        <Button
          variant="outline"
          className={cn(
            "rounded-full bg-accent/30 border-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground flex items-center justify-center shadow-md p-0",
            size === 'default' ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-10 h-10 sm:w-12 sm:h-12'
          )}
          aria-label={`Añadir jugador a ${label}`}
        >
          <span className={cn(
            "font-bold",
            size === 'default' ? 'text-sm sm:text-base' : 'text-xs'
          )}>{label}</span>
        </Button>
      )}
    </div>
  );
}

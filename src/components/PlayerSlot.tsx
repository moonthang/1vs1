
"use client";

import type { Player, PositionSlot as PositionSlotType } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLineupStore } from '@/store/lineupStore';
import { useState, useEffect } from 'react';

interface PlayerSlotProps {
  positionSlot: PositionSlotType;
  selectedPlayer: Player | null;
  onSlotClick: (positionSlotKey: string) => void;
}

const IMAGEKIT_URL_ENDPOINT = (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "").trim();

export function PlayerSlot({ positionSlot, selectedPlayer, onSlotClick }: PlayerSlotProps) {
  const { key, label, coordinates } = positionSlot;
  const { teamB } = useLineupStore((state) => ({ teamB: state.teamB }));

  const isTeamB = selectedPlayer && selectedPlayer.teamId === teamB.id;

  const getDefaultSlotImageUrl = () => `https://placehold.co/64x64.png?text=${selectedPlayer ? selectedPlayer.name.charAt(0) : label.charAt(0) || 'P'}`;

  const getInitialImageUrl = () => {
    if (selectedPlayer && IMAGEKIT_URL_ENDPOINT && selectedPlayer.imageUrl) {
      return `${IMAGEKIT_URL_ENDPOINT}/${selectedPlayer.teamId}/${selectedPlayer.imageUrl}`;
    }
    return getDefaultSlotImageUrl();
  };

  const [currentImageUrl, setCurrentImageUrl] = useState(getInitialImageUrl());

  useEffect(() => {
    setCurrentImageUrl(getInitialImageUrl());
  }, [selectedPlayer?.imageUrl, selectedPlayer?.teamId, selectedPlayer?.name, label]);

  const handleImageError = () => {
    setCurrentImageUrl(`https://placehold.co/64x64.png?text=Err`);
  };

  const isActualImageKitImage = !!(selectedPlayer && IMAGEKIT_URL_ENDPOINT && selectedPlayer.imageUrl && !currentImageUrl.startsWith('https://placehold.co'));
  const isPlaceholderImage = currentImageUrl.startsWith('https://placehold.co');
  const shouldBeUnoptimized = isActualImageKitImage || isPlaceholderImage;

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 ease-in-out transform hover:scale-110 w-16 sm:w-24"
      style={{ top: coordinates.top, left: coordinates.left }}
      onClick={() => onSlotClick(key)}
      role="button"
      tabIndex={0}
      aria-label={`Seleccionar jugador para ${label}`}
      onKeyDown={(e) => e.key === 'Enter' && onSlotClick(key)}
    >
      {selectedPlayer ? (
        <div className="flex flex-col items-center text-center">
          <Image
            src={currentImageUrl}
            alt={selectedPlayer.name}
            width={72} 
            height={72}
            className={`rounded-full border-2 ${isTeamB ? 'border-destructive' : 'border-primary'} object-cover shadow-md w-12 h-12 sm:w-16 sm:h-16`}
            onError={handleImageError}
            unoptimized={shouldBeUnoptimized}
          />
          <span className={`mt-1 text-[10px] leading-tight sm:text-xs font-semibold text-primary-foreground ${isTeamB ? 'bg-destructive' : 'bg-primary'} px-1 py-0 sm:px-2 sm:py-0.5 rounded-full shadow`}>
            {selectedPlayer.name.split(' ').pop()}
          </span>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-accent/30 border-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground flex items-center justify-center shadow-md p-0"
          aria-label={`Añadir jugador a ${label}`}
        >
          <span className="text-sm font-bold sm:text-base">{label}</span>
        </Button>
      )}
    </div>
  );
}


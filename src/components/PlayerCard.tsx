
"use client";

import type { Player } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Target, ShieldCheck, Zap, ArrowRightLeft, Dumbbell, ListChecks, Goal, Handshake, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PlayerCardProps {
  player: Player;
  onSelect?: (player: Player) => void;
  isSelected?: boolean;
  showStats?: boolean;
  isUnavailable?: boolean;
}

const StatIcon = ({ statName }: { statName: string }) => {
  const lowerStatName = statName.toLowerCase();
  switch (lowerStatName) {
    case 'pace': return <Zap className="w-4 h-4 mr-1 text-blue-500" />;
    case 'shooting': return <Target className="w-4 h-4 mr-1 text-red-500" />;
    case 'passing': return <ArrowRightLeft className="w-4 h-4 mr-1 text-green-500" />;
    case 'dribbling': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-yellow-500 lucide lucide-footprints"><path d="M4 16v-2.38c0-.9.69-1.78 1.58-1.95A2.4 2.4 0 0 1 8 13.12V16"/><path d="M4.68 12.52a2.4 2.4 0 0 1 0-4.39A2.4 2.4 0 0 1 7.3 6.88V10"/><path d="M5.32 4.68a2.4 2.4 0 0 1 4.39 0A2.4 2.4 0 0 1 11.12 7.3V10"/><path d="M17.32 12.52a2.4 2.4 0 0 1 0-4.39A2.4 2.4 0 0 1 20.03 6.9V10"/><path d="M18 16v-2.38c0-.9.69-1.78 1.58-1.95A2.4 2.4 0 0 1 22 13.12V16"/><path d="M18.68 4.68a2.4 2.4 0 0 1 4.39 0A2.4 2.4 0 0 1 21.32 7.3V10"/></svg>;
    case 'defending': return <ShieldCheck className="w-4 h-4 mr-1 text-indigo-500" />;
    case 'physicality': return <Dumbbell className="w-4 h-4 mr-1 text-purple-500" />;
    case 'partidos': return <ListChecks className="w-4 h-4 mr-1 text-gray-500" />;
    case 'goles': return <Goal className="w-4 h-4 mr-1 text-green-500" />;
    case 'asistencia': return <Handshake className="w-4 h-4 mr-1 text-teal-500" />;
    case 'sofascore': return <Star className="w-4 h-4 mr-1 text-amber-500" />;
    case 'arcos en cero': return <ShieldCheck className="w-4 h-4 mr-1 text-gray-500" />;
    case 'goles recibidos': return <Goal className="w-4 h-4 mr-1 text-red-600" />;
    default: return <User className="w-4 h-4 mr-1 text-gray-500" />;
  }
};

const preferredStatsOrder: (keyof Player['stats'])[] = ['Partidos', 'Goles', 'Asistencia', 'Arcos en cero', 'Goles recibidos', 'Sofascore'];

const IMAGEKIT_URL_ENDPOINT = (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "").trim();

export function PlayerCard({ player, onSelect, isSelected, showStats = false, isUnavailable = false }: PlayerCardProps) {
  const getDefaultPlayerImageUrl = () => 
    `https://placehold.co/${showStats ? '40x53' : '48x48'}.png?text=${player.name.charAt(0) || 'P'}`;
  
  const getInitialImageUrl = () => {
    if (IMAGEKIT_URL_ENDPOINT && player.imageUrl) {
      return `${IMAGEKIT_URL_ENDPOINT}/${player.teamId}/${player.imageUrl}`;
    }
    return getDefaultPlayerImageUrl();
  };

  const [currentImageUrl, setCurrentImageUrl] = useState(getInitialImageUrl());

  useEffect(() => {
    setCurrentImageUrl(getInitialImageUrl());
  }, [player.imageUrl, player.teamId, player.name, showStats]);

  const handleImageError = () => {
    setCurrentImageUrl(`https://placehold.co/${showStats ? '120x12' : '48x48'}.png?text=Err`);
  };

  const isActualImageKitImage = !!(IMAGEKIT_URL_ENDPOINT && player.imageUrl && !currentImageUrl.startsWith('https://placehold.co'));
  const isPlaceholderImage = currentImageUrl.startsWith('https://placehold.co');
  const shouldBeUnoptimized = isActualImageKitImage || isPlaceholderImage;

  return (
    <Card
      className={`transition-all duration-200 ease-in-out hover:shadow-lg
        ${isSelected ? 'ring-2 ring-accent' : ''}
        ${isUnavailable ? 'opacity-60 bg-muted cursor-not-allowed' : (onSelect ? 'cursor-pointer' : '')}
      `}
      onClick={isUnavailable || !onSelect ? undefined : () => onSelect(player)}
      aria-selected={isSelected}
      aria-disabled={isUnavailable}
      tabIndex={isUnavailable || !onSelect ? -1 : 0}
      onKeyDown={isUnavailable || !onSelect ? undefined : (e) => e.key === 'Enter' && onSelect(player)}
    >
      {showStats ? (
        <div className="grid grid-cols-10 gap-x-2 p-2 items-start">
          <div className="col-span-3 flex-shrink-0">
            <Image
              src={currentImageUrl}
              alt={player.name}
              width={120} 
              height={120}
              className="rounded-md object-cover aspect-[3/4] border border-muted"
              onError={handleImageError}
              unoptimized={shouldBeUnoptimized}
            />
          </div>

          <div className="col-span-3 flex flex-col justify-start">
            <CardTitle className="text-sm font-headline leading-tight mb-1">{player.name}</CardTitle>
            <CardDescription className="text-xs">#{player.jerseyNumber} - {player.position}</CardDescription>
          </div>

          {player.stats && (
            <div className="col-span-4">
              <div className="space-y-0.5 text-xs">
                {preferredStatsOrder.map((statName) => {
                  const statValue = player.stats[statName];
                  if (statValue !== undefined) {
                    return (
                      <div key={statName} className="flex items-center">
                        <StatIcon statName={statName as string} />
                        <span className="capitalize truncate">{statName}:</span>
                        <span className="ml-auto font-semibold">{statValue}</span>
                      </div>
                    );
                  }
                  return null;
                })}
                {Object.entries(player.stats)
                  .filter(([key]) => !preferredStatsOrder.includes(key as keyof Player['stats']))
                  .map(([statName, statValue]) => (
                    statValue !== undefined && (
                      <div key={statName} className="flex items-center">
                        <StatIcon statName={statName} />
                        <span className="capitalize truncate">{statName.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <span className="ml-auto font-semibold">{statValue}</span>
                      </div>
                    )
                ))}
              </div>
            </div>
          )}
          {!player.stats && <div className="col-span-4"></div>}
        </div>
      ) : (
        <CardHeader className="p-4">
          <div className="flex items-center space-x-3">
            <Image
              src={currentImageUrl}
              alt={player.name}
              width={48}
              height={48}
              className="rounded-full object-cover"
              onError={handleImageError}
              unoptimized={shouldBeUnoptimized}
            />
            <div>
              <CardTitle className="text-base font-headline">{player.name}</CardTitle>
              <CardDescription className="text-xs">#{player.jerseyNumber} - {player.position}</CardDescription>
            </div>
          </div>
        </CardHeader>
      )}
    </Card>
  );
}

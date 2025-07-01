"use client";

import type { Player } from '@/types';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Target, ShieldCheck, Zap, ArrowRightLeft, Dumbbell, ListChecks, Goal, Handshake, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { IMAGEKIT_URL_ENDPOINT } from '@/lib/imagekit';

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

export function PlayerCard({ player, onSelect, isSelected, showStats = false, isUnavailable = false }: PlayerCardProps) {
  
  const getImageUrl = () => {
    let imageUrl = player.imageUrl || '';
    
    if (!imageUrl) {
        return `https://placehold.co/${showStats ? '120x120' : '48x48'}.png?text=${player.name.charAt(0) || 'P'}`;
    }

    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
        return `${IMAGEKIT_URL_ENDPOINT}/${player.teamId}/${imageUrl}`;
    }
    
    return imageUrl;
  };

  const calculatedImageUrl = getImageUrl();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [calculatedImageUrl]);

  const finalSrc = hasError 
    ? `https://placehold.co/${showStats ? '120x120' : '48x48'}.png?text=Err` 
    : calculatedImageUrl;
  
  return (
    <Card
      className={`relative transition-all duration-200 ease-in-out hover:shadow-lg
        ${isSelected ? 'ring-2 ring-accent' : ''}
        ${isUnavailable ? 'opacity-60 bg-muted cursor-not-allowed' : (onSelect ? 'cursor-pointer' : '')}
      `}
      onClick={isUnavailable || !onSelect ? undefined : () => onSelect(player)}
      aria-selected={isSelected}
      aria-disabled={isUnavailable}
      tabIndex={isUnavailable || !onSelect ? -1 : 0}
      onKeyDown={isUnavailable || !onSelect ? undefined : (e) => (e.key === 'Enter' || e.key === ' ') && onSelect(player)}
    >
      {showStats ? (
        <div className="grid grid-cols-10 gap-x-2 p-2 items-start">
          <div className="col-span-3 flex-shrink-0">
            <Image
              key={finalSrc}
              src={finalSrc}
              alt={player.name}
              width={120} 
              height={120}
              className="rounded-md object-cover aspect-[3/4] border border-muted"
              onError={() => setHasError(true)}
            />
          </div>

          <div className="col-span-3 flex flex-col justify-start">
            <CardTitle className="text-sm font-headline leading-tight mb-1">{player.name}</CardTitle>
            <CardDescription className="text-xs">
                {player.position === 'DT' ? player.position : `#${player.jerseyNumber} - ${player.position}`}
            </CardDescription>
             {player.nationality && (
                <div className="mt-1">
                  <Image 
                      src={`https://flagcdn.com/w20/${player.nationality.toLowerCase()}.png`}
                      alt={`${player.nationality} flag`}
                      width={16}
                      height={12}
                      className="border border-muted"
                  />
                </div>
            )}
          </div>

          {showStats && (
            <div className="col-span-4">
              <div className="space-y-0.5 text-xs">
                {preferredStatsOrder.map((statName) => {
                  const isGoalkeeper = player.position === 'Portero';
                  const goalkeeperStats: (keyof Player['stats'])[] = ['Arcos en cero', 'Goles recibidos'];

                  if (!isGoalkeeper && goalkeeperStats.includes(statName)) {
                    return null;
                  }

                  const statValue = player.stats?.[statName];
                  
                  return (
                    <div key={statName} className="flex items-center">
                      <StatIcon statName={statName as string} />
                      <span className="capitalize truncate">{statName}:</span>
                      <span className="ml-auto font-semibold">
                        {statValue ?? '--'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <CardHeader className="p-4">
          <div className="flex items-center space-x-3">
            <Image
              key={finalSrc}
              src={finalSrc}
              alt={player.name}
              width={48}
              height={48}
              className="rounded-full object-cover"
              onError={() => setHasError(true)}
            />
            <div>
              <CardTitle className="text-base font-headline">{player.name}</CardTitle>
              <CardDescription className="text-xs">
                {player.position === 'DT' ? player.position : `#${player.jerseyNumber} - ${player.position}`}
              </CardDescription>
              {player.nationality && (
                  <div className="mt-1">
                    <Image 
                        src={`https://flagcdn.com/w20/${player.nationality.toLowerCase()}.png`}
                        alt={`${player.nationality} flag`}
                        width={16}
                        height={12}
                        className="border border-muted"
                    />
                  </div>
              )}
            </div>
          </div>
        </CardHeader>
      )}
    </Card>
  );
}
